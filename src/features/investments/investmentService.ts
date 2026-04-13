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
  arrayUnion,
  Timestamp,
  writeBatch,
  getDoc,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Investment, InvestmentMetrics, Valuation } from '@/types';

function investmentsRef(uid: string) {
  return collection(db, 'users', uid, 'investments');
}

function accountsRef(uid: string) {
  return collection(db, 'users', uid, 'accounts');
}

export async function getInvestments(uid: string): Promise<Investment[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  const q = query(investmentsRef(uid), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      esTransaccional: false,
      moneda: 'MXN',
      ...data,
    } as Investment;
  });
}

export type InvestmentInput = Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>;

export async function createInvestment(
  uid: string,
  data: InvestmentInput
): Promise<Investment> {
  // Seed first valuation from montoInvertido if none provided
  const valuaciones: Valuation[] =
    data.valuaciones.length > 0
      ? data.valuaciones
      : [{ fecha: Timestamp.now(), valor: data.montoInvertido }];

  const ref = await addDoc(investmentsRef(uid), {
    ...data,
    valuaciones,
    esTransaccional: data.esTransaccional ?? false,
    moneda: data.moneda ?? 'MXN',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    ...data,
    valuaciones,
    createdAt: serverTimestamp() as Investment['createdAt'],
    updatedAt: serverTimestamp() as Investment['updatedAt'],
  };
}

export async function updateInvestment(
  uid: string,
  investmentId: string,
  data: Partial<InvestmentInput>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'investments', investmentId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteInvestment(uid: string, investmentId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'investments', investmentId);
  await deleteDoc(ref);
}

// ─── Add valuation ────────────────────────────────────────────────────────────
// If the investment is transaccional, also updates saldo_inicial on the linked
// virtual account (matched by investmentId field on the account document).

export async function addValuation(
  uid: string,
  investmentId: string,
  valor: number
): Promise<void> {
  const invRef = doc(db, 'users', uid, 'investments', investmentId);
  const newValuation: Valuation = { fecha: Timestamp.now(), valor };

  const batch = writeBatch(db);

  batch.update(invRef, {
    valuaciones: arrayUnion(newValuation),
    updatedAt: serverTimestamp(),
  });

  // Sync virtual account balance if investment is transaccional
  const invSnap = await getDoc(invRef);
  if (invSnap.exists()) {
    const inv = invSnap.data() as Investment;
    if (inv.esTransaccional) {
      // Find the account linked to this investment
      const q = query(accountsRef(uid), where('investmentId', '==', investmentId));
      const accountsSnap = await getDocs(q);
      accountsSnap.forEach((accountDoc) => {
        batch.update(accountDoc.ref, {
          saldo_inicial: valor,
          updatedAt: serverTimestamp(),
        });
      });
    }
  }

  await batch.commit();
}

// ─── Computed metrics ─────────────────────────────────────────────────────────

export function calcMetrics(investment: Investment): InvestmentMetrics {
  const { valuaciones, montoInvertido } = investment;

  if (valuaciones.length === 0) {
    return {
      valorActual: montoInvertido,
      gananciaTotal: 0,
      gananciaTotalPct: 0,
      rendimientoPeriodo: 0,
      rendimientoPeriodoPct: 0,
    };
  }

  // Sort by date ascending to get last and second-to-last
  const sorted = [...valuaciones].sort(
    (a, b) => a.fecha.toMillis() - b.fecha.toMillis()
  );

  const valorActual = sorted[sorted.length - 1].valor;
  const valorAnterior = sorted.length > 1 ? sorted[sorted.length - 2].valor : montoInvertido;

  const gananciaTotal = valorActual - montoInvertido;
  const gananciaTotalPct = montoInvertido > 0 ? (gananciaTotal / montoInvertido) * 100 : 0;

  const rendimientoPeriodo = valorActual - valorAnterior;
  const rendimientoPeriodoPct =
    valorAnterior > 0 ? (rendimientoPeriodo / valorAnterior) * 100 : 0;

  return {
    valorActual,
    gananciaTotal,
    gananciaTotalPct,
    rendimientoPeriodo,
    rendimientoPeriodoPct,
  };
}