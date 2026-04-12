import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Saving } from '@/types';

interface SavingsOverviewProps {
  savings: Saving[];
  totalCount: number;
}

export function SavingsOverview({ savings, totalCount }: SavingsOverviewProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);

  if (savings.length === 0) return null;

  return (
    <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#F0F4F8]">Metas de ahorro</p>
        <Link
          to="/savings"
          className="flex items-center gap-1 text-xs text-[#3D8BFF] hover:underline"
        >
          {totalCount > 3 ? `Ver las ${totalCount}` : 'Ver todas'} <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {savings.map((s) => {
          const color    = s.color ?? '#F5A623';
          const progress = s.objetivo > 0 ? Math.min((s.actual / s.objetivo) * 100, 100) : 0;

          return (
            <div key={s.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{s.icono ?? '🎯'}</span>
                  <span className="text-xs text-[#F0F4F8] truncate">{s.nombre}</span>
                </div>
                <span className="text-xs text-[#8899AA] tabular-nums flex-shrink-0 ml-2">
                  {fmt(s.actual)} / {fmt(s.objetivo)}
                </span>
              </div>
              <div className="h-1.5 bg-[#1E2A3A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}