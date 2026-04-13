import { useNavigate } from 'react-router-dom';
import { ChevronRight, Wallet, Tag } from 'lucide-react';

const SETTINGS_ITEMS = [
  {
    to: '/settings/cuentas',
    icon: Wallet,
    color: '#3D8BFF',
    label: 'Cuentas',
    description: 'Administra tus cuentas bancarias, tarjetas y efectivo',
  },
  {
    to: '/settings/categorias',
    icon: Tag,
    color: '#1DB87A',
    label: 'Categorías',
    description: 'Organiza tus ingresos y gastos por categoría',
  },
] as const;

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#F0F4F8] text-xl font-semibold">Configuración</h1>
        <p className="text-[#8899AA] text-xs mt-0.5">Personaliza tu experiencia</p>
      </div>

      <div className="bg-[#161F2C] border border-white/5 rounded-xl overflow-hidden">
        {SETTINGS_ITEMS.map(({ to, icon: Icon, color, label, description }, i) => (
          <div key={to}>
            <button
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F0F4F8]">{label}</p>
                <p className="text-xs text-[#8899AA] mt-0.5">{description}</p>
              </div>
              <ChevronRight size={16} className="text-[#8899AA] flex-shrink-0" />
            </button>
            {i < SETTINGS_ITEMS.length - 1 && (
              <div className="mx-4 h-px bg-white/5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}