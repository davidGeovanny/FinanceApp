import { Timestamp } from 'firebase/firestore';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  moneda: string;
  tema: 'dark' | 'light';
  createdAt: Timestamp;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export type AccountType =
  | 'banco'
  | 'tarjeta_credito'
  | 'efectivo'
  | 'inversion_vista'
  | 'inversion_congelada';

export interface Account {
  id: string;
  nombre: string;
  tipo: AccountType;
  saldo_inicial: number;
  moneda: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Category ────────────────────────────────────────────────────────────────

export type CategoryType = 'ingreso' | 'gasto' | 'ambos';

export interface Category {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  tipo: CategoryType;
  sistema: boolean;
  createdAt: Timestamp;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType = 'ingreso' | 'gasto' | 'transferencia';

export interface Transaction {
  id: string;
  tipo: TransactionType;
  monto: number;
  moneda: string;
  categoriaId: string;
  cuentaId: string;
  cuentaDestinoId?: string;
  fecha: Timestamp;
  notas?: string;
  etiquetas: string[];
  installmentPlanId?: string;
  monedaOrigen?: string;
  montoOrigen?: number;
  tipoCambio?: number;
  cfdiXmlUrl?: string;
  cfdiPdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── InstallmentPlan (MSI) ───────────────────────────────────────────────────

export type InstallmentStatus = 'pendiente' | 'pagada' | 'parcial';

export interface Installment {
  numero: number;
  montoEsperado: number;
  montoPagado: number;
  fecha: Timestamp;
  estado: InstallmentStatus;
}

export interface InstallmentPlan {
  id: string;
  transactionId: string;
  montoTotal: number;
  numeroCuotas: number;
  montoCuota: number;
  cuotasPagadas: number;
  liquidadoAnticipadamente: boolean;
  fechaLiquidacion?: Timestamp;
  cuotas: Installment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Saving / Goal ───────────────────────────────────────────────────────────

export type SavingStatus = 'activo' | 'completado' | 'vencido' | 'archivado';

export interface Saving {
  id: string;
  nombre: string;
  objetivo: number;
  actual: number;
  fechaLimite?: Timestamp;
  estado: SavingStatus;
  color?: string;
  icono?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Investment ──────────────────────────────────────────────────────────────

export type InvestmentLiquidity = 'a_la_vista' | 'congelada';

export interface Valuation {
  fecha: Timestamp;
  valor: number;
}

export interface Investment {
  id: string;
  nombre: string;
  tipo: string;
  montoInvertido: number;
  liquidez: InvestmentLiquidity;
  valuaciones: Valuation[];
  notas?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Computed / UI helpers ───────────────────────────────────────────────────

export interface InvestmentMetrics {
  valorActual: number;
  gananciaTotal: number;
  gananciaTotalPct: number;
  rendimientoPeriodo: number;
  rendimientoPeriodoPct: number;
}

export interface DashboardSummary {
  balanceNeto: number;
  totalIngresos: number;
  totalGastos: number;
  totalAhorros: number;
  totalInversiones: number;
}

// ─── Report view mode ────────────────────────────────────────────────────────

export type ReportMode = 'flujo_caja' | 'devengado';