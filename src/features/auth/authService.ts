import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';
import { seedSystemCategories } from '@/features/categories/categoryService';

const googleProvider = new GoogleAuthProvider();

// ─── Create user profile in Firestore ────────────────────────────────────────

async function createUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const profile: Omit<User, 'uid'> = {
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName ?? '',
      moneda: 'MXN',
      tema: 'dark',
      createdAt: serverTimestamp() as User['createdAt'],
    };
    await setDoc(ref, profile);
    await seedSystemCategories(firebaseUser.uid);
    return { uid: firebaseUser.uid, ...profile };
  }

  return { uid: firebaseUser.uid, ...snapshot.data() } as User;
}

// ─── Get user profile ─────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<User | null> {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { uid, ...snapshot.data() } as User;
}

// ─── Email & Password ─────────────────────────────────────────────────────────

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(result.user.uid);
  return { user: result.user, profile };
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  const profile = await createUserProfile(result.user);
  return { user: result.user, profile };
}

// ─── Google ───────────────────────────────────────────────────────────────────

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const profile = await createUserProfile(result.user);
  return { user: result.user, profile };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  await signOut(auth);
}

// ─── Auth state observer ──────────────────────────────────────────────────────

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}