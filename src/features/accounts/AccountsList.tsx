import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAccounts } from './useAccounts';
import { useAuth } from '@/hooks/useAuth';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import { ACCOUNT_TYPE_LABELS } from './accountConstants';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Account, AccountType } from '@/types';

const TYPE_ORDER: AccountType[] = [
  'banco',
  'tarjeta_credito',
  'efectivo',
  'inversion_vista',
  'inversion_congelada',
];

export function AccountsList() {
  const { userProfile } = useAuth();
  const { data: accounts = [], isLoading } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (account: Account) => { setEditing(account); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  // Group by tipo in defined order
  const grouped = TYPE_ORDER.reduce<Record<string, Account[]>>((acc, tipo) => {
    const items = accounts.filter((a) => a.tipo === tipo);
    if (items.length > 0) acc[tipo] = items;
    return acc;
  }, {});

  // Total balance across MXN non-credit accounts.
  // Linked investment accounts are excluded to avoid double-counting with the Investments module.
  const totalMXN = accounts
    .filter((a) => a.moneda === 'MXN' && a.tipo !== 'tarjeta_credito' && !a.investmentId)
    .reduce((sum, a) => sum + a.saldo_inicial, 0);

  const formattedTotal = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalMXN);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[#F0F4F8] font-semibold">Cuentas</h2>
          {accounts.length > 0 && (
            <p className="text-xs text-[#8899AA] mt-0.5">
              Total MXN:{' '}
              <span className="text-[#1DB87A] font-medium">{formattedTotal}</span>
            </p>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#3D8BFF]/15 hover:bg-[#3D8BFF]/25 text-[#3D8BFF] text-sm font-medium px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={15} />
          Nueva
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="Sin cuentas"
          description="Agrega tu primera cuenta para empezar a registrar transacciones."
          action={
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={15} />
              Agregar cuenta
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([tipo, items]) => (
            <div key={tipo}>
              <p className="text-xs font-medium text-[#8899AA] px-1 mb-1">
                {ACCOUNT_TYPE_LABELS[tipo as AccountType]}
              </p>
              <div className="bg-[#161F2C] border border-white/5 rounded-xl overflow-hidden">
                {items.map((account, i) => (
                  <div key={account.id}>
                    <AccountCard account={account} onEdit={openEdit} />
                    {i < items.length - 1 && (
                      <div className="mx-4 h-px bg-white/5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
          onClose={closeModal}
        >
          <AccountForm
            initial={editing ?? undefined}
            defaultMoneda={userProfile?.moneda ?? 'MXN'}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}