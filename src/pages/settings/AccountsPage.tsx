import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AccountsList } from '@/features/accounts/AccountsList';

export default function AccountsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-xl text-[#8899AA] hover:text-[#F0F4F8] hover:bg-white/5 transition-colors cursor-pointer -ml-1.5"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-[#F0F4F8] text-xl font-semibold">Cuentas</h1>
          <p className="text-[#8899AA] text-xs mt-0.5">Configuración → Cuentas</p>
        </div>
      </div>

      <AccountsList />
    </div>
  );
}