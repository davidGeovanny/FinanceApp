import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import { ChevronDown, X, Plus } from 'lucide-react';
import { transactionSchema, type TransactionFormData } from './transactionSchema';
import { useCreateTransaction, useUpdateTransaction } from './useTransactions';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useCategories } from '@/features/categories/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import type { Transaction } from '@/types';

interface TransactionFormProps {
  initial?: Transaction;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TIPO_LABELS = {
  gasto: 'Gasto',
  ingreso: 'Ingreso',
  transferencia: 'Transferencia',
} as const;

const TIPO_COLORS = {
  gasto: 'text-[#FF5B5B]',
  ingreso: 'text-[#1DB87A]',
  transferencia: 'text-[#8899AA]',
} as const;

const CURRENCIES = ['USD', 'EUR', 'CAD', 'GBP', 'JPY'];

export function TransactionForm({ initial, onSuccess, onCancel }: TransactionFormProps) {
  const { userProfile } = useAuth();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  const [showFx, setShowFx] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initial
      ? {
          tipo: initial.tipo,
          monto: String(initial.monto),
          cuentaId: initial.cuentaId,
          cuentaDestinoId: initial.cuentaDestinoId ?? '',
          categoriaId: initial.categoriaId,
          fecha: initial.fecha.toDate().toISOString().slice(0, 10),
          notas: initial.notas ?? '',
          etiquetas: initial.etiquetas,
          monedaOrigen: initial.monedaOrigen ?? '',
          montoOrigen: initial.montoOrigen ? String(initial.montoOrigen) : '',
        }
      : {
          tipo: 'gasto',
          monto: '',
          cuentaId: '',
          cuentaDestinoId: '',
          categoriaId: '',
          fecha: todayStr,
          notas: '',
          etiquetas: [],
          monedaOrigen: '',
          montoOrigen: '',
        },
  });

  const tipo = watch('tipo');
  const cuentaId = watch('cuentaId');
  const etiquetas = watch('etiquetas');
  const montoStr = watch('monto');
  const montoOrigenStr = watch('montoOrigen');

  // Derive currency from selected account
  const selectedAccount = accounts.find((a) => a.id === cuentaId);
  const currency = selectedAccount?.moneda ?? userProfile?.moneda ?? 'MXN';

  // Auto-compute tipoCambio
  const tipoCambio =
    montoStr && montoOrigenStr && parseFloat(montoOrigenStr) > 0
      ? parseFloat(montoStr) / parseFloat(montoOrigenStr)
      : undefined;

  // Filtered categories by tipo
  const filteredCats = categories.filter(
    (c) => c.tipo === tipo || c.tipo === 'ambos'
  );

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !etiquetas.includes(tag)) {
      setValue('etiquetas', [...etiquetas, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setValue('etiquetas', etiquetas.filter((t) => t !== tag));
  };

  const onSubmit = async (data: TransactionFormData) => {
    const monto = parseFloat(data.monto);
    const fecha = Timestamp.fromDate(new Date(data.fecha + 'T12:00:00'));

    const payload = {
      tipo: data.tipo,
      monto,
      moneda: currency,
      categoriaId: data.categoriaId ?? '',
      cuentaId: data.cuentaId,
      fecha,
      notas: data.notas ?? '',
      etiquetas: data.etiquetas,
      ...(data.cuentaDestinoId ? { cuentaDestinoId: data.cuentaDestinoId } : {}),
      ...(data.monedaOrigen ? { monedaOrigen: data.monedaOrigen } : {}),
      ...(data.montoOrigen ? { montoOrigen: parseFloat(data.montoOrigen) } : {}),
      ...(tipoCambio !== undefined ? { tipoCambio } : {}),
    };

    if (initial) {
      await updateTx.mutateAsync({ txId: initial.id, data: payload });
    } else {
      await createTx.mutateAsync(payload);
    }

    onSuccess?.();
  };

  const inputClass =
    'w-full bg-[#1E2A3A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none focus:border-[#3D8BFF]/50 focus:ring-1 focus:ring-[#3D8BFF]/30 transition-colors';
  const errorClass = 'text-[#FF5B5B] text-xs mt-1 ml-1';
  const labelClass = 'block text-xs font-medium text-[#8899AA] mb-1.5';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* ── Tipo ─────────────────────────────────────────────── */}
      <div>
        <label className={labelClass}>Tipo</label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {(['gasto', 'ingreso', 'transferencia'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => field.onChange(t)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                    field.value === t
                      ? t === 'gasto'
                        ? 'bg-[#FF5B5B]/15 border-[#FF5B5B]/40 text-[#FF5B5B]'
                        : t === 'ingreso'
                        ? 'bg-[#1DB87A]/15 border-[#1DB87A]/40 text-[#1DB87A]'
                        : 'bg-[#8899AA]/15 border-[#8899AA]/40 text-[#8899AA]'
                      : 'bg-transparent border-white/10 text-[#8899AA] hover:border-white/20'
                  }`}
                >
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* ── Monto ────────────────────────────────────────────── */}
      <div>
        <label className={labelClass}>
          Monto
          {currency && <span className={`ml-1 ${TIPO_COLORS[tipo]}`}>({currency})</span>}
        </label>
        <Controller
          control={control}
          name="monto"
          render={({ field }) => (
            <CurrencyInput
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              hasError={!!errors.monto}
            />
          )}
        />
        {errors.monto && <p className={errorClass}>{errors.monto.message}</p>}
      </div>

      {/* ── Cuenta origen ────────────────────────────────────── */}
      <div>
        <label className={labelClass}>
          {tipo === 'transferencia' ? 'Cuenta origen' : 'Cuenta'}
        </label>
        <div className="relative">
          <select
            {...register('cuentaId')}
            className={`${inputClass} appearance-none pr-8`}
          >
            <option value="">Seleccionar cuenta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} ({a.moneda}){a.investmentId ? ' 📈' : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
        </div>
        {errors.cuentaId && <p className={errorClass}>{errors.cuentaId.message}</p>}
      </div>

      {/* ── Cuenta destino (transferencia) ───────────────────── */}
      {tipo === 'transferencia' && (
        <div>
          <label className={labelClass}>Cuenta destino</label>
          <div className="relative">
            <select
              {...register('cuentaDestinoId')}
              className={`${inputClass} appearance-none pr-8`}
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.moneda})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
          </div>
          {errors.cuentaDestinoId && (
            <p className={errorClass}>{errors.cuentaDestinoId.message}</p>
          )}
        </div>
      )}

      {/* ── Categoría (no transferencia) ─────────────────────── */}
      {tipo !== 'transferencia' && (
        <div>
          <label className={labelClass}>Categoría</label>
          <div className="relative">
            <select
              {...register('categoriaId')}
              className={`${inputClass} appearance-none pr-8`}
            >
              <option value="">Seleccionar categoría</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icono} {c.nombre}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
          </div>
          {errors.categoriaId && <p className={errorClass}>{errors.categoriaId.message}</p>}
        </div>
      )}

      {/* ── Fecha ────────────────────────────────────────────── */}
      <div>
        <label className={labelClass}>Fecha</label>
        <input
          {...register('fecha')}
          type="date"
          className={`${inputClass} [color-scheme:dark]`}
        />
        {errors.fecha && <p className={errorClass}>{errors.fecha.message}</p>}
      </div>

      {/* ── Notas ────────────────────────────────────────────── */}
      <div>
        <label className={labelClass}>Notas (opcional)</label>
        <textarea
          {...register('notas')}
          placeholder="Descripción, referencia..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* ── Etiquetas ────────────────────────────────────────── */}
      <div>
        <label className={labelClass}>Etiquetas (opcional)</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            }}
            placeholder="Agregar etiqueta..."
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 bg-[#1E2A3A] border border-white/10 rounded-xl text-[#8899AA] hover:text-[#F0F4F8] hover:border-white/20 transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
        {etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {etiquetas.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-[#3D8BFF]/15 text-[#3D8BFF] text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Moneda extranjera (colapsable) ───────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowFx((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-[#8899AA] hover:text-[#F0F4F8] transition-colors cursor-pointer"
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${showFx ? 'rotate-180' : ''}`}
          />
          Pagado en otra moneda
        </button>

        {showFx && (
          <div className="mt-3 space-y-3 pl-3 border-l border-white/10">
            <div>
              <label className={labelClass}>Moneda origen</label>
              <div className="relative">
                <select
                  {...register('monedaOrigen')}
                  className={`${inputClass} appearance-none pr-8`}
                >
                  <option value="">Seleccionar</option>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Monto en moneda origen</label>
              <Controller
                control={control}
                name="montoOrigen"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    currency={watch('monedaOrigen') || '—'}
                  />
                )}
              />
            </div>

            {tipoCambio && (
              <p className="text-xs text-[#8899AA]">
                Tipo de cambio calculado:{' '}
                <span className="text-[#F0F4F8]">
                  {tipoCambio.toFixed(4)} {currency}/{watch('monedaOrigen')}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex gap-2 pt-2">
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
            'Agregar transacción'
          )}
        </button>
      </div>
    </form>
  );
}