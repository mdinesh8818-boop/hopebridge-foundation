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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth } from "../app/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "../lib/auth";
import type { UserProfile } from "@/lib/accessControl";
import {
  createPendingUserProfile,
  ensureUserProfile,
  fetchUserProfile,
} from "@/services/userProfile";

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  login: (email: string, password: string) => Promise<{
    user: User;
    profile: UserProfile;
  }>;
  signup: (email: string, password: string) => Promise<{
    user: User;
    profile: UserProfile;
  }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) {
      setProfile(null);
      return null;
    }
    setProfileLoading(true);
    try {
      const next = await ensureUserProfile(current);
      setProfile(next);
      return next;
    } catch {
      const fallback = await fetchUserProfile(current.uid).catch(() => null);
      setProfile(fallback);
      return fallback;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthCookie();
        setProfileLoading(true);
        void ensureUserProfile(firebaseUser)
          .then((next) => setProfile(next))
          .catch(async () => {
            const fallback = await fetchUserProfile(firebaseUser.uid).catch(
              () => null,
            );
            setProfile(fallback);
          })
          .finally(() => {
            setProfileLoading(false);
            setLoading(false);
          });
      } else {
        clearAuthCookie();
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      refreshProfile,
      login: async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setAuthCookie();
        const nextProfile = await ensureUserProfile(credential.user);
        setUser(credential.user);
        setProfile(nextProfile);
        return { user: credential.user, profile: nextProfile };
      },
      signup: async (email: string, password: string) => {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setAuthCookie();
        const nextProfile = await createPendingUserProfile(credential.user);
        setUser(credential.user);
        setProfile(nextProfile);
        return { user: credential.user, profile: nextProfile };
      },
      logout: async () => {
        await signOut(auth);
        clearAuthCookie();
        setUser(null);
        setProfile(null);
      },
    }),
    [user, profile, loading, profileLoading, refreshProfile],
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
