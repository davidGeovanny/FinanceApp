import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { useCreateSaving, useUpdateSaving } from './useSavings';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import type { Saving } from '@/types';

const savingSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(40),
  objetivo: z
    .string()
    .min(1, 'Ingresa el objetivo')
    .refine((v) => parseFloat(v) > 0, 'Debe ser mayor a 0'),
  actual: z
    .string()
    .min(1, 'Ingresa el monto actual')
    .refine((v) => !isNaN(parseFloat(v)), 'Monto inválido'),
  fechaLimite: z.string().optional(),
  icono: z.string().optional(),
  color: z.string().optional(),
});

type SavingFormData = z.infer<typeof savingSchema>;

const EMOJI_OPTIONS = [
  '🏠','🚗','✈️','💻','📱','💍','🎓','👶','🌴','🏋️',
  '🎸','📷','🐶','🌎','💊','🛒','🎁','⚽','🎯','💡',
];

const COLOR_OPTIONS = [
  '#F5A623','#1DB87A','#3D8BFF','#A78BFA','#FF5B5B',
  '#22D3EE','#F472B6','#34D399','#FBBF24','#FB923C',
];

interface SavingFormProps {
  initial?: Saving;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SavingForm({ initial, onSuccess, onCancel }: SavingFormProps) {
  const createSaving = useCreateSaving();
  const updateSaving = useUpdateSaving();

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SavingFormData>({
    resolver: zodResolver(savingSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          objetivo: String(initial.objetivo),
          actual: String(initial.actual),
          fechaLimite: initial.fechaLimite
            ? initial.fechaLimite.toDate().toISOString().slice(0, 10)
            : '',
          icono: initial.icono ?? '🎯',
          color: initial.color ?? '#F5A623',
        }
      : {
          nombre: '',
          objetivo: '',
          actual: '0',
          fechaLimite: '',
          icono: '🎯',
          color: '#F5A623',
        },
  });

  const selectedColor = watch('color') ?? '#F5A623';
  const selectedIcon = watch('icono') ?? '🎯';

  const onSubmit = async (data: SavingFormData) => {
    const payload = {
      nombre: data.nombre,
      objetivo: parseFloat(data.objetivo),
      actual: parseFloat(data.actual),
      fechaLimite: data.fechaLimite
        ? Timestamp.fromDate(new Date(data.fechaLimite + 'T12:00:00'))
        : undefined,
      icono: data.icono ?? '🎯',
      color: data.color ?? '#F5A623',
      estado: (parseFloat(data.actual) >= parseFloat(data.objetivo)
        ? 'completado'
        : 'activo') as Saving['estado'],
    };

    if (initial) {
      await updateSaving.mutateAsync({ savingId: initial.id, data: payload });
    } else {
      await createSaving.mutateAsync(payload);
    }

    onSuccess?.();
  };

  const inputClass =
    'w-full bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors';
  const labelClass = 'block text-xs font-medium text-[#8899AA] mb-1.5';
  const errorClass = 'text-[#FF5B5B] text-xs mt-1 ml-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* Nombre + preview */}
      <div>
        <label className={labelClass}>Nombre de la meta</label>
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${selectedColor}25` }}
          >
            {selectedIcon}
          </div>
          <input
            {...register('nombre')}
            type="text"
            placeholder="Ej. Fondo de emergencia, Vacaciones..."
            className={`${inputClass} flex-1`}
          />
        </div>
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      {/* Ícono */}
      <div>
        <label className={labelClass}>Ícono</label>
        <Controller
          control={control}
          name="icono"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => field.onChange(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-colors cursor-pointer ${
                    field.value === emoji
                      ? 'ring-2 ring-offset-1 ring-offset-[#161F2C]'
                      : 'bg-[#1E2A3A] hover:bg-white/10'
                  }`}
                  style={
                    field.value === emoji
                      ? { backgroundColor: `${selectedColor}25`, '--tw-ring-color': selectedColor } as React.CSSProperties
                      : {}
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        />
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
                    field.value === color
                      ? 'scale-125 ring-2 ring-white/40 ring-offset-1 ring-offset-[#161F2C]'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Objetivo + Actual */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Meta (MXN)</label>
          <Controller
            control={control}
            name="objetivo"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                currency="MXN"
                hasError={!!errors.objetivo}
              />
            )}
          />
          {errors.objetivo && <p className={errorClass}>{errors.objetivo.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Ahorrado (MXN)</label>
          <Controller
            control={control}
            name="actual"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                currency="MXN"
                hasError={!!errors.actual}
              />
            )}
          />
          {errors.actual && <p className={errorClass}>{errors.actual.message}</p>}
        </div>
      </div>

      {/* Fecha límite */}
      <div>
        <label className={labelClass}>Fecha límite (opcional)</label>
        <input
          {...register('fechaLimite')}
          type="date"
          className={`${inputClass} [color-scheme:dark]`}
        />
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
            'Crear meta'
          )}
        </button>
      </div>
    </form>
  );
}