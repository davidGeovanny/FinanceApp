import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/useTransactions';
import { useCategories } from '@/features/categories/useCategories';

export interface MonthlyBar {
  mes: string;       // 'Ene', 'Feb', etc.
  ingresos: number;
  gastos: number;
}

export interface CategorySlice {
  categoryId: string;
  nombre: string;
  icono: string;
  color: string;
  total: number;
  porcentaje: number;
}

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function useReports(year: number, month: number) {
  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const { data: categories = [],   isLoading: loadingCat } = useCategories();

  const isLoading = loadingTx || loadingCat;

  // ── Last 6 months bar chart data ─────────────────────────────────────────
  const barData: MonthlyBar[] = useMemo(() => {
    const bars: MonthlyBar[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const start = new Date(y, m, 1);
      const end   = new Date(y, m + 1, 0, 23, 59, 59);

      const monthTx = transactions.filter((tx) => {
        const date = tx.fecha.toDate();
        return date >= start && date <= end;
      });

      bars.push({
        mes: MONTH_LABELS[m],
        ingresos: monthTx
          .filter((tx) => tx.tipo === 'ingreso')
          .reduce((s, tx) => s + tx.monto, 0),
        gastos: monthTx
          .filter((tx) => tx.tipo === 'gasto')
          .reduce((s, tx) => s + tx.monto, 0),
      });
    }

    return bars;
  }, [transactions, year, month]);

  // ── Selected month category breakdown (gastos) ───────────────────────────
  const categoryData: CategorySlice[] = useMemo(() => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0, 23, 59, 59);

    const monthGastos = transactions.filter(
      (tx) => tx.tipo === 'gasto' && tx.fecha.toDate() >= start && tx.fecha.toDate() <= end
    );

    const totalGastos = monthGastos.reduce((s, tx) => s + tx.monto, 0);
    if (totalGastos === 0) return [];

    const byCategory: Record<string, number> = {};
    for (const tx of monthGastos) {
      byCategory[tx.categoriaId] = (byCategory[tx.categoriaId] ?? 0) + tx.monto;
    }

    return Object.entries(byCategory)
      .map(([categoryId, total]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          nombre:  cat?.nombre  ?? 'Sin categoría',
          icono:   cat?.icono   ?? '💸',
          color:   cat?.color   ?? '#64748B',
          total,
          porcentaje: (total / totalGastos) * 100,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories, year, month]);

  // ── Selected month totals ────────────────────────────────────────────────
  const monthTotals = useMemo(() => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0, 23, 59, 59);

    const monthTx = transactions.filter((tx) => {
      const date = tx.fecha.toDate();
      return date >= start && date <= end && tx.tipo !== 'transferencia';
    });

    return {
      ingresos: monthTx.filter((tx) => tx.tipo === 'ingreso').reduce((s, tx) => s + tx.monto, 0),
      gastos:   monthTx.filter((tx) => tx.tipo === 'gasto').reduce((s, tx) => s + tx.monto, 0),
    };
  }, [transactions, year, month]);

  return { barData, categoryData, monthTotals, isLoading };
}