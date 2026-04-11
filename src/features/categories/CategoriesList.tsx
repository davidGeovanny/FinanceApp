import { useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { useCategories, useDeleteCategory } from './useCategories';
import { CategoryForm } from './CategoryForm';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Category } from '@/types';

const TYPE_LABELS = { ingreso: 'Ingreso', gasto: 'Gasto', ambos: 'Ambos' } as const;

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] rounded-xl transition-colors group">
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{ backgroundColor: `${category.color}25` }}
      >
        {category.icono}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F0F4F8] truncate">{category.nombre}</p>
      </div>

      {/* Tipo badge */}
      <span
        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: `${category.color}20`, color: category.color }}
      >
        {TYPE_LABELS[category.tipo]}
      </span>

      {/* Actions */}
      {category.sistema ? (
        <div className="ml-1 p-1.5">
          <Lock size={12} className="text-[#64748B]" />
        </div>
      ) : (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#3D8BFF] hover:bg-[#3D8BFF]/10 transition-colors cursor-pointer"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 rounded-lg text-[#8899AA] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export function CategoriesList() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const systemCats = categories.filter((c) => c.sistema);
  const customCats = categories.filter((c) => !c.sistema);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCategory.mutateAsync(deleting.id);
    setDeleting(null);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#F0F4F8] font-semibold">Categorías</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#3D8BFF]/15 hover:bg-[#3D8BFF]/25 text-[#3D8BFF] text-sm font-medium px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <Plus size={15} />
          Nueva
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-[#3D8BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon="🏷️" title="Sin categorías" description="Las categorías del sistema se crean al registrarte." />
      ) : (
        <div className="space-y-4">
          {/* Custom categories */}
          {customCats.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8899AA] px-1 mb-1">Personalizadas</p>
              <div className="bg-[#161F2C] border border-white/5 rounded-xl overflow-hidden">
                {customCats.map((cat, i) => (
                  <div key={cat.id}>
                    <CategoryRow category={cat} onEdit={openEdit} onDelete={setDeleting} />
                    {i < customCats.length - 1 && <div className="mx-4 h-px bg-white/5" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System categories */}
          {systemCats.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8899AA] px-1 mb-1">Del sistema</p>
              <div className="bg-[#161F2C] border border-white/5 rounded-xl overflow-hidden">
                {systemCats.map((cat, i) => (
                  <div key={cat.id}>
                    <CategoryRow category={cat} onEdit={openEdit} onDelete={setDeleting} />
                    {i < systemCats.length - 1 && <div className="mx-4 h-px bg-white/5" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={editing ? 'Editar categoría' : 'Nueva categoría'}
          onClose={closeModal}
        >
          <CategoryForm
            initial={editing ?? undefined}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {/* Confirm delete */}
      {deleting && (
        <ConfirmDialog
          title={`Eliminar "${deleting.nombre}"`}
          description="Las transacciones que usen esta categoría quedarán sin categoría asignada."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteCategory.isPending}
        />
      )}
    </>
  );
}