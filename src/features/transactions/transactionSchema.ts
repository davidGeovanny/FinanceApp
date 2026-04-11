import { z } from 'zod';

export const transactionSchema = z
  .object({
    tipo: z.enum(['ingreso', 'gasto', 'transferencia']),
    monto: z
      .string()
      .min(1, 'Ingresa un monto')
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'El monto debe ser mayor a 0'),
    cuentaId: z.string().min(1, 'Selecciona una cuenta'),
    cuentaDestinoId: z.string().optional(),
    categoriaId: z.string().optional(),
    fecha: z.string().min(1, 'Selecciona una fecha'),
    notas: z.string().optional(),
    etiquetas: z.array(z.string()),
    // Foreign currency (optional)
    monedaOrigen: z.string().optional(),
    montoOrigen: z.string().optional(),
  })
  .refine(
    (d) => d.tipo !== 'transferencia' || !!d.cuentaDestinoId,
    { message: 'Selecciona la cuenta destino', path: ['cuentaDestinoId'] }
  )
  .refine(
    (d) => d.tipo !== 'transferencia' || d.cuentaId !== d.cuentaDestinoId,
    { message: 'Las cuentas deben ser diferentes', path: ['cuentaDestinoId'] }
  )
  .refine(
    (d) => d.tipo === 'transferencia' || !!d.categoriaId,
    { message: 'Selecciona una categoría', path: ['categoriaId'] }
  );

export type TransactionFormData = z.infer<typeof transactionSchema>;