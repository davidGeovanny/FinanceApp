import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categoryService';
import type { Category } from '@/types';

export function useCategories() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? '';

  return useQuery({
    queryKey: ['categories', uid],
    queryFn: () => getCategories(uid),
    enabled: !!uid,
    // Categories are a rarely-changing catalog — no need to refetch aggressively
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCategory() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'createdAt' | 'sistema'>) =>
      createCategory(firebaseUser!.uid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', firebaseUser?.uid] });
    },
  });
}

export function useUpdateCategory() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<Omit<Category, 'id' | 'createdAt' | 'sistema'>>;
    }) => updateCategory(firebaseUser!.uid, categoryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', firebaseUser?.uid] });
    },
  });
}

export function useDeleteCategory() {
  const { firebaseUser } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(firebaseUser!.uid, categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', firebaseUser?.uid] });
    },
  });
}