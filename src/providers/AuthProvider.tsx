"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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
import { auth } from "../app/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "../lib/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      settled = true;
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthCookie();
      } else {
        clearAuthCookie();
      }
      setLoading(false);
    });

    // Prevent guest/auth screens from hanging indefinitely if the auth
    // listener is delayed by network conditions in some environments.
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        setLoading(false);
      }
    }, 6000);

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setAuthCookie();
        return credential.user;
      },
      signup: async (email: string, password: string) => {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setAuthCookie();
        return credential.user;
      },
      logout: async () => {
        await signOut(auth);
        clearAuthCookie();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
