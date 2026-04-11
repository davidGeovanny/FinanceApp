import { useState } from 'react';
import { Pencil, Trash2, Plus, Minus, CheckCircle2, Clock, Archive } from 'lucide-react';
import { useDeleteSaving, useAbonarSaving, useRetirarSaving, useArchivarSaving } from './useSavings';
import { isVencida } from './savingService';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Saving } from '@/types';

interface SavingCardProps {
  saving: Saving;
  onEdit: (saving: Saving) => void;
  onDesarchivar?: () => void;
}

type QuickAction = 'abonar' | 'retirar' | null;

export function SavingCard({ saving, onEdit, onDesarchivar }: SavingCardProps) {
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [amount, setAmount] = useState('');
  const [confirming, setConfirming] = useState(false);

  const deleteSaving = useDeleteSaving();
  const abonarSaving = useAbonarSaving();
  const retirarSaving = useRetirarSaving();
  const archivarSaving = useArchivarSaving();

  const color = saving.color ?? '#F5A623';
  const icon = saving.icono ?? '🎯';
  const isCompleted = saving.estado === 'completado';
  const vencida = isVencida(saving);
  const progress = saving.objetivo > 0
    ? Math.min((saving.actual / saving.objetivo) * 100, 100)
    : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const handleAction = async () => {
    const monto = parseFloat(amount);
    if (isNaN(monto) || monto <= 0) return;

    if (quickAction === 'abonar') {
      await abonarSaving.mutateAsync({
        savingId: saving.id,
        nuevoActual: saving.actual + monto,
        objetivo: saving.objetivo,
      });
    } else if (quickAction === 'retirar') {
      await retirarSaving.mutateAsync({
        savingId: saving.id,
        nuevoActual: saving.actual - monto,
        objetivo: saving.objetivo,
      });
    }

    setAmount('');
    setQuickAction(null);
  };

  const isPending = abonarSaving.isPending || retirarSaving.isPending;
  const borderColor = vencida ? '#FF5B5B' : isCompleted ? '#1DB87A' : color;

  return (
    <>
      <div
        className="bg-[#161F2C] border border-white/5 rounded-xl p-4 space-y-3"
        style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#F0F4F8] truncate">{saving.nombre}</p>
              {isCompleted && <CheckCircle2 size={14} className="text-[#1DB87A] flex-shrink-0" />}
              {vencida && (
                <span className="flex items-center gap-1 text-xs text-[#FF5B5B] flex-shrink-0">
                  <Clock size={11} />
                  Vencida
                </span>
              )}
            </div>
            {saving.fechaLimite && !vencida && !isCompleted && (
              <p className="text-xs text-[#8899AA]">
                Límite:{' '}
                {saving.fechaLimite.toDate().toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onDesarchivar ? (
              <button
                onClick={onDesarchivar}
                className="px-2 py-1 rounded-lg text-xs font-medium text-[#3D8BFF] hover:bg-[#3D8BFF]/10 transition-colors cursor-pointer"
              >
                Desarchivar
              </button>
            ) : (
              <button
                onClick={() => onEdit(saving)}
                className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#3D8BFF] hover:bg-[#3D8BFF]/10 transition-colors cursor-pointer"
              >
                <Pencil size={13} />
              </button>
            )}
            {!onDesarchivar && (
              <button
                onClick={() => archivarSaving.mutateAsync(saving.id)}
                className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors cursor-pointer"
                title="Archivar"
              >
                <Archive size={13} />
              </button>
            )}
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/10 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#F0F4F8] font-semibold tabular-nums">{fmt(saving.actual)}</span>
            <span className="text-[#8899AA] tabular-nums">de {fmt(saving.objetivo)}</span>
          </div>
          <div className="h-2 bg-[#1E2A3A] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: borderColor }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: borderColor }} className="font-medium">
              {progress.toFixed(1)}%
            </span>
            {!isCompleted && (
              <span className="text-[#8899AA] tabular-nums">
                Faltan {fmt(Math.max(0, saving.objetivo - saving.actual))}
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {!isCompleted && !onDesarchivar && (
          <div className="space-y-2">
            {quickAction ? (
              <div className="flex items-center gap-2">
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  currency="MXN"
                  placeholder={quickAction === 'abonar' ? 'Monto a abonar' : 'Monto a retirar'}
                  className="flex-1"
                />
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className={`px-3 py-2.5 rounded-xl text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                    quickAction === 'abonar'
                      ? 'bg-[#1DB87A] hover:bg-[#18a06a]'
                      : 'bg-[#FF5B5B] hover:bg-[#e84d4d]'
                  }`}
                >
                  {isPending ? '...' : quickAction === 'abonar' ? 'Abonar' : 'Retirar'}
                </button>
                <button
                  onClick={() => { setQuickAction(null); setAmount(''); }}
                  className="px-3 py-2.5 rounded-xl border border-white/10 text-[#8899AA] text-xs hover:text-[#F0F4F8] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuickAction('abonar')}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1DB87A] hover:text-[#18a06a] transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  Abonar
                </button>
                {saving.actual > 0 && (
                  <button
                    onClick={() => setQuickAction('retirar')}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#FF5B5B] hover:text-[#e84d4d] transition-colors cursor-pointer"
                  >
                    <Minus size={13} />
                    Retirar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Eliminar "${saving.nombre}"`}
          description="Se eliminará la meta de ahorro permanentemente."
          onConfirm={() => deleteSaving.mutateAsync(saving.id)}
          onCancel={() => setConfirming(false)}
          loading={deleteSaving.isPending}
        />
      )}
    </>
  );
}