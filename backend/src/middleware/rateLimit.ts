import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * Límites de tasa (corrección H-1, Sprint 4).
 *
 * Contexto del defecto: existía un único limitador global de 300 req/15 min
 * por IP en TODA /api/v1 y todas las rutas compartían ese presupuesto. Una
 * sola sesión interactiva intensiva (medida en la suite E2E del Sprint 3:
 * ~350 peticiones en minutos al recorrer secciones, tablas con debounce,
 * notificaciones y eventos LMS) agotaba el presupuesto compartido y las
 * llamadas ordinarias de la interfaz empezaban a recibir 429. Cuando varios
 * clientes comparten IP pública (NAT de un plantel), el agotamiento afecta a
 * todos los usuarios a la vez.
 *
 * Diseño actual (sin excepciones ni allowlists):
 *  - Limitador global (backstop): presupuesto amplio por IP que sigue
 *    acotando inundaciones pero no lo consume el uso normal intensivo.
 *  - Limitador de autenticación (estricto): login/refresh/change-password,
 *    rutas sensibles que minten tokens. Complementa el bloqueo de 5 intentos
 *    fallidos por IP que ya existe en auth.controller (cuenta fallos; este
 *    limitador cuenta todos los intentos, incluidos los exitosos).
 *  - Clave: req.ip. En producción req.ip es la IP real del cliente porque
 *    CONF-02 (Sprint 1) fija trust proxy a 1 salto y promueve X-Real-IP
 *    (validado como IP) en lugar de X-Forwarded-For, que el cliente puede
 *    falsificar. Fuera de producción no se confía en ningún proxy, por lo
 *    que una cabecera X-Forwarded-For manipulada no crea un bucket nuevo.
 *
 * Los valores son configurables por entorno con defaults seguros (env.ts);
 * producción no requiere ninguna variable nueva.
 */

/** Ventana compartida por ambos limitadores (default: 15 minutos). */
export const rateLimitWindowMs = (): number => env.RATE_LIMIT_WINDOW_MS;

const RATE_LIMIT_BODY = {
  success: false,
  message: "Demasiadas solicitudes. Intente más tarde.",
  errors: ["RATE_LIMIT"],
};

const AUTH_RATE_LIMIT_BODY = {
  success: false,
  message: "Demasiadas solicitudes de autenticación. Intente más tarde.",
  errors: ["RATE_LIMIT"],
};

/** Backstop global por IP para toda /api/v1. */
export function createGlobalLimiter() {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_BODY,
  });
}

/** Límite estricto por IP para login/refresh/change-password. */
export function createAuthLimiter() {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: AUTH_RATE_LIMIT_BODY,
  });
}
