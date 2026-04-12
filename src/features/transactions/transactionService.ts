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

// ─── Balance helpers ──────────────────────────────────────────────────────────

/**
 * Returns the balance delta that a transaction applies to its origin account.
 * Ingreso → +monto, Gasto → -monto, Transferencia → -monto (origin side).
 */
function originDelta(tipo: TransactionType, monto: number): number {
  if (tipo === 'ingreso') return monto;
  return -monto; // gasto or transferencia origin
}

/**
 * Applies balance changes for a transaction inside an existing WriteBatch.
 * Pass a negative multiplier (-1) to reverse the effect (used on delete/update).
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
    const currentOrigin = originSnap.data().saldo_inicial as number;
    batch.update(originRef, {
      saldo_inicial: currentOrigin + originDelta(tipo, monto) * multiplier,
      updatedAt: serverTimestamp(),
    });
  }

  // Transferencia: also update destination account
  if (tipo === 'transferencia' && cuentaDestinoId) {
    const destRef = accountRef(uid, cuentaDestinoId);
    const destSnap = await getDoc(destRef);
    if (destSnap.exists()) {
      const currentDest = destSnap.data().saldo_inicial as number;
      batch.update(destRef, {
        saldo_inicial: currentDest + monto * multiplier,
        updatedAt: serverTimestamp(),
      });
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

/**
 * Updates a transaction and recalculates account balances:
 * 1. Reverses the old transaction's balance effect.
 * 2. Applies the new transaction's balance effect.
 * Both steps happen in a single batch — atomic.
 */
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

  // 2 — apply new effect (merge old fields with updated ones)
  const next = { ...old, ...data };
  await applyBalanceChanges(
    uid, batch, next.tipo, next.monto, next.cuentaId, next.cuentaDestinoId, 1
  );

  batch.update(ref, { ...data, updatedAt: serverTimestamp() });

  await batch.commit();
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes a transaction and reverses its balance effect on the affected accounts.
 */
export async function deleteTransaction(uid: string, txId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'transactions', txId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const tx = snap.data() as Transaction;
  const batch = writeBatch(db);

  // Reverse the balance effect before deleting
  await applyBalanceChanges(
    uid, batch, tx.tipo, tx.monto, tx.cuentaId, tx.cuentaDestinoId, -1
  );

  batch.delete(ref);

  await batch.commit();
}