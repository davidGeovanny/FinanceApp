import { useDashboard } from '@/features/dashboard/useDashboard';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useCategories } from '@/features/categories/useCategories';
import { useAuth, resolveDisplayName } from '@/hooks/useAuth';
import { StatCard } from '@/features/dashboard/StatCard';
import { RecentTransactions } from '@/features/dashboard/RecentTransactions';
import { SavingsOverview } from '@/features/dashboard/SavingsOverview';

export default function DashboardPage() {
  const { userProfile, firebaseUser } = useAuth();
  const { summary, isLoading } = useDashboard();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const displayName = resolveDisplayName(userProfile, firebaseUser);

  const now = new Date();
  const monthLabel = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-6 h-6 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Greeting */}
      <div>
        <h1 className="text-[#F0F4F8] text-xl font-semibold">
          Hola, {displayName.split(' ')[0]} 👋
        </h1>
        <p className="text-[#8899AA] text-xs mt-0.5 capitalize">{monthLabel}</p>
      </div>

      {/* Patrimonio neto */}
      <div className="bg-[#161F2C] border border-white/5 rounded-xl p-5">
        <p className="text-xs text-[#8899AA] mb-1">Patrimonio neto</p>
        <p className="text-3xl font-bold text-[#F0F4F8] tabular-nums">
          {fmt(summary.patrimonioNeto)}
        </p>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div>
            <p className="text-xs text-[#8899AA]">Cuentas</p>
            <p className="text-sm font-semibold text-[#3D8BFF] tabular-nums">
              {fmt(summary.totalCuentas)}
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-xs text-[#8899AA]">Inversiones</p>
            <p className="text-sm font-semibold text-[#A78BFA] tabular-nums">
              {fmt(summary.totalInversiones)}
            </p>
          </div>
          {summary.totalAhorros > 0 && (
            <>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-xs text-[#8899AA]">Ahorros</p>
                <p className="text-sm font-semibold text-[#F5A623] tabular-nums">
                  {fmt(summary.totalAhorros)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly stats */}
      <div>
        <p className="text-xs font-medium text-[#8899AA] mb-2 px-0.5">Este mes</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Ingresos"
            value={fmt(summary.ingresosMes)}
            icon="💰"
            color="#1DB87A"
          />
          <StatCard
            label="Gastos"
            value={fmt(summary.gastosMes)}
            icon="💸"
            color="#FF5B5B"
          />
          <StatCard
            label="Balance"
            value={fmt(summary.balanceMes)}
            icon={summary.balanceMes >= 0 ? '📈' : '📉'}
            color={summary.balanceMes >= 0 ? '#1DB87A' : '#FF5B5B'}
          />
        </div>
      </div>

      {/* Savings overview */}
      {summary.topSavings.length > 0 && (
        <SavingsOverview
          savings={summary.topSavings}
          totalCount={summary.activeSavingsCount}
        />
      )}

      {/* Recent transactions */}
      <RecentTransactions
        transactions={summary.recentTransactions}
        accounts={accounts}
        categories={categories}
      />

    </div>
  );
}