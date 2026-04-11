import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useTransactions } from '@/features/transactions/useTransactions';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useCategories } from '@/features/categories/useCategories';
import { TransactionItem } from '@/features/transactions/TransactionItem';
import { TransactionForm } from '@/features/transactions/TransactionForm';
import { TransactionFiltersBar } from '@/features/transactions/TransactionFiltersBar';
import { EmptyState } from '@/components/ui/EmptyState';
import type { TransactionFilters } from '@/features/transactions/transactionService';
import type { Transaction } from '@/types';

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) return 'Hoy';
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Ayer';

  return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const key = tx.fecha.toDate().toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (tx: Transaction) => { setEditing(tx); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[#F0F4F8] text-xl font-semibold">Transacciones</h1>
          <p className="text-[#8899AA] text-xs mt-0.5">
            {transactions.length} registro{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span className="hidden sm:block">Nueva</span>
        </button>
      </div>

      {(accounts.length > 0 || categories.length > 0) && (
        <div className="mb-4">
          <TransactionFiltersBar
            filters={filters}
            onChange={setFilters}
            accounts={accounts}
            categories={categories}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="💸"
          title="Sin transacciones"
          description={
            Object.keys(filters).length > 0
              ? 'No hay resultados para los filtros seleccionados.'
              : 'Registra tu primer ingreso, gasto o transferencia.'
          }
          action={
            Object.keys(filters).length === 0 ? (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={15} />
                Agregar transacción
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-medium text-[#8899AA] capitalize">
                  {formatGroupDate(date)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-[#8899AA] tabular-nums">{txs.length}</span>
              </div>
              <div className="bg-[#161F2C] border border-white/5 rounded-xl overflow-hidden">
                {txs.map((tx, i) => (
                  <div key={tx.id}>
                    <TransactionItem
                      tx={tx}
                      accounts={accounts}
                      categories={categories}
                      onEdit={openEdit}
                    />
                    {i < txs.length - 1 && <div className="mx-4 h-px bg-white/5" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={openAdd}
        className="sm:hidden fixed bottom-20 right-4 z-20 w-12 h-12 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
      >
        <Plus size={22} />
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full sm:max-w-md bg-[#161F2C] border border-white/5 rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#F0F4F8] font-semibold">
                {editing ? 'Editar transacción' : 'Nueva transacción'}
              </h2>
              <button onClick={closeModal} className="text-[#8899AA] hover:text-[#F0F4F8] transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {accounts.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-[#8899AA] text-sm mb-1">Primero necesitas crear una cuenta</p>
                <p className="text-[#8899AA] text-xs">Ve a la sección de Cuentas para comenzar.</p>
              </div>
            ) : (
              <TransactionForm
                initial={editing ?? undefined}
                onSuccess={closeModal}
                onCancel={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}