import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getSavings,
  createSaving,
  updateSaving,
  deleteSaving,
  abonarSaving,
  retirarSaving,
  archivarSaving,
  desarchivarSaving,
  type SavingInput,
} from './savingService';

export function useSavings() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? '';

  return useQuery({
    queryKey: ['savings', uid],
    queryFn: () => getSavings(uid),
    enabled: !!uid,
  });
}

export function useCreateSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (data: SavingInput) => createSaving(uid, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}

export function useUpdateSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({ savingId, data }: { savingId: string; data: Partial<SavingInput> }) =>
      updateSaving(uid, savingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}

export function useDeleteSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (savingId: string) => deleteSaving(uid, savingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}

export function useAbonarSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({
      savingId,
      nuevoActual,
      objetivo,
    }: {
      savingId: string;
      nuevoActual: number;
      objetivo: number;
    }) => abonarSaving(uid, savingId, nuevoActual, objetivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}

export function useRetirarSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: ({
      savingId,
      nuevoActual,
      objetivo,
    }: {
      savingId: string;
      nuevoActual: number;
      objetivo: number;
    }) => retirarSaving(uid, savingId, nuevoActual, objetivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}

export function useArchivarSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (savingId: string) => archivarSaving(uid, savingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}

export function useDesarchivarSaving() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();
  const uid = firebaseUser?.uid ?? '';

  return useMutation({
    mutationFn: (savingId: string) => desarchivarSaving(uid, savingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings', uid] }),
  });
}