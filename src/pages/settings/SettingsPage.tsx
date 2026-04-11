import { useState } from 'react';
import { AccountsList } from '@/features/accounts/AccountsList';
import { CategoriesList } from '@/features/categories/CategoriesList';

type Tab = 'cuentas' | 'categorias';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'cuentas',    label: 'Cuentas',    icon: '🏦' },
  { id: 'categorias', label: 'Categorías', icon: '🏷️' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('cuentas');

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-[#F0F4F8] text-xl font-semibold">Configuración</h1>
        <p className="text-[#8899AA] text-xs mt-0.5">Administra tus cuentas y categorías</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161F2C] border border-white/5 rounded-xl p-1 mb-5">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === id
                ? 'bg-[#1E2A3A] text-[#F0F4F8]'
                : 'text-[#8899AA] hover:text-[#F0F4F8]'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'cuentas' && <AccountsList />}
      {tab === 'categorias' && <CategoriesList />}
    </div>
  );
}