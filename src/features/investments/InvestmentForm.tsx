import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Lock, Plus, Check, X, Wallet } from 'lucide-react';
import { useCreateInvestment, useUpdateInvestment } from './useInvestments';
import { useInvestmentTypes, useCreateInvestmentType } from './useInvestmentTypes';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { createAccount, getAccountByInvestmentId, updateAccount } from '@/features/accounts/accountService';
import { useAuth } from '@/hooks/useAuth';
import type { Investment } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const investmentSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  tipoId: z.string().min(1, 'Selecciona el tipo'),
  montoInvertido: z
    .string()
    .min(1, 'Ingresa el monto')
    .refine((v) => parseFloat(v) >= 0, 'Debe ser mayor o igual a 0'),
  liquidez: z.enum(['a_la_vista', 'congelada']),
  notas: z.string().optional(),
  esTransaccional: z.boolean(),
  moneda: z.string().min(1, 'Selecciona una moneda'),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

// ─── Emoji options for new type ───────────────────────────────────────────────

const EMOJI_OPTIONS = ['📊','💹','🏛️','🟣','💙','🟢','🔵','🟡','💰','📈','🏦','💎'];
const CURRENCIES = ['MXN', 'USD', 'EUR', 'CAD', 'GBP'];

// ─── Component ────────────────────────────────────────────────────────────────

