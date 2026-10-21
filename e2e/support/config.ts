/**
 * Configuración de la suite E2E local (Sprint 3, FASE 5).
 *
 * Reglas duras:
 *  - Solo hosts locales: si E2E_BASE_URL no apunta a localhost/127.0.0.1 la
 *    suite se niega a arrancar (nunca contra Vercel/Railway).
 *  - Cuentas ficticias F4 de la BD desechable `blenkir_refactor_test`
 *    (fixtures de backend/tests/roles-login.integration.ts + seed-accounts.ts).
 *    NINGUNA credencial institucional real aparece aquí.
 */

const RAW_BASE = process.env.E2E_BASE_URL?.trim() || "http://localhost:3029";

let parsedBase: URL;
try {
  parsedBase = new URL(RAW_BASE);
} catch {
  throw new Error(`E2E_BASE_URL invalida: ${RAW_BASE}`);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
if (!LOCAL_HOSTS.has(parsedBase.hostname)) {
  throw new Error(
    `PROHIBIDO ejecutar E2E contra '${parsedBase.hostname}'. Solo hosts locales (localhost/127.0.0.1).`,
  );
}

export const BASE_URL = parsedBase.origin;

/** Cuentas ficticias locales. Las contraseñas se fija seed-accounts.ts. */
export const ACCOUNTS = {
  director: {
    email: "f4-director@example.test",
    password: process.env.E2E_DIRECTOR_PASSWORD ?? "F4-Direct0r",
  },
  profesorA: {
    email: "f4-prof-a@example.test",
    password: process.env.E2E_PROFA_PASSWORD ?? "F4-Profa123",
  },
  profesorB: {
    email: "f4-prof-b@example.test",
    password: process.env.E2E_PROFB_PASSWORD ?? "F4-Profb123",
  },
  estudianteA: {
    email: "f4-est-a@example.test",
    password: process.env.E2E_ESTA_PASSWORD ?? "F4-Esta1234",
  },
  estudianteB: {
    email: "f4-est-b@example.test",
    password: process.env.E2E_ESTB_PASSWORD ?? "F4-Estb1234",
  },
} as const;

export type RoleKey = keyof typeof ACCOUNTS;

export const TIMEOUT = 20000;
