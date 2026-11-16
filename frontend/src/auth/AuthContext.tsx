import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getMe } from "../api/auth";
import { ApiError, setToken } from "../api/client";
import type { TokenResponse, User } from "../api/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  applySession: (session: TokenResponse) => void;
  refreshUser: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        signOut();
        return;
      }
      throw error;
    }
  }, [signOut]);

  const applySession = useCallback((session: TokenResponse) => {
    setToken(session.access_token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("lp_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    void refreshUser()
      .catch(() => {
        signOut();
      })
      .finally(() => setLoading(false));
  }, [refreshUser, signOut]);

  const value = useMemo(
    () => ({ user, loading, applySession, refreshUser, signOut }),
    [user, loading, applySession, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
