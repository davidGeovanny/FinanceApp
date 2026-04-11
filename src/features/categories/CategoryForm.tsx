import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown } from 'lucide-react';
import { useCreateCategory, useUpdateCategory } from './useCategories';
import type { Category } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(30),
  icono: z.string().min(1, 'Selecciona un ícono'),
  color: z.string().min(1, 'Selecciona un color'),
  tipo: z.enum(['ingreso', 'gasto', 'ambos']),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// ─── Emoji picker options ─────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '🍔','🛒','🚗','🚌','🎬','🎮','💊','🏥','🏠','💡',
  '👕','👟','📚','✏️','💻','📱','✈️','🏖️','🎵','🎁',
  '🐾','🌱','💪','🍷','☕','💸','💰','📈','🔄','⚡',
];

const COLOR_OPTIONS = [
  '#3D8BFF','#1DB87A','#FF5B5B','#F5A623','#A78BFA',
  '#22D3EE','#F472B6','#34D399','#FBBF24','#60A5FA',
  '#E879F9','#FB923C','#94A3B8','#64748B','#EC4899',
];

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryFormProps {
  initial?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({ initial, onSuccess, onCancel }: CategoryFormProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          icono: initial.icono,
          color: initial.color,
          tipo: initial.tipo,
        }
      : {
          nombre: '',
          icono: '💸',
          color: '#3D8BFF',
          tipo: 'gasto',
        },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icono');

  const onSubmit = async (data: CategoryFormData) => {
    if (initial) {
      await updateCategory.mutateAsync({ categoryId: initial.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    onSuccess?.();
  };

  const inputClass =
    'w-full bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors';
  const labelClass = 'block text-xs font-medium text-[#8899AA] mb-1.5';
  const errorClass = 'text-[#FF5B5B] text-xs mt-1 ml-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* Nombre */}
      <div>
        <label className={labelClass}>Nombre</label>
        <input
          {...register('nombre')}
          type="text"
          placeholder="Ej. Restaurantes, Gasolina..."
          className={inputClass}
        />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      {/* Icono + Color preview */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ícono */}
        <div>
          <label className={labelClass}>Ícono</label>
          <Controller
            control={control}
            name="icono"
            render={({ field }) => (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="w-full bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2.5 text-left flex items-center gap-2 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <span className="text-lg">{field.value}</span>
                  <ChevronDown size={13} className="text-[#8899AA] ml-auto" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-1 z-10 bg-[#1E2A3A] border border-white/10 rounded-xl p-2 grid grid-cols-8 gap-1 shadow-xl">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          field.onChange(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer ${
                          field.value === emoji ? 'bg-white/15' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.icono && <p className={errorClass}>{errors.icono.message}</p>}
        </div>

        {/* Preview */}
        <div>
          <label className={labelClass}>Vista previa</label>
          <div className="flex items-center gap-2 bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: `${selectedColor}25` }}
            >
              {selectedIcon}
            </div>
            <span className="text-sm text-[#F0F4F8] truncate">
              {watch('nombre') || 'Categoría'}
            </span>
          </div>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className={labelClass}>Color</label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => field.onChange(color)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    field.value === color ? 'scale-125 ring-2 ring-white/40 ring-offset-1 ring-offset-[#161F2C]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              {/* Custom color */}
              <label className="w-7 h-7 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors overflow-hidden">
                <input
                  type="color"
                  value={field.value}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="opacity-0 absolute w-px h-px"
                />
                <span className="text-[#8899AA] text-xs">+</span>
              </label>
            </div>
          )}
        />
        {errors.color && <p className={errorClass}>{errors.color.message}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label className={labelClass}>Tipo</label>
        <div className="relative">
          <select {...register('tipo')} className={`${inputClass} appearance-none pr-8`}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
            <option value="ambos">Ambos</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#8899AA] hover:text-[#F0F4F8] hover:border-white/20 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-[#3D8BFF] hover:bg-[#2d7aee] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : initial ? (
            'Guardar cambios'
          ) : (
            'Crear categoría'
          )}
        </button>
      </div>
    </form>
  );
}