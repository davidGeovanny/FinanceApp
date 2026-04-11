import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category, CategoryType } from '@/types';

function categoriesRef(uid: string) {
  return collection(db, 'users', uid, 'categories');
}

// ─── System categories seed ───────────────────────────────────────────────────

interface SeedCategory {
  nombre: string;
  icono: string;
  color: string;
  tipo: CategoryType;
}

const SYSTEM_CATEGORIES: SeedCategory[] = [
  // Gastos
  { nombre: 'Alimentación',     icono: '🍔', color: '#F5A623', tipo: 'gasto'   },
  { nombre: 'Transporte',       icono: '🚗', color: '#3D8BFF', tipo: 'gasto'   },
  { nombre: 'Entretenimiento',  icono: '🎬', color: '#A78BFA', tipo: 'gasto'   },
  { nombre: 'Salud',            icono: '💊', color: '#FF5B5B', tipo: 'gasto'   },
  { nombre: 'Hogar',            icono: '🏠', color: '#22D3EE', tipo: 'gasto'   },
  { nombre: 'Ropa',             icono: '👕', color: '#F472B6', tipo: 'gasto'   },
  { nombre: 'Educación',        icono: '📚', color: '#34D399', tipo: 'gasto'   },
  { nombre: 'Servicios',        icono: '💡', color: '#FBBF24', tipo: 'gasto'   },
  { nombre: 'Suscripciones',    icono: '📱', color: '#60A5FA', tipo: 'gasto'   },
  { nombre: 'Otros gastos',     icono: '💸', color: '#94A3B8', tipo: 'gasto'   },
  // Ingresos
  { nombre: 'Nómina',           icono: '💼', color: '#1DB87A', tipo: 'ingreso' },
  { nombre: 'Freelance',        icono: '💻', color: '#1DB87A', tipo: 'ingreso' },
  { nombre: 'Inversiones',      icono: '📈', color: '#A78BFA', tipo: 'ingreso' },
  { nombre: 'Otros ingresos',   icono: '💰', color: '#1DB87A', tipo: 'ingreso' },
  // Ambos
  { nombre: 'Transferencia',    icono: '🔄', color: '#64748B', tipo: 'ambos'   },
];

export async function seedSystemCategories(uid: string): Promise<void> {
  // Check if already seeded using a sentinel doc
  const sentinelRef = doc(db, 'users', uid, 'categories', '__seeded__');
  const sentinel = await getDoc(sentinelRef);
  if (sentinel.exists()) return;

  const batch = SYSTEM_CATEGORIES.map((cat) =>
    addDoc(categoriesRef(uid), {
      ...cat,
      sistema: true,
      createdAt: serverTimestamp(),
    })
  );
  await Promise.all(batch);
  await setDoc(sentinelRef, { at: serverTimestamp() });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getCategories(uid: string): Promise<Category[]> {
  const q = query(categoriesRef(uid), orderBy('nombre'));
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.id !== '__seeded__')
    .map((d) => ({ id: d.id, ...d.data() }) as Category);
}

export async function createCategory(
  uid: string,
  data: Omit<Category, 'id' | 'createdAt' | 'sistema'>
): Promise<Category> {
  const ref = await addDoc(categoriesRef(uid), {
    ...data,
    sistema: false,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    ...data,
    sistema: false,
    createdAt: serverTimestamp() as Category['createdAt'],
  };
}

export async function updateCategory(
  uid: string,
  categoryId: string,
  data: Partial<Omit<Category, 'id' | 'createdAt' | 'sistema'>>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'categories', categoryId);
  await updateDoc(ref, data);
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'categories', categoryId);
  await deleteDoc(ref);
}