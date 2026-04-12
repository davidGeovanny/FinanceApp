import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useInvestments } from '@/features/investments/useInvestments';
import { useInvestmentTypes } from '@/features/investments/useInvestmentTypes';
import { calcMetrics } from '@/features/investments/investmentService';
import { InvestmentCard } from '@/features/investments/InvestmentCard';
import { InvestmentForm } from '@/features/investments/InvestmentForm';
import { BulkValuationModal } from '@/features/investments/BulkValuationModal';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Investment } from '@/types';

export default function InvestmentsPage() {
  const { data: investments = [], isLoading } = useInvestments();
  const { data: investmentTypes = [] } = useInvestmentTypes();

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (inv: Investment) => { setEditing(inv); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const vistaInvs    = investments.filter((i) => i.liquidez === 'a_la_vista');
  const congeladaInvs = investments.filter((i) => i.liquidez === 'congelada');

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);

  const totalActual    = investments.reduce((sum, inv) => sum + calcMetrics(inv).valorActual, 0);
  const totalVista     = vistaInvs.reduce((sum, inv) => sum + calcMetrics(inv).valorActual, 0);
  const totalCongelada = congeladaInvs.reduce((sum, inv) => sum + calcMetrics(inv).valorActual, 0);

  const staleCount = investments.filter((inv) => {
    if (inv.valuaciones.length === 0) return true;
    const sorted = [...inv.valuaciones].sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis());
    const days = Math.floor((Date.now() - sorted[0].fecha.toMillis()) / (1000 * 60 * 60 * 24));
    return days >= 30;
  }).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[#F0F4F8] text-xl font-semibold">Inversiones</h1>
          {investments.length > 0 && (
            <p className="text-xs text-[#8899AA] mt-0.5">Total: {fmt(totalActual)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {investments.length > 0 && (
            <button
              onClick={() => setBulkOpen(true)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                staleCount > 0
                  ? 'bg-[#F5A623]/15 hover:bg-[#F5A623]/25 text-[#F5A623]'
                  : 'bg-white/5 hover:bg-white/10 text-[#8899AA]'
              }`}
            >
              <RefreshCw size={15} />
              <span className="hidden sm:block">
                Actualizar{staleCount > 0 ? ` (${staleCount})` : ''}
              </span>
            </button>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:block">Nueva</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {investments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#161F2C] border border-white/5 rounded-xl p-3">
            <p className="text-xs text-[#8899AA] mb-1">📈 A la vista</p>
            <p className="text-base font-semibold text-[#22D3EE] tabular-nums">{fmt(totalVista)}</p>
            <p className="text-xs text-[#8899AA]">
              {vistaInvs.length} instrumento{vistaInvs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-[#161F2C] border border-white/5 rounded-xl p-3">
            <p className="text-xs text-[#8899AA] mb-1">🔒 Congelada</p>
            <p className="text-base font-semibold text-[#64748B] tabular-nums">{fmt(totalCongelada)}</p>
            <p className="text-xs text-[#8899AA]">
              {congeladaInvs.length} instrumento{congeladaInvs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : investments.length === 0 ? (
        <EmptyState
          icon="📈"
          title="Sin inversiones"
          description="Registra tus instrumentos de inversión y lleva seguimiento de su rendimiento."
          action={
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={15} />
              Agregar inversión
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {vistaInvs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8899AA] mb-2">A la vista</p>
              <div className="space-y-3">
                {vistaInvs.map((inv) => (
                  <InvestmentCard
                    key={inv.id}
                    investment={inv}
                    investmentTypes={investmentTypes}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            </div>
          )}
          {congeladaInvs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8899AA] mb-2">Congelada</p>
              <div className="space-y-3">
                {congeladaInvs.map((inv) => (
                  <InvestmentCard
                    key={inv.id}
                    investment={inv}
                    investmentTypes={investmentTypes}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={openAdd}
        className="sm:hidden fixed bottom-20 right-4 z-20 w-12 h-12 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
      >
        <Plus size={22} />
      </button>

      {modalOpen && (
        <Modal title={editing ? 'Editar inversión' : 'Nueva inversión'} onClose={closeModal}>
          <InvestmentForm
            initial={editing ?? undefined}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {bulkOpen && (
        <BulkValuationModal
          investments={investments}
          investmentTypes={investmentTypes}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  );
}