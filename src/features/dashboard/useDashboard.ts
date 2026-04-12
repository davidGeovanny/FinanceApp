import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/useTransactions';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useSavings } from '@/features/savings/useSavings';
import { useInvestments } from '@/features/investments/useInvestments';
import { calcMetrics } from '@/features/investments/investmentService';
import { isVencida } from '@/features/savings/savingService';

export function useDashboard() {
  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const { data: accounts = [],     isLoading: loadingAcc } = useAccounts();
  const { data: savings = [],      isLoading: loadingSav } = useSavings();
  const { data: investments = [],  isLoading: loadingInv } = useInvestments();

  const isLoading = loadingTx || loadingAcc || loadingSav || loadingInv;

  const summary = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Monthly transactions ──────────────────────────────────────────────────
    const monthlyTx = transactions.filter(
      (tx) => tx.fecha.toDate() >= startOfMonth
    );

    const ingresosMes = monthlyTx
      .filter((tx) => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + tx.monto, 0);

    const gastosMes = monthlyTx
      .filter((tx) => tx.tipo === 'gasto')
      .reduce((sum, tx) => sum + tx.monto, 0);

    // ── Account balances ──────────────────────────────────────────────────────
    const totalCuentas = accounts
      .filter((a) => a.moneda === 'MXN')
      .reduce((sum, a) => sum + a.saldo_inicial, 0);

    // ── Savings ───────────────────────────────────────────────────────────────
    const activeSavings = savings.filter(
      (s) => s.estado === 'activo' && !isVencida(s)
    );
    const totalAhorros = activeSavings.reduce((sum, s) => sum + s.actual, 0);

    // ── Investments ───────────────────────────────────────────────────────────
    const totalInversiones = investments.reduce(
      (sum, inv) => sum + calcMetrics(inv).valorActual,
      0
    );

    // ── Net worth ─────────────────────────────────────────────────────────────
    const patrimonioNeto = totalCuentas + totalInversiones;

    // ── Recent transactions (last 5) ──────────────────────────────────────────
    const recentTransactions = [...transactions]
      .sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis())
      .slice(0, 5);

    // ── Top active savings (up to 3) ──────────────────────────────────────────
    const topSavings = activeSavings.slice(0, 3);

    return {
      ingresosMes,
      gastosMes,
      balanceMes: ingresosMes - gastosMes,
      totalCuentas,
      totalAhorros,
      totalInversiones,
      patrimonioNeto,
      recentTransactions,
      topSavings,
      activeSavingsCount: activeSavings.length,
    };
  }, [transactions, accounts, savings, investments]);

  return { summary, isLoading };
}