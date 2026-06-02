"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, type AuthUser } from "@/services/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isDocente: boolean;
  isTutor: boolean;
  isPsicologo: boolean;
  isEstudiante: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    api.setToken(null);
    localStorage.removeItem("tesis-token");
    localStorage.removeItem("tesis-refresh-token");
    localStorage.removeItem("tesis-user");
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const t = localStorage.getItem("tesis-token");
      const rt = localStorage.getItem("tesis-refresh-token");
      const u = localStorage.getItem("tesis-user");
      if (!t || !u) {
        setLoading(false);
        return;
      }
      try {
        setUser(JSON.parse(u) as AuthUser);
      } catch {
        logout();
        setLoading(false);
        return;
      }
      setToken(t);
      if (rt) setRefreshToken(rt);
      api.setToken(t);
      try {
        const me = await api.getMe();
        setUser(me.user);
        localStorage.setItem("tesis-user", JSON.stringify(me.user));
      } catch {
        if (rt) {
          try {
            const res = await api.refreshToken(rt);
            setToken(res.token);
            api.setToken(res.token);
            localStorage.setItem("tesis-token", res.token);
            const me = await api.getMe();
            setUser(me.user);
            localStorage.setItem("tesis-user", JSON.stringify(me.user));
          } catch {
            logout();
          }
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    }
    void restoreSession();
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    setUser(res.user);
    api.setToken(res.token);
    localStorage.setItem("tesis-token", res.token);
    if (res.refreshToken) localStorage.setItem("tesis-refresh-token", res.refreshToken);
    localStorage.setItem("tesis-user", JSON.stringify(res.user));
  }, []);

  const refresh = useCallback(async () => {
    if (!refreshToken) return;
    try {
      const res = await api.refreshToken(refreshToken);
      setToken(res.token);
      api.setToken(res.token);
      localStorage.setItem("tesis-token", res.token);
    } catch {
      logout();
    }
  }, [refreshToken, logout]);

  const hasRole = useCallback((roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refresh,
      isAuthenticated: !!token,
      hasRole,
      isAdmin: user?.role === "admin",
      isDocente: user?.role === "docente",
      isTutor: user?.role === "tutor",
      isPsicologo: user?.role === "psicologo",
      isEstudiante: user?.role === "estudiante",
    }),
    [user, token, loading, login, logout, refresh, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
