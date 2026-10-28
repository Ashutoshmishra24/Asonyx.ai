import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
  type User,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  pendingPhone: string | null;
  sendPhoneCode: (phone: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  linkEmailPassword: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

GoogleSignin.configure(webClientId ? { webClientId } : {});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(getAuth(), currentUser => {
    setUser(currentUser);
    setInitializing(false);
  }), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    pendingPhone,
    async sendPhoneCode(phone) {
      const result = await signInWithPhoneNumber(getAuth(), phone);
      setPendingPhone(phone);
      setConfirmation(result);
    },
    async confirmPhoneCode(code) {
      if (!confirmation) throw new Error('Request a new verification code first.');
      const credential = await confirmation.confirm(code);
      if (!credential) throw new Error('Firebase could not verify this code. Please try again.');
      setConfirmation(null);
    },
    async linkEmailPassword(email, password) {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('Verify your phone number before adding an email and password.');
      await linkWithCredential(currentUser, EmailAuthProvider.credential(email, password));
      setPendingPhone(null);
    },
    async signInWithEmail(email, password) {
      await signInWithEmailAndPassword(getAuth(), email, password);
    },
    async signInWithGoogle() {
      if (!webClientId) {
        throw new Error('Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.');
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return false;
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an identity token. Check the Firebase web client ID.');
      await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken));
      return true;
    },
    async signOutUser() {
      await signOut(getAuth());
      await GoogleSignin.signOut().catch(() => undefined);
      setConfirmation(null);
      setPendingPhone(null);
    },
  }), [confirmation, initializing, pendingPhone, user]);

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
    case 'auth/invalid-phone-number': return 'Enter a valid phone number with its country code, for example +91 98765 43210.';
    case 'auth/too-many-requests': return 'Too many attempts were made. Wait a little before trying again.';
    case 'auth/invalid-verification-code': return 'That verification code is incorrect or expired.';
    case 'auth/session-expired': return 'This verification session expired. Request a new code.';
    case 'auth/email-already-in-use': return 'That email address is already connected to another account.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password': return 'Use a password with at least 6 characters.';
    case 'auth/invalid-credential': return 'The email or password is incorrect.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/network-request-failed': return 'Check your internet connection and try again.';
    default: return value.message?.replace(/^\[[^\]]+\]\s*/, '') || 'Authentication failed. Please try again.';
  }
}
