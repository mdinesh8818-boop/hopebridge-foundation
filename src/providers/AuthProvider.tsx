"use client";

import {
    onAuthStateChanged,
    signOut,
    User
  } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import { auth } from "../app/lib/firebase";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
  };

  const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => {},
  });

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}