import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Persistence,
  type User,
} from 'firebase/auth';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  createAccount: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const getReactNativePersistence = (FirebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
}).getReactNativePersistence;

let firebaseAuth: Auth;
try {
  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  firebaseAuth = getAuth(firebaseApp);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => onAuthStateChanged(firebaseAuth, currentUser => {
    setUser(currentUser);
    setInitializing(false);
  }), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    async createAccount(email, password) {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    },
    async signInWithEmail(email, password) {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    },
    async signInWithGoogleIdToken(idToken) {
      await signInWithCredential(firebaseAuth, GoogleAuthProvider.credential(idToken));
    },
    async signOutUser() {
      await signOut(firebaseAuth);
    },
  }), [initializing, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

export function getAuthErrorMessage(error: unknown) {
  const value = error as { code?: string; message?: string };
  switch (value.code) {
    case 'auth/email-already-in-use': return 'That email address is already connected to an account.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password': return 'Use a password with at least 6 characters.';
    case 'auth/invalid-credential': return 'The email or password is incorrect.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/network-request-failed': return 'Check your internet connection and try again.';
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.';
    default: return value.message?.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.+\)\.?$/, '') || 'Authentication failed. Please try again.';
  }
}
