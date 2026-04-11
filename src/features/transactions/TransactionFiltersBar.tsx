import { ChevronDown, X } from 'lucide-react';
import type { Account, Category, TransactionType } from '@/types';
import type { TransactionFilters } from './transactionService';

interface FiltersBarProps {
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
}

const selectClass =
  'bg-[#1E2A3A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F0F4F8] appearance-none pr-6 focus:outline-none focus:border-[#3D8BFF]/50 transition-colors cursor-pointer';

export function TransactionFiltersBar({ filters, onChange, accounts, categories }: FiltersBarProps) {
  const hasFilters = filters.tipo || filters.cuentaId || filters.categoriaId;

  const clear = () => onChange({});

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tipo */}
      <div className="relative">
        <select
          value={filters.tipo ?? ''}
          onChange={(e) =>
            onChange({ ...filters, tipo: (e.target.value as TransactionType) || undefined })
          }
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
      </div>

      {/* Cuenta */}
      <div className="relative">
        <select
          value={filters.cuentaId ?? ''}
          onChange={(e) =>
            onChange({ ...filters, cuentaId: e.target.value || undefined })
          }
          className={selectClass}
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
      </div>

      {/* Categoría */}
      <div className="relative">
        <select
          value={filters.categoriaId ?? ''}
          onChange={(e) =>
            onChange({ ...filters, categoriaId: e.target.value || undefined })
          }
          className={selectClass}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clear}
          className="flex items-center gap-1 text-xs text-[#8899AA] hover:text-[#FF5B5B] transition-colors cursor-pointer"
        >
          <X size={12} />
          Limpiar
        </button>
      )}
    </div>
  );
}