import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/store/authStore';
import { onAuthChange, getOrCreateUserProfile } from '@/features/auth/authService';
import type { User as FirebaseUser } from 'firebase/auth';

/**
 * Resolves the best available display name from the profile and Firebase user.
 * Priority: Firestore displayName → Firebase displayName → email prefix → fallback
 */
export function resolveDisplayName(
  userProfile: { displayName?: string } | null,
  firebaseUser: FirebaseUser | null
): string {
  return (
    userProfile?.displayName ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    'Usuario'
  );
}

/**
 * Bootstraps the auth listener once at app root.
 * Syncs Firebase auth state → Zustand store.
 */
export function useAuthInit() {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        const profile = await getOrCreateUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [setFirebaseUser, setUserProfile, setLoading]);
}

/**
 * Returns current auth state from the store (no side-effects).
 */
export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      firebaseUser: s.firebaseUser,
      userProfile: s.userProfile,
      loading: s.loading,
      isAuthenticated: !!s.firebaseUser,
    }))
  );
}