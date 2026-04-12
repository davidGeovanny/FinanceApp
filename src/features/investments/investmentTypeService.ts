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
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InvestmentType } from '@/types';

function typesRef(uid: string) {
  return collection(db, 'users', uid, 'investmentTypes');
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const DEFAULT_TYPES = [
  { nombre: 'CETES',        icono: '🏛️' },
  { nombre: 'Finsus',       icono: '📊' },
  { nombre: 'SuperTasas',   icono: '💹' },
  { nombre: 'NU',           icono: '🟣' },
  { nombre: 'Mercado Pago', icono: '💙' },
];

export async function seedInvestmentTypes(uid: string): Promise<InvestmentType[]> {
  const sentinelRef = doc(db, 'users', uid, 'investmentTypes', '__seeded__');
  const sentinel = await getDoc(sentinelRef);
  if (sentinel.exists()) return getInvestmentTypes(uid);

  const created: InvestmentType[] = [];

  for (const t of DEFAULT_TYPES) {
    const ref = await addDoc(typesRef(uid), {
      ...t,
      createdAt: serverTimestamp(),
    });
    created.push({
      id: ref.id,
      ...t,
      createdAt: serverTimestamp() as InvestmentType['createdAt'],
    });
  }

  await setDoc(sentinelRef, { at: serverTimestamp() });
  return created;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getInvestmentTypes(uid: string): Promise<InvestmentType[]> {
  const q = query(typesRef(uid), orderBy('nombre'));
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.id !== '__seeded__')
    .map((d) => ({ id: d.id, ...d.data() }) as InvestmentType);
}

export async function createInvestmentType(
  uid: string,
  data: Pick<InvestmentType, 'nombre' | 'icono'>
): Promise<InvestmentType> {
  const ref = await addDoc(typesRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    ...data,
    createdAt: serverTimestamp() as InvestmentType['createdAt'],
  };
}

export async function updateInvestmentType(
  uid: string,
  typeId: string,
  data: Pick<InvestmentType, 'nombre' | 'icono'>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'investmentTypes', typeId);
  await updateDoc(ref, data);
}

export async function deleteInvestmentType(uid: string, typeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'investmentTypes', typeId);
  await deleteDoc(ref);
}