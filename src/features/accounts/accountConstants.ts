import type { AccountType } from '@/types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  banco:               'Banco',
  tarjeta_credito:     'Tarjeta de crédito',
  efectivo:            'Efectivo',
  inversion_vista:     'Inversión a la vista',
  inversion_congelada: 'Inversión congelada',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  banco:               '🏦',
  tarjeta_credito:     '💳',
  efectivo:            '💵',
  inversion_vista:     '📈',
  inversion_congelada: '🔒',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  banco:               '#3D8BFF',
  tarjeta_credito:     '#FF5B5B',
  efectivo:            '#1DB87A',
  inversion_vista:     '#22D3EE',
  inversion_congelada: '#64748B',
};