import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Transaction, Account, Category } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const TIPO_SIGN  = { ingreso: '+', gasto: '-', transferencia: '' } as const;
const TIPO_COLOR = {
  ingreso:       'text-[#1DB87A]',
  gasto:         'text-[#FF5B5B]',
  transferencia: 'text-[#8899AA]',
} as const;

export function RecentTransactions({ transactions, accounts, categories }: RecentTransactionsProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);

  if (transactions.length === 0) {
    return (
      <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4">
        <p className="text-sm font-medium text-[#F0F4F8] mb-3">Últimas transacciones</p>
        <p className="text-xs text-[#8899AA] text-center py-4">Sin transacciones aún</p>
      </div>
    );
  }

  return (
    <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#F0F4F8]">Últimas transacciones</p>
        <Link
          to="/transactions"
          className="flex items-center gap-1 text-xs text-[#3D8BFF] hover:underline"
        >
          Ver todas <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-0">
        {transactions.map((tx, i) => {
          const account  = accounts.find((a) => a.id === tx.cuentaId);
          const category = categories.find((c) => c.id === tx.categoriaId);

          return (
            <div key={tx.id}>
              <div className="flex items-center gap-3 py-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${category?.color ?? '#64748B'}20` }}
                >
                  {tx.tipo === 'transferencia' ? '🔄' : (category?.icono ?? '💸')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#F0F4F8] truncate">
                    {tx.notas || category?.nombre || 'Sin descripción'}
                  </p>
                  <p className="text-xs text-[#8899AA]">{account?.nombre ?? '—'}</p>
                </div>
                <p className={`text-xs font-semibold tabular-nums flex-shrink-0 ${TIPO_COLOR[tx.tipo]}`}>
                  {TIPO_SIGN[tx.tipo]}{fmt(tx.monto)}
                </p>
              </div>
              {i < transactions.length - 1 && <div className="h-px bg-white/5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}