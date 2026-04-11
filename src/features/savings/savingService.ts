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
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Saving, SavingStatus } from '@/types';

function savingsRef(uid: string) {
  return collection(db, 'users', uid, 'savings');
}

export async function getSavings(uid: string): Promise<Saving[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  const q = query(savingsRef(uid), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Saving);
}

export type SavingInput = Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>;

export async function createSaving(uid: string, data: SavingInput): Promise<Saving> {
  const ref = await addDoc(savingsRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    ...data,
    createdAt: serverTimestamp() as Saving['createdAt'],
    updatedAt: serverTimestamp() as Saving['updatedAt'],
  };
}

export async function updateSaving(
  uid: string,
  savingId: string,
  data: Partial<SavingInput>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'savings', savingId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSaving(uid: string, savingId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'savings', savingId);
  await deleteDoc(ref);
}

// ─── Abonar / Retirar ─────────────────────────────────────────────────────────

function resolveEstado(nuevoActual: number, objetivo: number): SavingStatus {
  if (nuevoActual >= objetivo) return 'completado';
  return 'activo';
}

export async function abonarSaving(
  uid: string,
  savingId: string,
  nuevoActual: number,
  objetivo: number
): Promise<void> {
  const ref = doc(db, 'users', uid, 'savings', savingId);
  const estado = resolveEstado(nuevoActual, objetivo);
  await updateDoc(ref, { actual: nuevoActual, estado, updatedAt: serverTimestamp() });
}

export async function retirarSaving(
  uid: string,
  savingId: string,
  nuevoActual: number,
  objetivo: number
): Promise<void> {
  const ref = doc(db, 'users', uid, 'savings', savingId);
  const actual = Math.max(0, nuevoActual);
  const estado = resolveEstado(actual, objetivo);
  await updateDoc(ref, { actual, estado, updatedAt: serverTimestamp() });
}

// ─── Estado transitions ───────────────────────────────────────────────────────

export async function archivarSaving(uid: string, savingId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'savings', savingId);
  await updateDoc(ref, { estado: 'archivado' as SavingStatus, updatedAt: serverTimestamp() });
}

export async function desarchivarSaving(uid: string, savingId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'savings', savingId);
  await updateDoc(ref, { estado: 'activo' as SavingStatus, updatedAt: serverTimestamp() });
}

// ─── Check for expired goals (client-side) ────────────────────────────────────

export function isVencida(saving: Saving): boolean {
  if (!saving.fechaLimite) return false;
  if (saving.estado === 'completado' || saving.estado === 'archivado') return false;
  return saving.fechaLimite.toDate() < new Date();
}