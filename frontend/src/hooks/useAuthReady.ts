"use client";

import { useAuth } from "@/contexts/AuthProvider";

/** Sesión cargada y rol confirmado — evita llamadas API con rol incorrecto. */
export function useAuthReady() {
  const auth = useAuth();
  const role = auth.user?.role;
  return {
    ...auth,
    role,
    ready: !auth.loading && !!auth.user && !!role,
  };
}
