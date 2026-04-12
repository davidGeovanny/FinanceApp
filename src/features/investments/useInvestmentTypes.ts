import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getInvestmentTypes,
  createInvestmentType,
  updateInvestmentType,
  deleteInvestmentType,
} from './investmentTypeService';
import type { InvestmentType } from '@/types';

export function useInvestmentTypes() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? '';

  return useQuery({
    queryKey: ['investmentTypes', uid],
    queryFn: () => getInvestmentTypes(uid),
    enabled: !!uid,
  });
}

export function useCreateInvestmentType() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (data: Pick<InvestmentType, 'nombre' | 'icono'>) =>
      createInvestmentType(uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investmentTypes', uid] }),
  });
}

export function useUpdateInvestmentType() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({
      typeId,
      data,
    }: {
      typeId: string;
      data: Pick<InvestmentType, 'nombre' | 'icono'>;
    }) => updateInvestmentType(uid, typeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investmentTypes', uid] }),
  });
}

export function useDeleteInvestmentType() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (typeId: string) => deleteInvestmentType(uid, typeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investmentTypes', uid] }),
  });
}