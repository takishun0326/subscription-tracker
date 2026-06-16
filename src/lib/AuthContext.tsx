/**
 * 認証コンテキスト。Firebase Auth のログイン状態を保持し、
 * メール/パスワードと匿名ログインを提供する。
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  configured: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setInitializing(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setInitializing(false);
    });
    return unsubscribe;
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      configured,
      signInEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signUpEmail: async (email, password) => {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signInGuest: async () => {
        await signInAnonymously(getFirebaseAuth());
      },
      signOut: async () => {
        await fbSignOut(getFirebaseAuth());
      },
    }),
    [user, initializing, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider の内側で使用してください");
  }
  return ctx;
}
