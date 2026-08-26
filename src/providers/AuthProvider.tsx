"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { auth } from "../app/lib/firebase";
import { clearAuthCookie } from "../lib/auth";
import {
  DEFAULT_ORGANIZATION_ID,
  ORGANIZATION_SCOPED_COLLECTIONS,
  isAdministrator,
  type UserProfile,
  type UserRole,
} from "../lib/organization";
import {
  setFirestoreOrganizationContext,
  tagLegacyOrganizationIds,
} from "../services/firestore";
import {
  createOrganizationMembershipForNewUser,
  resolveUserMembership,
} from "../services/organization";
import { destroySession, establishSession } from "../services/session";

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  organizationId: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function clearOrganizationState() {
  setFirestoreOrganizationContext(null);
}

async function softTagLegacyData() {
  await Promise.all(
    ORGANIZATION_SCOPED_COLLECTIONS.map(async (collectionName) => {
      try {
        await tagLegacyOrganizationIds(collectionName);
      } catch (error) {
        console.warn(
          `Unable to soft-tag legacy documents in ${collectionName}.`,
          error,
        );
      }
    }),
  );
}

async function applyMembership(profile: UserProfile) {
  setFirestoreOrganizationContext(profile.organizationId);
  // Await soft-tag so scoped where(organizationId==…) queries still see
  // pre-existing documents that lacked the field.
  if (profile.organizationId === DEFAULT_ORGANIZATION_ID) {
    await softTagLegacyData();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signupInProgressRef = useRef(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        clearOrganizationState();
        clearAuthCookie();
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      if (signupInProgressRef.current) {
        // Signup handler owns organization bootstrap to avoid racing into the
        // legacy default organization.
        return;
      }

      try {
        const membership = await resolveUserMembership(firebaseUser);
        setProfile(membership);
        await applyMembership(membership);
        await establishSession(firebaseUser);
      } catch (error) {
        console.error("Unable to resolve organization membership.", error);
        setProfile(null);
        clearOrganizationState();
      } finally {
        setLoading(false);
      }
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || signupInProgressRef.current) return;
      try {
        await establishSession(firebaseUser);
      } catch (error) {
        console.warn("Unable to refresh secure session cookie.", error);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      organizationId: profile?.organizationId ?? null,
      role: profile?.role ?? null,
      isAdmin: isAdministrator(profile?.role),
      loading,
      login: async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const membership = await resolveUserMembership(credential.user);
        setUser(credential.user);
        setProfile(membership);
        await applyMembership(membership);
        await establishSession(credential.user);
        setLoading(false);
        return credential.user;
      },
      signup: async (email: string, password: string) => {
        signupInProgressRef.current = true;
        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password,
          );
          const membership = await createOrganizationMembershipForNewUser(
            credential.user,
          );
          setUser(credential.user);
          setProfile(membership);
          await applyMembership(membership);
          await establishSession(credential.user);
          setLoading(false);
          return credential.user;
        } finally {
          signupInProgressRef.current = false;
        }
      },
      logout: async () => {
        await destroySession();
        clearAuthCookie();
        clearOrganizationState();
        setProfile(null);
        await signOut(auth);
      },
    }),
    [user, profile, loading],
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
