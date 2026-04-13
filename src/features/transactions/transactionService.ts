import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
  getDoc,
  arrayUnion,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction, TransactionType } from '@/types';

function txRef(uid: string) {
  return collection(db, 'users', uid, 'transactions');
}

function accountRef(uid: string, accountId: string) {
  return doc(db, 'users', uid, 'accounts', accountId);
}

function investmentRef(uid: string, investmentId: string) {
  return doc(db, 'users', uid, 'investments', investmentId);
}

// ─── Balance helpers ──────────────────────────────────────────────────────────

function originDelta(tipo: TransactionType, monto: number): number {
  if (tipo === 'ingreso') return monto;
  return -monto;
}

/**
 * Applies balance changes for a transaction inside an existing WriteBatch.
 *
 * If an account has `investmentId`, instead of updating `saldo_inicial` directly,
 * we append a new valuation to the linked investment (Opción A).
 * The account's saldo_inicial is also updated so the UI stays in sync immediately
 * (it will be overwritten next time addValuation is called, but keeps consistency).
 */
async function applyBalanceChanges(
  uid: string,
  batch: ReturnType<typeof writeBatch>,
  tipo: TransactionType,
  monto: number,
  cuentaId: string,
  cuentaDestinoId: string | undefined,
  multiplier: 1 | -1
): Promise<void> {
  const originRef = accountRef(uid, cuentaId);
  const originSnap = await getDoc(originRef);

  if (originSnap.exists()) {
    const originData = originSnap.data();
    const currentOrigin = originData.saldo_inicial as number;
    const newOriginBalance = currentOrigin + originDelta(tipo, monto) * multiplier;

    // Always update saldo_inicial on the account for immediate UI consistency
    batch.update(originRef, {
      saldo_inicial: newOriginBalance,
      updatedAt: serverTimestamp(),
    });

    // If linked to an investment, also append a new valuation
    if (originData.investmentId) {
      const invRef = investmentRef(uid, originData.investmentId);
      const newValuation = { fecha: Timestamp.now(), valor: newOriginBalance };
      batch.update(invRef, {
        valuaciones: arrayUnion(newValuation),
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Transferencia: also update destination account
  if (tipo === 'transferencia' && cuentaDestinoId) {
    const destRef = accountRef(uid, cuentaDestinoId);
    const destSnap = await getDoc(destRef);
    if (destSnap.exists()) {
      const destData = destSnap.data();
      const currentDest = destData.saldo_inicial as number;
      const newDestBalance = currentDest + monto * multiplier;

      batch.update(destRef, {
        saldo_inicial: newDestBalance,
        updatedAt: serverTimestamp(),
      });

      // If destination is also a transaccional investment, append valuation
      if (destData.investmentId) {
        const invRef = investmentRef(uid, destData.investmentId);
        const newValuation = { fecha: Timestamp.now(), valor: newDestBalance };
        batch.update(invRef, {
          valuaciones: arrayUnion(newValuation),
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  tipo?: TransactionType;
  cuentaId?: string;
  categoriaId?: string;
  desde?: Date;
  hasta?: Date;
}

export async function getTransactions(
  uid: string,
  filters?: TransactionFilters
): Promise<Transaction[]> {
  const constraints: QueryConstraint[] = [orderBy('fecha', 'desc')];

  if (filters?.tipo)        constraints.push(where('tipo',        '==', filters.tipo));
  if (filters?.cuentaId)    constraints.push(where('cuentaId',    '==', filters.cuentaId));
  if (filters?.categoriaId) constraints.push(where('categoriaId', '==', filters.categoriaId));
  if (filters?.desde)       constraints.push(where('fecha', '>=', Timestamp.fromDate(filters.desde)));
  if (filters?.hasta)       constraints.push(where('fecha', '<=', Timestamp.fromDate(filters.hasta)));

  const q = query(txRef(uid), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

export async function createTransaction(
  uid: string,
  data: TransactionInput
): Promise<Transaction> {
  const batch = writeBatch(db);

  const newRef = doc(txRef(uid));
  batch.set(newRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await applyBalanceChanges(
    uid, batch, data.tipo, data.monto, data.cuentaId, data.cuentaDestinoId, 1
  );

  await batch.commit();

  return {
    id: newRef.id,
    ...data,
    createdAt: serverTimestamp() as Transaction['createdAt'],
    updatedAt: serverTimestamp() as Transaction['updatedAt'],
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateTransaction(
  uid: string,
  txId: string,
  data: Partial<TransactionInput>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'transactions', txId);
  const oldSnap = await getDoc(ref);

  if (!oldSnap.exists()) return;

  const old = oldSnap.data() as Transaction;
  const batch = writeBatch(db);

  // 1 — reverse old effect
  await applyBalanceChanges(
    uid, batch, old.tipo, old.monto, old.cuentaId, old.cuentaDestinoId, -1
  );

  // 2 — apply new effect
  const next = { ...old, ...data };
  await applyBalanceChanges(
    uid, batch, next.tipo, next.monto, next.cuentaId, next.cuentaDestinoId, 1
  );

  batch.update(ref, { ...data, updatedAt: serverTimestamp() });

  await batch.commit();
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTransaction(uid: string, txId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'transactions', txId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const tx = snap.data() as Transaction;
  const batch = writeBatch(db);

  await applyBalanceChanges(
    uid, batch, tx.tipo, tx.monto, tx.cuentaId, tx.cuentaDestinoId, -1
  );

  batch.delete(ref);

  await batch.commit();
}