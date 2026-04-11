import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from './accountService';
import type { Account } from '@/types';

export function useAccounts() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? '';

  return useQuery({
    queryKey: ['accounts', uid],
    queryFn: () => getAccounts(uid),
    enabled: !!uid,
  });
}

export function useCreateAccount() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
      createAccount(firebaseUser!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', firebaseUser?.uid] });
    },
  });
}

export function useUpdateAccount() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: Partial<Omit<Account, 'id' | 'createdAt'>>;
    }) => updateAccount(firebaseUser!.uid, accountId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', firebaseUser?.uid] });
    },
  });
}

export function useDeleteAccount() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => deleteAccount(firebaseUser!.uid, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts', firebaseUser?.uid] });
    },
  });
}