import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Account } from '@/types';
import { useDeleteAccount } from './useAccounts';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_COLORS } from './accountConstants';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
}

export function AccountCard({ account, onEdit }: AccountCardProps) {
  const [confirming, setConfirming] = useState(false);
  const deleteAccount = useDeleteAccount();

  const color = ACCOUNT_TYPE_COLORS[account.tipo];

  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.saldo_inicial);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] rounded-xl transition-colors group">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          {ACCOUNT_TYPE_ICONS[account.tipo]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#F0F4F8] font-medium truncate">{account.nombre}</p>
          <p className="text-xs text-[#8899AA]">{ACCOUNT_TYPE_LABELS[account.tipo]}</p>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: account.saldo_inicial >= 0 ? color : '#FF5B5B' }}
          >
            {account.moneda} {formatted}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            onClick={() => onEdit(account)}
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
          title={`Eliminar "${account.nombre}"`}
          description="Se eliminará la cuenta. Las transacciones asociadas no se eliminarán, pero quedarán sin cuenta asignada."
          onConfirm={() => deleteAccount.mutateAsync(account.id)}
          onCancel={() => setConfirming(false)}
          loading={deleteAccount.isPending}
        />
      )}
    </>
  );
}