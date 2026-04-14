import { useState } from 'react';
import { Pencil, Trash2, Link } from 'lucide-react';
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
  const isLinked = !!account.investmentId;

  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.saldo_inicial);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] rounded-xl transition-colors group min-w-0">

        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          {ACCOUNT_TYPE_ICONS[account.tipo]}
        </div>

        {/* Info — flex-1 + min-w-0 ensures text truncates instead of pushing layout */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm text-[#F0F4F8] font-medium truncate">{account.nombre}</p>
            {isLinked && (
              <span
                title="Vinculada a una inversión"
                className="flex items-center gap-0.5 bg-[#A78BFA]/15 text-[#A78BFA] text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
              >
                <Link size={9} />
                Inv.
              </span>
            )}
          </div>
          <p className="text-xs text-[#8899AA] truncate">{ACCOUNT_TYPE_LABELS[account.tipo]}</p>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0 ml-2">
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: account.saldo_inicial >= 0 ? color : '#FF5B5B' }}
          >
            {account.moneda} {formatted}
          </p>
        </div>

        {/* Actions — use md: prefix so they only appear on desktop hover.
            On mobile they are hidden entirely to avoid layout overflow. */}
        <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
          {isLinked ? (
            <span className="text-[10px] text-[#8899AA] px-1 whitespace-nowrap">
              Editar en Inversiones
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Mobile-only actions — always visible, compact */}
        <div className="flex md:hidden items-center gap-1 flex-shrink-0 ml-1">
          {!isLinked && (
            <>
              <button
                onClick={() => onEdit(account)}
                className="p-1.5 rounded-lg text-[#8899AA] active:text-[#3D8BFF] active:bg-[#3D8BFF]/10 transition-colors cursor-pointer"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg text-[#8899AA] active:text-[#FF5B5B] active:bg-[#FF5B5B]/10 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
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