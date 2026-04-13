import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account } from '@/types';

function accountsRef(uid: string) {
  return collection(db, 'users', uid, 'accounts');
}

export async function getAccounts(uid: string): Promise<Account[]> {
  const q = query(accountsRef(uid), orderBy('nombre'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account);
}

export async function createAccount(
  uid: string,
  data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Account> {
  const ref = await addDoc(accountsRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    ...data,
    createdAt: serverTimestamp() as Account['createdAt'],
    updatedAt: serverTimestamp() as Account['updatedAt'],
  };
}

export async function updateAccount(
  uid: string,
  accountId: string,
  data: Partial<Omit<Account, 'id' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'accounts', accountId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAccount(uid: string, accountId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'accounts', accountId);
  await deleteDoc(ref);
}

/**
 * Finds the virtual account linked to a given investment, if any.
 */
export async function getAccountByInvestmentId(
  uid: string,
  investmentId: string
): Promise<Account | null> {
  const q = query(accountsRef(uid), where('investmentId', '==', investmentId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Account;
}