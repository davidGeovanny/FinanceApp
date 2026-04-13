import { Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthInit } from '@/hooks/useAuth';
import { ProtectedRoute, PublicRoute } from '@/components/shared/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

import DashboardPage from '@/pages/dashboard/DashboardPage';
import TransactionsPage from '@/pages/transactions/TransactionsPage';
import SavingsPage from '@/pages/savings/SavingsPage';
import InvestmentsPage from '@/pages/investments/InvestmentsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import AccountsPage from '@/pages/settings/AccountsPage';
import CategoriesPage from '@/pages/settings/CategoriesPage';
import { HashRouter } from 'react-router-dom';

function AppRoutes() {
  useAuthInit();

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/savings" element={<SavingsPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/cuentas" element={<AccountsPage />} />
          <Route path="/settings/categorias" element={<CategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </QueryClientProvider>
  );
}