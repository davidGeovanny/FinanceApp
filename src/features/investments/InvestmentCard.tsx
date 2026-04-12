import { useState } from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown, Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';
import { useDeleteInvestment } from './useInvestments';
import { calcMetrics } from './investmentService';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Investment, InvestmentType } from '@/types';

interface InvestmentCardProps {
  investment: Investment;
  investmentTypes: InvestmentType[];
  onEdit: (investment: Investment) => void;
}

function daysSince(investment: Investment): number {
  if (investment.valuaciones.length === 0) return Infinity;
  const sorted = [...investment.valuaciones].sort(
    (a, b) => b.fecha.toMillis() - a.fecha.toMillis()
  );
  return Math.floor((Date.now() - sorted[0].fecha.toMillis()) / (1000 * 60 * 60 * 24));
}

export function InvestmentCard({ investment, investmentTypes, onEdit }: InvestmentCardProps) {
  const [confirming, setConfirming] = useState(false);
  const deleteInvestment = useDeleteInvestment();

  const metrics = calcMetrics(investment);
  const isCongelada = investment.liquidez === 'congelada';
  const days = daysSince(investment);
  const isStale = days >= 30;

  // Resolve type name and icon from catalog
  const tipoInfo = investmentTypes.find((t) => t.id === investment.tipoId);
  const tipoLabel = tipoInfo ? `${tipoInfo.icono} ${tipoInfo.nombre}` : '—';

  const liquidezColor = isCongelada ? '#64748B' : '#22D3EE';
  const gainColor = metrics.gananciaTotal >= 0 ? '#1DB87A' : '#FF5B5B';
  const GainIcon = metrics.gananciaTotal >= 0 ? TrendingUp : TrendingDown;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);

  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

  return (
    <>
      <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${liquidezColor}20` }}
          >
            {isCongelada
              ? <Lock size={18} style={{ color: liquidezColor }} />
              : <Unlock size={18} style={{ color: liquidezColor }} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-[#F0F4F8] truncate">{investment.nombre}</p>
              {isStale && (
                <span title={`Sin actualizar hace ${days} días`} className="flex-shrink-0">
                  <AlertTriangle size={13} className="text-[#F5A623]" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#8899AA]">{tipoLabel}</span>
              <span className="text-xs text-[#8899AA]">·</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${liquidezColor}20`, color: liquidezColor }}
              >
                {isCongelada ? 'Congelada' : 'A la vista'}
              </span>
              {days !== Infinity && (
                <span className={`flex items-center gap-0.5 text-xs ${isStale ? 'text-[#F5A623]' : 'text-[#8899AA]'}`}>
                  <Clock size={10} />
                  {days === 0 ? 'hoy' : `hace ${days}d`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(investment)}
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

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#1E2A3A] rounded-xl p-2.5">
            <p className="text-xs text-[#8899AA] mb-0.5">Valor actual</p>
            <p className="text-sm font-semibold text-[#F0F4F8] tabular-nums">
              {fmt(metrics.valorActual)}
            </p>
          </div>
          <div className="bg-[#1E2A3A] rounded-xl p-2.5">
            <p className="text-xs text-[#8899AA] mb-0.5">Ganancia total</p>
            <div className="flex items-center gap-1">
              <GainIcon size={12} style={{ color: gainColor }} />
              <p className="text-sm font-semibold tabular-nums" style={{ color: gainColor }}>
                {fmtPct(metrics.gananciaTotalPct)}
              </p>
            </div>
            <p className="text-xs tabular-nums" style={{ color: gainColor }}>
              {fmt(metrics.gananciaTotal)}
            </p>
          </div>
          <div className="bg-[#1E2A3A] rounded-xl p-2.5">
            <p className="text-xs text-[#8899AA] mb-0.5">Último periodo</p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: metrics.rendimientoPeriodo >= 0 ? '#1DB87A' : '#FF5B5B' }}
            >
              {fmt(metrics.rendimientoPeriodo)}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#8899AA] tabular-nums">
          Invertido: {fmt(investment.montoInvertido)}
          {investment.valuaciones.length > 0 && (
            <span className="ml-2">
              · {investment.valuaciones.length} valuación{investment.valuaciones.length !== 1 ? 'es' : ''}
            </span>
          )}
        </p>
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Eliminar "${investment.nombre}"`}
          description="Se eliminará la inversión y todo su historial de valuaciones."
          onConfirm={() => deleteInvestment.mutateAsync(investment.id)}
          onCancel={() => setConfirming(false)}
          loading={deleteInvestment.isPending}
        />
      )}
    </>
  );
}