import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import type { Transaction, Account, Category } from '@/types';
import { useDeleteTransaction } from './useTransactions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface TransactionItemProps {
  tx: Transaction;
  accounts: Account[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
}

const TIPO_SIGN = { ingreso: '+', gasto: '-', transferencia: '' } as const;
const TIPO_COLOR = {
  ingreso:       'text-[#1DB87A]',
  gasto:         'text-[#FF5B5B]',
  transferencia: 'text-[#8899AA]',
} as const;

export function TransactionItem({ tx, accounts, categories, onEdit }: TransactionItemProps) {
  const [confirming, setConfirming] = useState(false);
  const deleteTx = useDeleteTransaction();

  const account     = accounts.find((a) => a.id === tx.cuentaId);
  const destAccount = tx.cuentaDestinoId
    ? accounts.find((a) => a.id === tx.cuentaDestinoId)
    : null;
  const category = categories.find((c) => c.id === tx.categoriaId);

  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(tx.monto);

  const description = tx.notas || category?.nombre || 'Sin descripción';

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] rounded-xl transition-colors group">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: `${category?.color ?? '#64748B'}20` }}
        >
          {tx.tipo === 'transferencia' ? '🔄' : (category?.icono ?? '💸')}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#F0F4F8] truncate">{description}</p>
          <p className="text-xs text-[#8899AA] truncate">
            {tx.tipo === 'transferencia'
              ? `${account?.nombre ?? '—'} → ${destAccount?.nombre ?? '—'}`
              : account?.nombre ?? '—'}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-semibold tabular-nums ${TIPO_COLOR[tx.tipo]}`}>
            {TIPO_SIGN[tx.tipo]}{formatted}
          </p>
          {tx.etiquetas?.length > 0 && (
            <p className="text-xs text-[#8899AA] truncate max-w-[100px]">
              {tx.etiquetas.join(', ')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            onClick={() => onEdit(tx)}
            className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#3D8BFF] hover:bg-[#3D8BFF]/10 transition-colors cursor-pointer"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Eliminar transacción"
          description={`¿Eliminar "${description}" por ${formatted}? Esta acción revertirá el saldo de la cuenta.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteTx.mutateAsync(tx.id)}
          onCancel={() => setConfirming(false)}
          loading={deleteTx.isPending}
        />
      )}
    </>
  );
}