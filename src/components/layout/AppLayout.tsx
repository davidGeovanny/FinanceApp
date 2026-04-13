import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  BarChart2,
  Settings,
  TrendingUp as Logo,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wallet,
  Tag,
} from 'lucide-react';
import { logout } from '@/features/auth/authService';
import { useAuth, resolveDisplayName } from '@/hooks/useAuth';

// ─── Nav structure ────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transacciones' },
  { to: '/savings',      icon: PiggyBank,       label: 'Ahorros'       },
  { to: '/investments',  icon: TrendingUp,      label: 'Inversiones'   },
  { to: '/reports',      icon: BarChart2,       label: 'Reportes'      },
];

const SETTINGS_CHILDREN = [
  { to: '/settings/cuentas',    icon: Wallet, label: 'Cuentas'    },
  { to: '/settings/categorias', icon: Tag,    label: 'Categorías' },
];

// Bottom nav shows 5 items: 4 main + Settings (which covers all /settings/* routes)
const BOTTOM_NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Inicio'   },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Movim.'   },
  { to: '/savings',      icon: PiggyBank,       label: 'Ahorros'  },
  { to: '/investments',  icon: TrendingUp,      label: 'Inversión'},
  { to: '/settings',     icon: Settings,        label: 'Config.'  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const linkBase =
  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors';
const linkActive   = 'bg-[#3D8BFF]/15 text-[#3D8BFF]';
const linkInactive = 'text-[#8899AA] hover:text-[#F0F4F8] hover:bg-white/5';
const subLinkActive   = 'text-[#3D8BFF] bg-[#3D8BFF]/10';
const subLinkInactive = 'text-[#8899AA] hover:text-[#F0F4F8] hover:bg-white/5';

// ─── User info block ──────────────────────────────────────────────────────────

function UserInfo({
  displayName,
  email,
  onLogout,
}: {
  displayName: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="px-3 py-4 border-t border-white/5 space-y-1">
      <div className="px-3 py-2">
        <p className="text-[#F0F4F8] text-sm font-medium truncate">{displayName}</p>
        <p className="text-[#8899AA] text-xs truncate">{email}</p>
      </div>
      <button
        onClick={onLogout}
        className={`${linkBase} ${linkInactive} w-full cursor-pointer`}
      >
        <LogOut size={17} />
        Cerrar sesión
      </button>
    </div>
  );
}

// ─── Settings expandable item (desktop sidebar only) ─────────────────────────

function SettingsNavItem({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingsActive = location.pathname.startsWith('/settings');
  const [open, setOpen] = useState(isSettingsActive);

  const handleToggle = () => {
    if (!isSettingsActive) {
      // First click: navigate to /settings and expand
      navigate('/settings');
    }
    setOpen((v) => !v);
  };

  return (
    <div>
      {/* Parent row */}
      <button
        onClick={handleToggle}
        className={`${linkBase} w-full cursor-pointer justify-between ${
          isSettingsActive ? linkActive : linkInactive
        }`}
      >
        <div className="flex items-center gap-3">
          <Settings size={17} />
          Configuración
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Sub-items */}
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {SETTINGS_CHILDREN.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? subLinkActive : subLinkInactive
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const { userProfile, firebaseUser } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = resolveDisplayName(userProfile, firebaseUser);
  const email = userProfile?.email ?? firebaseUser?.email ?? '';

  const handleLogout = async () => {
    await logout();
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Bottom nav: /settings is active for any /settings/* route
  const isSettingsActive = location.pathname.startsWith('/settings');

  return (
    <div className="min-h-screen bg-[#0F1923] flex">

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-[#161F2C] border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 bg-[#3D8BFF] rounded-lg flex items-center justify-center flex-shrink-0">
            <Logo size={15} className="text-white" />
          </div>
          <span className="text-[#F0F4F8] font-semibold tracking-tight">FinanceApp</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {MAIN_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <SettingsNavItem />
        </nav>

        <UserInfo displayName={displayName} email={email} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#161F2C] border-r border-white/5 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#3D8BFF] rounded-lg flex items-center justify-center">
              <Logo size={15} className="text-white" />
            </div>
            <span className="text-[#F0F4F8] font-semibold tracking-tight">FinanceApp</span>
          </div>
          <button onClick={closeSidebar} className="text-[#8899AA] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {MAIN_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <SettingsNavItem onNavigate={closeSidebar} />
        </nav>

        <UserInfo displayName={displayName} email={email} onLogout={handleLogout} />
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-56 min-h-screen">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#161F2C] border-b border-white/5 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#8899AA] hover:text-[#F0F4F8] cursor-pointer"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#3D8BFF] rounded-lg flex items-center justify-center">
              <Logo size={13} className="text-white" />
            </div>
            <span className="text-[#F0F4F8] font-semibold text-sm">FinanceApp</span>
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#161F2C] border-t border-white/5 flex">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/settings'
              ? isSettingsActive
              : to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-[#3D8BFF]' : 'text-[#8899AA]'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
}