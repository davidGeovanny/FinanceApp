import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Lock } from 'lucide-react';
import { useCreateInvestment, useUpdateInvestment } from './useInvestments';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import type { Investment } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const investmentSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  tipo: z.string().min(1, 'El tipo es requerido'),
  montoInvertido: z
    .string()
    .min(1, 'Ingresa el monto')
    .refine((v) => parseFloat(v) >= 0, 'Debe ser mayor o igual a 0'),
  liquidez: z.enum(['a_la_vista', 'congelada']),
  notas: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const INSTRUMENT_TYPES = ['CETES', 'Finsus', 'SuperTasas', 'NU', 'Mercado Pago'];

// ─── Component ────────────────────────────────────────────────────────────────

interface InvestmentFormProps {
  initial?: Investment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvestmentForm({ initial, onSuccess, onCancel }: InvestmentFormProps) {
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();

  // Lock monto once any valuation exists — the seed valuation is created on first
  // save, so from the second open onward the field is read-only. Use
  // "Actualizar valuaciones" to record the current value going forward.
  const amountLocked = !!initial && initial.valuaciones.length >= 1;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          tipo: initial.tipo,
          montoInvertido: String(initial.montoInvertido),
          liquidez: initial.liquidez,
          notas: initial.notas ?? '',
        }
      : {
          nombre: '',
          tipo: '',
          montoInvertido: '',
          liquidez: 'a_la_vista',
          notas: '',
        },
  });

  const onSubmit = async (data: InvestmentFormData) => {
    const payload: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'> = {
      nombre: data.nombre,
      tipo: data.tipo,
      // Preserve original monto when locked — never overwrite with form value
      montoInvertido: amountLocked
        ? initial!.montoInvertido
        : parseFloat(data.montoInvertido),
      liquidez: data.liquidez,
      notas: data.notas ?? '',
      valuaciones: initial?.valuaciones ?? [],
    };

    if (initial) {
      await updateInvestment.mutateAsync({ investmentId: initial.id, data: payload });
    } else {
      await createInvestment.mutateAsync(payload);
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
          placeholder="Ej. CETES 28d, Nu Cajitas, Finsus..."
          className={inputClass}
        />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      {/* Plataforma / Instrumento */}
      <div>
        <label className={labelClass}>Plataforma / Instrumento</label>
        <div className="relative">
          <select {...register('tipo')} className={`${inputClass} appearance-none pr-8`}>
            <option value="">Seleccionar</option>
            {INSTRUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
          />
        </div>
        {errors.tipo && <p className={errorClass}>{errors.tipo.message}</p>}
      </div>

      {/* Monto invertido */}
      <div>
        <label className={labelClass}>
          <span>Monto invertido (MXN)</span>
          {amountLocked && (
            <span className="inline-flex items-center gap-1 ml-2 text-[#64748B]">
              <Lock size={10} />
              bloqueado
            </span>
          )}
        </label>
        <Controller
          control={control}
          name="montoInvertido"
          render={({ field }) => (
            <CurrencyInput
              value={field.value}
              onChange={field.onChange}
              currency="MXN"
              disabled={amountLocked}
              hasError={!!errors.montoInvertido && !amountLocked}
            />
          )}
        />
        {amountLocked ? (
          <p className="text-[#64748B] text-xs mt-1 ml-1">
            Con valuaciones registradas el monto no puede editarse.
            Usa &ldquo;Actualizar valuaciones&rdquo; para registrar el valor actual.
          </p>
        ) : (
          errors.montoInvertido && (
            <p className={errorClass}>{errors.montoInvertido.message}</p>
          )
        )}
      </div>

      {/* Liquidez */}
      <div>
        <label className={labelClass}>Liquidez</label>
        <Controller
          control={control}
          name="liquidez"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => field.onChange('a_la_vista')}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                  field.value === 'a_la_vista'
                    ? 'bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#22D3EE]'
                    : 'bg-transparent border-white/10 text-[#8899AA] hover:border-white/20'
                }`}
              >
                📈 A la vista
              </button>
              <button
                type="button"
                onClick={() => field.onChange('congelada')}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                  field.value === 'congelada'
                    ? 'bg-[#64748B]/30 border-[#64748B]/60 text-[#94A3B8]'
                    : 'bg-transparent border-white/10 text-[#8899AA] hover:border-white/20'
                }`}
              >
                🔒 Congelada
              </button>
            </div>
          )}
        />
      </div>

      {/* Notas */}
      <div>
        <label className={labelClass}>Notas (opcional)</label>
        <textarea
          {...register('notas')}
          placeholder="Plataforma, tasa, observaciones..."
          rows={2}
          className={`${inputClass} resize-none`}
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
            'Agregar inversión'
          )}
        </button>
      </div>
    </form>
  );
}