import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useSavings, useDesarchivarSaving } from '@/features/savings/useSavings';
import { isVencida } from '@/features/savings/savingService';
import { SavingCard } from '@/features/savings/SavingCard';
import { SavingForm } from '@/features/savings/SavingForm';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Saving } from '@/types';

export default function SavingsPage() {
  const { data: savings = [], isLoading } = useSavings();
  const desarchivar = useDesarchivarSaving();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Saving | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: Saving) => { setEditing(s); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const active    = savings.filter((s) => s.estado === 'activo' && !isVencida(s));
  const vencidas  = savings.filter((s) => (s.estado === 'activo' || s.estado === 'vencido') && isVencida(s));
  const completed = savings.filter((s) => s.estado === 'completado');
  const archived  = savings.filter((s) => s.estado === 'archivado');

  const totalObjetivo = active.reduce((sum, s) => sum + s.objetivo, 0);
  const totalActual   = active.reduce((sum, s) => sum + s.actual, 0);
  const pctGlobal     = totalObjetivo > 0 ? (totalActual / totalObjetivo) * 100 : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(n);

  const visibleSavings = savings.filter((s) => s.estado !== 'archivado');

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[#F0F4F8] text-xl font-semibold">Ahorros</h1>
          {active.length > 0 && (
            <p className="text-xs text-[#8899AA] mt-0.5">
              {pctGlobal.toFixed(1)}% alcanzado · {fmt(totalActual)} de {fmt(totalObjetivo)}
            </p>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span className="hidden sm:block">Nueva meta</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visibleSavings.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon="🐷"
          title="Sin metas de ahorro"
          description="Crea tu primera meta para comenzar a ahorrar."
          action={
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={15} />
              Crear meta
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Active */}
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map((s) => (
                <SavingCard key={s.id} saving={s} onEdit={openEdit} />
              ))}
            </div>
          )}

          {/* Vencidas */}
          {vencidas.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#FF5B5B] mb-2">⏰ Vencidas sin completar</p>
              <div className="space-y-3">
                {vencidas.map((s) => (
                  <SavingCard key={s.id} saving={s} onEdit={openEdit} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#1DB87A] mb-2">✓ Completadas</p>
              <div className="space-y-3 opacity-70">
                {completed.map((s) => (
                  <SavingCard key={s.id} saving={s} onEdit={openEdit} />
                ))}
              </div>
            </div>
          )}

          {/* Archived */}
          {archived.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-[#8899AA] hover:text-[#F0F4F8] transition-colors cursor-pointer mb-2"
              >
                <ChevronDown
                  size={13}
                  className={`transition-transform ${showArchived ? 'rotate-180' : ''}`}
                />
                Archivadas ({archived.length})
              </button>
              {showArchived && (
                <div className="space-y-3">
                  {archived.map((s) => (
                    <div key={s.id} className="opacity-60">
                      <SavingCard
                        saving={s}
                        onEdit={openEdit}
                        onDesarchivar={() => desarchivar.mutateAsync(s.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
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
        <Modal title={editing ? 'Editar meta' : 'Nueva meta de ahorro'} onClose={closeModal}>
          <SavingForm
            initial={editing ?? undefined}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}