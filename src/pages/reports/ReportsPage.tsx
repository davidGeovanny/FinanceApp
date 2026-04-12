import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { useReports } from '@/features/dashboard/useReports';
import { MonthSelector } from '@/features/dashboard/MonthSelector';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);

// ─── Custom tooltip for bar chart ─────────────────────────────────────────────

function BarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2 text-xs space-y-1">
      <p className="text-[#8899AA] font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Custom tooltip for pie chart ─────────────────────────────────────────────

function PieTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string; porcentaje: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2 text-xs space-y-0.5">
      <p className="text-[#F0F4F8] font-medium">{p.name}</p>
      <p className="text-[#8899AA] tabular-nums">{fmtFull(p.value)}</p>
      <p className="tabular-nums" style={{ color: p.payload.color }}>
        {p.payload.porcentaje.toFixed(1)}%
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { barData, categoryData, monthTotals, isLoading } = useReports(year, month);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const balance = monthTotals.ingresos - monthTotals.gastos;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[#F0F4F8] text-xl font-semibold">Reportes</h1>
        <MonthSelector year={year} month={month} onChange={handleMonthChange} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Month summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ingresos',  value: monthTotals.ingresos, color: '#1DB87A' },
              { label: 'Gastos',    value: monthTotals.gastos,   color: '#FF5B5B' },
              { label: 'Balance',   value: balance, color: balance >= 0 ? '#1DB87A' : '#FF5B5B' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#161F2C] border border-white/5 rounded-xl p-3">
                <p className="text-xs text-[#8899AA] mb-1">{label}</p>
                <p className="text-sm font-semibold tabular-nums truncate" style={{ color }}>
                  {fmtFull(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Bar chart — last 6 months */}
          <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4">
            <p className="text-sm font-medium text-[#F0F4F8] mb-4">Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={4} barCategoryGap="30%">
                <XAxis
                  dataKey="mes"
                  tick={{ fill: '#8899AA', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8899AA', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmt(v).replace('MX$', '').trim()}
                  width={55}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#1DB87A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos"   name="Gastos"   fill="#FF5B5B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart — expenses by category */}
          {categoryData.length === 0 ? (
            <EmptyState
              icon="📊"
              title="Sin gastos registrados"
              description="No hay gastos en el mes seleccionado."
            />
          ) : (
            <>
              <div className="bg-[#161F2C] border border-white/5 rounded-xl p-4">
                <p className="text-sm font-medium text-[#F0F4F8] mb-4">Gastos por categoría</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: '#8899AA', fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category breakdown table */}
              <div className="bg-[#161F2C] border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-[#F0F4F8]">Detalle por categoría</p>
                </div>
                {categoryData.map((cat, i) => (
                  <div key={cat.categoryId}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.icono}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0F4F8] truncate">{cat.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 bg-[#1E2A3A] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${cat.porcentaje}%`, backgroundColor: cat.color }}
                            />
                          </div>
                          <span className="text-xs text-[#8899AA] tabular-nums w-10 text-right">
                            {cat.porcentaje.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[#F0F4F8] tabular-nums flex-shrink-0">
                        {fmtFull(cat.total)}
                      </p>
                    </div>
                    {i < categoryData.length - 1 && <div className="mx-4 h-px bg-white/5" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}