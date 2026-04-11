import { useState, useMemo } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { calcMetrics } from './investmentService';
import { useAddValuation } from './useInvestments';
import type { Investment } from '@/types';

interface BulkValuationModalProps {
  investments: Investment[];
  onClose: () => void;
}

interface RowState {
  newValue: string;
  isDirty: boolean;
}

function daysSince(investment: Investment): number {
  if (investment.valuaciones.length === 0) return Infinity;
  const sorted = [...investment.valuaciones].sort(
    (a, b) => b.fecha.toMillis() - a.fecha.toMillis()
  );
  const ms = Date.now() - sorted[0].fecha.toMillis();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function BulkValuationModal({ investments, onClose }: BulkValuationModalProps) {
  const addValuation = useAddValuation();

  const initialRows = useMemo(() => {
    const map: Record<string, RowState> = {};
    for (const inv of investments) {
      map[inv.id] = { newValue: '', isDirty: false };
    }
    return map;
  }, [investments]);

  const [rows, setRows] = useState<Record<string, RowState>>(initialRows);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const dirtyCount = Object.values(rows).filter((r) => r.isDirty).length;

  const handleChange = (id: string, value: string) => {
    setRows((prev) => ({
      ...prev,
      [id]: { newValue: value, isDirty: value !== '' },
    }));
  };

  const handleSave = async () => {
    const toUpdate = investments.filter((inv) => {
      const row = rows[inv.id];
      if (!row.isDirty || row.newValue === '') return false;
      const newVal = parseFloat(row.newValue);
      if (isNaN(newVal) || newVal < 0) return false;
      return newVal !== calcMetrics(inv).valorActual;
    });

    if (toUpdate.length === 0) { onClose(); return; }

    setSaving(true);
    await Promise.all(
      toUpdate.map((inv) =>
        addValuation.mutateAsync({
          investmentId: inv.id,
          valor: parseFloat(rows[inv.id].newValue),
        })
      )
    );
    setSaving(false);
    setSavedCount(toUpdate.length);
    setTimeout(onClose, 1500);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-[#161F2C] border border-white/5 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-[#F0F4F8] font-semibold">Actualizar valuaciones</h2>
            <p className="text-xs text-[#8899AA] mt-0.5">
              Deja vacío lo que no cambió — solo se guardan los valores distintos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8899AA] hover:text-[#F0F4F8] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {investments.map((inv) => {
            const metrics = calcMetrics(inv);
            const days = daysSince(inv);
            const isStale = days >= 30;
            const row = rows[inv.id];

            return (
              <div
                key={inv.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  row.isDirty
                    ? 'bg-[#3D8BFF]/5 border-[#3D8BFF]/20'
                    : 'bg-[#1E2A3A] border-transparent'
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-[#F0F4F8] font-medium truncate">
                      {inv.nombre}
                    </p>
                    {isStale && (
                      <span title={`Sin actualizar hace ${days} días`} className="flex-shrink-0">
                        <AlertTriangle size={12} className="text-[#F5A623]" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#8899AA]">{inv.tipo}</span>
                    <span className="text-xs text-[#8899AA]">·</span>
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                        inv.liquidez === 'a_la_vista'
                          ? 'bg-[#1DB87A]/10 text-[#1DB87A]'
                          : 'bg-[#A78BFA]/10 text-[#A78BFA]'
                      }`}
                    >
                      {inv.liquidez === 'a_la_vista' ? 'A la vista' : 'Congelada'}
                    </span>
                    <span className="text-xs text-[#8899AA]">·</span>
                    <span className="text-xs font-medium tabular-nums text-[#F0F4F8]">
                      {fmt(metrics.valorActual)}
                    </span>
                  </div>
                </div>

                {/* Input */}
                <div className="w-36 flex-shrink-0">
                  <CurrencyInput
                    value={row.newValue}
                    onChange={(v) => handleChange(inv.id, v)}
                    currency="MXN"
                    placeholder={fmt(metrics.valorActual).replace('MX$', '').trim()}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
          {savedCount !== null ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-[#1DB87A] text-sm font-medium">
                ✓ {savedCount} valuación{savedCount !== 1 ? 'es' : ''} guardada{savedCount !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-xs text-[#8899AA] flex-1">
                {dirtyCount === 0
                  ? 'Sin cambios pendientes'
                  : `${dirtyCount} inversión${dirtyCount !== 1 ? 'es' : ''} con cambios`}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 text-sm text-[#8899AA] hover:text-[#F0F4F8] hover:border-white/20 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || dirtyCount === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Guardar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}