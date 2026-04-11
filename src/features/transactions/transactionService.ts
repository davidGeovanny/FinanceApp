import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
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

  if (filters?.tipo) {
    constraints.push(where('tipo', '==', filters.tipo));
  }
  if (filters?.cuentaId) {
    constraints.push(where('cuentaId', '==', filters.cuentaId));
  }
  if (filters?.categoriaId) {
    constraints.push(where('categoriaId', '==', filters.categoriaId));
  }
  if (filters?.desde) {
    constraints.push(where('fecha', '>=', Timestamp.fromDate(filters.desde)));
  }
  if (filters?.hasta) {
    constraints.push(where('fecha', '<=', Timestamp.fromDate(filters.hasta)));
  }

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

  const accountRef = doc(db, 'users', uid, 'accounts', data.cuentaId);
  const accountSnap = await getDoc(accountRef);

  if (accountSnap.exists()) {
    const current = accountSnap.data().saldo_inicial as number;

    if (data.tipo === 'transferencia' && data.cuentaDestinoId) {
      batch.update(accountRef, {
        saldo_inicial: current - data.monto,
        updatedAt: serverTimestamp(),
      });
      const destRef = doc(db, 'users', uid, 'accounts', data.cuentaDestinoId);
      const destSnap = await getDoc(destRef);
      if (destSnap.exists()) {
        batch.update(destRef, {
          saldo_inicial: (destSnap.data().saldo_inicial as number) + data.monto,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const delta = data.tipo === 'ingreso' ? data.monto : -data.monto;
      batch.update(accountRef, {
        saldo_inicial: current + delta,
        updatedAt: serverTimestamp(),
      });
    }
  }

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
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTransaction(uid: string, txId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'transactions', txId);
  await deleteDoc(ref);
}