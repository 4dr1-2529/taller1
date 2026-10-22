"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setUnauthorizedHandler, type AuthUser } from "@/services/api";

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
  isEstudiante: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // SPRINT 5 — Rotación de refresh tokens: además del access token, el backend
  // devuelve un refresh token nuevo; hay que persistirlo (estado + localStorage)
  // porque el anterior queda invalidado en la rotación.
  const persistRefresh = useCallback((res: { token: string; refreshToken?: string }) => {
    setToken(res.token);
    api.setToken(res.token);
    localStorage.setItem("tesis-token", res.token);
    if (res.refreshToken) {
      setRefreshToken(res.refreshToken);
      localStorage.setItem("tesis-refresh-token", res.refreshToken);
    }
  }, []);

  const logout = useCallback(() => {
    const currentToken = localStorage.getItem("tesis-token");
    const currentRefreshToken = localStorage.getItem("tesis-refresh-token");
    if (currentToken) {
      api.setToken(currentToken);
      void api.logout(currentRefreshToken).catch(() => undefined);
    }
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
            persistRefresh(res);
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
  }, [logout, persistRefresh]);

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
      persistRefresh(res);
    } catch {
      // Otra pestaña pudo haber renovado primero (rotación): si el almacén ya
      // tiene un token distinto, se reintenta con él antes de cerrar sesión.
      const current = localStorage.getItem("tesis-refresh-token");
      if (current && current !== refreshToken) {
        try {
          const res = await api.refreshToken(current);
          persistRefresh(res);
          return;
        } catch {
          logout();
          return;
        }
      }
      logout();
    }
  }, [refreshToken, persistRefresh, logout]);

  // CONF-13: el cliente HTTP avisa cuando una petición recibe 401. Se intenta
  // UNA renovación con el refresh token (single-flight en el cliente, sin
  // bucles) y, si falla, se cierra la sesión → page.tsx redirige a /login.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      const rt = localStorage.getItem("tesis-refresh-token");
      if (!rt) return false;
      try {
        const res = await api.refreshToken(rt);
        persistRefresh(res);
        return true;
      } catch {
        // SPRINT 5 — Renovación concurrente entre pestañas: si otra pestaña ya
        // guardó el refresh token vigente, se reintenta con él; solo se cierra
        // la sesión cuando también ese intento falla.
        const current = localStorage.getItem("tesis-refresh-token");
        if (current && current !== rt) {
          try {
            const res = await api.refreshToken(current);
            persistRefresh(res);
            return true;
          } catch {
            logout();
            return false;
          }
        }
        logout();
        return false;
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [persistRefresh, logout]);

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
