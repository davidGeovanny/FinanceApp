import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown } from 'lucide-react';
import { useCreateAccount, useUpdateAccount } from './useAccounts';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from './accountConstants';
import type { Account, AccountType } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

// Investment types are intentionally excluded — they live in the Investments module
type TransactionalAccountType = Extract<AccountType, 'banco' | 'tarjeta_credito' | 'efectivo'>;

const accountSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(40),
  tipo: z.enum(['banco', 'tarjeta_credito', 'efectivo']),
  saldo_inicial: z
    .string()
    .min(1, 'Ingresa un saldo')
    .refine((v) => !isNaN(parseFloat(v)), 'Saldo inválido'),
  moneda: z.string().min(1, 'Selecciona una moneda'),
});

type AccountFormData = z.infer<typeof accountSchema>;

// Only transactional types are offered in the form
const TRANSACTIONAL_TYPES: TransactionalAccountType[] = [
  'banco',
  'tarjeta_credito',
  'efectivo',
];

const CURRENCIES = ['MXN', 'USD', 'EUR', 'CAD', 'GBP'];

// ─── Component ────────────────────────────────────────────────────────────────

interface AccountFormProps {
  initial?: Account;
  defaultMoneda?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AccountForm({
  initial,
  defaultMoneda = 'MXN',
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: initial
      ? {
          nombre: initial.nombre,
          tipo: initial.tipo as TransactionalAccountType,
          saldo_inicial: String(initial.saldo_inicial),
          moneda: initial.moneda,
        }
      : {
          nombre: '',
          tipo: 'banco',
          saldo_inicial: '',
          moneda: defaultMoneda,
        },
  });

  const moneda = watch('moneda');

  const onSubmit = async (data: AccountFormData) => {
    const payload = {
      nombre: data.nombre,
      tipo: data.tipo as AccountType,
      saldo_inicial: parseFloat(data.saldo_inicial),
      moneda: data.moneda,
    };

    if (initial) {
      await updateAccount.mutateAsync({ accountId: initial.id, data: payload });
    } else {
      await createAccount.mutateAsync(payload);
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
          placeholder="Ej. Banregio, Nu Cuenta, Cartera..."
          className={inputClass}
        />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label className={labelClass}>Tipo de cuenta</label>
        <div className="relative">
          <select {...register('tipo')} className={`${inputClass} appearance-none pr-8`}>
            {TRANSACTIONAL_TYPES.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ACCOUNT_TYPE_ICONS[tipo]} {ACCOUNT_TYPE_LABELS[tipo]}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899AA] pointer-events-none"
          />
        </div>
        {errors.tipo && <p className={errorClass}>{errors.tipo.message}</p>}
      </div>

      {/* Saldo inicial + Moneda */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Saldo inicial</label>
          <Controller
            control={control}
            name="saldo_inicial"
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                currency={moneda}
                hasError={!!errors.saldo_inicial}
                allowNegative
              />
            )}
          />
          {errors.saldo_inicial && (
            <p className={errorClass}>{errors.saldo_inicial.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Moneda</label>
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
            'Crear cuenta'
          )}
        </button>
      </div>
    </form>
  );
}