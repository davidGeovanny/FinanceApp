import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionFilters,
  type TransactionInput,
} from './transactionService';

export function useTransactions(filters?: TransactionFilters) {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? '';

  return useQuery({
    queryKey: ['transactions', uid, filters],
    queryFn: () => getTransactions(uid, filters),
    enabled: !!uid,
  });
}

export function useCreateTransaction() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (data: TransactionInput) => createTransaction(uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}

export function useUpdateTransaction() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({ txId, data }: { txId: string; data: Partial<TransactionInput> }) =>
      updateTransaction(uid, txId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}

export function useDeleteTransaction() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (txId: string) => deleteTransaction(uid, txId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', uid] });
      qc.invalidateQueries({ queryKey: ['accounts', uid] });
    },
  });
}