interface InvestmentFormProps {
  initial?: Investment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvestmentForm({ initial, onSuccess, onCancel }: InvestmentFormProps) {
  const { firebaseUser } = useAuth();
  const createInvestment = useCreateInvestment();
  const updateInvestment = useUpdateInvestment();
  const { data: investmentTypes = [] } = useInvestmentTypes();
  const createType = useCreateInvestmentType();

  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('📊');

  const amountLocked = !!initial && initial.valuaciones.length >= 1;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          tipoId: initial.tipoId,
          montoInvertido: String(initial.montoInvertido),
          liquidez: initial.liquidez,
          notas: initial.notas ?? '',
          esTransaccional: initial.esTransaccional ?? false,
          moneda: initial.moneda ?? 'MXN',
        }
      : {
          nombre: '',
          tipoId: '',
          montoInvertido: '',
          liquidez: 'a_la_vista',
          notas: '',
          esTransaccional: false,
          moneda: 'MXN',
        },
  });

  const esTransaccional = watch('esTransaccional');
  const moneda = watch('moneda');

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    const created = await createType.mutateAsync({
      nombre: newTypeName.trim(),
      icono: newTypeIcon,
    });
    setValue('tipoId', created.id);
    setNewTypeName('');
    setNewTypeIcon('📊');
    setAddingType(false);
  };

  const onSubmit = async (data: InvestmentFormData) => {
    const uid = firebaseUser!.uid;
    const payload: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'> = {
      nombre: data.nombre,
      tipoId: data.tipoId,
      montoInvertido: amountLocked
        ? initial!.montoInvertido
        : parseFloat(data.montoInvertido),
      liquidez: data.liquidez,
      notas: data.notas ?? '',
      valuaciones: initial?.valuaciones ?? [],
      esTransaccional: data.esTransaccional,
      moneda: data.moneda,
    };

    if (initial) {
      await updateInvestment.mutateAsync({ investmentId: initial.id, data: payload });

      // If toggling esTransaccional on, create the virtual account
      if (data.esTransaccional && !initial.esTransaccional) {
        const existing = await getAccountByInvestmentId(uid, initial.id);
        if (!existing) {
          const valorActual = initial.valuaciones.length > 0
            ? [...initial.valuaciones].sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis())[0].valor
            : initial.montoInvertido;
          await createAccount(uid, {
            nombre: data.nombre,
            tipo: 'inversion_vista',
            saldo_inicial: valorActual,
            moneda: data.moneda,
            investmentId: initial.id,
          });
        } else {
          // Update moneda in case it changed
          await updateAccount(uid, existing.id, { moneda: data.moneda });
        }
      }

      // If toggling esTransaccional off, just leave the account — no auto-delete
      // (user might want to keep history; they can delete manually)

    } else {
      const created = await createInvestment.mutateAsync(payload);

      // Create virtual account for transaccional investments
      if (data.esTransaccional) {
        await createAccount(uid, {
          nombre: data.nombre,
          tipo: 'inversion_vista',
          saldo_inicial: parseFloat(data.montoInvertido),
          moneda: data.moneda,
          investmentId: created.id,
        });
      }
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
          placeholder="Ej. CETES 28d, Nu Cajitas, Mercado Pago..."
          className={inputClass}
        />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label className={labelClass}>Plataforma / Instrumento</label>

        {addingType ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewTypeIcon(emoji)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors cursor-pointer ${
                    newTypeIcon === emoji
                      ? 'bg-[#3D8BFF]/20 ring-1 ring-[#3D8BFF]/50'
                      : 'bg-[#1E2A3A] hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg flex-shrink-0">{newTypeIcon}</span>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(); } }}
                placeholder="Nombre del tipo..."
                autoFocus
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={handleAddType}
                disabled={!newTypeName.trim() || createType.isPending}
                className="p-2 rounded-xl bg-[#1DB87A] hover:bg-[#18a06a] text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Check size={15} />
              </button>
              <button
                type="button"
                onClick={() => { setAddingType(false); setNewTypeName(''); setNewTypeIcon('📊'); }}
                className="p-2 rounded-xl border border-white/10 text-[#8899AA] hover:text-[#F0F4F8] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                {...register('tipoId')}
                className={`${inputClass} appearance-none pr-8`}
              >
                <option value="">Seleccionar</option>
                {investmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icono} {t.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddingType(true)}
              title="Agregar nuevo tipo"
              className="px-3 bg-[#1E2A3A] border border-white/10 rounded-xl text-[#8899AA] hover:text-[#3D8BFF] hover:border-[#3D8BFF]/30 transition-colors cursor-pointer flex-shrink-0"
            >
              <Plus size={15} />
            </button>
          </div>
        )}

        {errors.tipoId && <p className={errorClass}>{errors.tipoId.message}</p>}
      </div>

      {/* Monto invertido */}
      <div>
        <label className={labelClass}>
          Monto invertido
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
              currency={moneda}
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

      {/* ── Cuenta transaccional ────────────────────────────── */}
      <div className="bg-[#1E2A3A] rounded-xl p-3 space-y-3">
        <Controller
          control={control}
          name="esTransaccional"
          render={({ field }) => (
            <button
              type="button"
              onClick={() => field.onChange(!field.value)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    field.value ? 'bg-[#A78BFA]/20' : 'bg-white/5'
                  }`}
                >
                  <Wallet size={15} className={field.value ? 'text-[#A78BFA]' : 'text-[#8899AA]'} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${field.value ? 'text-[#F0F4F8]' : 'text-[#8899AA]'}`}>
                    Usar como cuenta
                  </p>
                  <p className="text-xs text-[#8899AA]">
                    Permite registrar transacciones directamente
                  </p>
                </div>
              </div>
              {/* Toggle visual */}
              <div
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                  field.value ? 'bg-[#A78BFA]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    field.value ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          )}
        />

        {/* Moneda — solo visible si esTransaccional */}
        {esTransaccional && (
          <div>
            <label className={labelClass}>Moneda de la cuenta</label>
            <div className="relative">
              <select
                {...register('moneda')}
                className={`${inputClass} appearance-none pr-8`}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
              />
            </div>
            {errors.moneda && <p className={errorClass}>{errors.moneda.message}</p>}
            <p className="text-xs text-[#8899AA] mt-1.5 ml-1">
              Esta inversión aparecerá en Cuentas y podrás seleccionarla en transacciones.
            </p>
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label className={labelClass}>Notas (opcional)</label>
        <textarea
          {...register('notas')}
          placeholder="Tasa, observaciones..."
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