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

/**
 * Lee una variable de entorno obligatoria para credenciales de prueba E2E.
 * Nunca se admiten contraseñas hard-codeadas como fallback.
 */
function requireE2EEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Falta variable de entorno E2E "${name}". Defínala antes de ejecutar las pruebas E2E (never hard-codear contraseñas de prueba).`,
    );
  }
  return value;
}

/** Cuentas ficticias locales. Las contraseñas deben venir de variables de entorno (E2E_*_PASSWORD). */
export const ACCOUNTS = {
  director: {
    email: "f4-director@example.test",
    password: requireE2EEnv("E2E_DIRECTOR_PASSWORD"),
  },
  profesorA: {
    email: "f4-prof-a@example.test",
    password: requireE2EEnv("E2E_PROFA_PASSWORD"),
  },
  profesorB: {
    email: "f4-prof-b@example.test",
    password: requireE2EEnv("E2E_PROFB_PASSWORD"),
  },
  estudianteA: {
    email: "f4-est-a@example.test",
    password: requireE2EEnv("E2E_ESTA_PASSWORD"),
  },
  estudianteB: {
    email: "f4-est-b@example.test",
    password: requireE2EEnv("E2E_ESTB_PASSWORD"),
  },
} as const;

export type RoleKey = keyof typeof ACCOUNTS;

export const TIMEOUT = 20000;
