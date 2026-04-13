import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  addValuation,
  type InvestmentInput,
} from './investmentService';

export function useInvestments() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? '';

  return useQuery({
    queryKey: ['investments', uid],
    queryFn: () => getInvestments(uid),
    enabled: !!uid,
  });
}

export function useCreateInvestment() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (data: InvestmentInput) => createInvestment(uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}

export function useUpdateInvestment() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({
      investmentId,
      data,
    }: {
      investmentId: string;
      data: Partial<InvestmentInput>;
    }) => updateInvestment(uid, investmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}

export function useDeleteInvestment() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (investmentId: string) => deleteInvestment(uid, investmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}

export function useAddValuation() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({ investmentId, valor }: { investmentId: string; valor: number }) =>
      addValuation(uid, investmentId, valor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}