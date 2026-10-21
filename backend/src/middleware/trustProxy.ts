import net from "node:net";
import type { NextFunction, Request, Response } from "express";

/**
 * CONF-02 — Detección mínima y verificable de la IP del cliente detrás del proxy.
 *
 * Topología verificada (docs.railway.com/guides/public-networking/specs-and-limits):
 * el edge de Railway termina TLS y reenvía al contenedor con un único salto,
 * definiendo el header `X-Real-IP` con la IP remota real del cliente. El equipo de
 * Railway confirma que `X-Real-IP` es seguro para usar, mientras que
 * `X-Forwarded-For` NO lo es: el edge no elimina los valores que falsifica el
 * cliente, por lo que solo el último salto (el añadido por el edge) es confiable.
 *
 * Por eso esta configuración:
 * - Limita `trust proxy` a 1 salto en producción (nunca `true`), de modo que
 *   `req.ip` derivado de X-Forwarded-For nunca incluya cadenas falsificadas.
 * - Promueve `X-Real-IP` (cabecera definida por el edge) a `req.ip`, que es la
 *   clave que usan el rate limit, el bloqueo de login y el audit log.
 * - Ignora `X-Real-IP` si no es una IP válida (defensa ante valores corruptos).
 * - Fuera de producción no se confía en ningún proxy (acceso directo local).
 */

/** Devuelve el nº de saltos confiables según el entorno: 1 en producción, false fuera. */
export function resolveTrustProxyHops(nodeEnv: string | undefined): number | false {
  return nodeEnv === "production" ? 1 : false;
}

/** Middleware que promueve `X-Real-IP` (edge de Railway) a `req.ip` si es una IP válida. */
export function trustedClientIp() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const realIp = req.get("X-Real-IP");
    if (realIp && net.isIP(realIp) !== 0) {
      Object.defineProperty(req, "ip", { value: realIp, configurable: true });
    }
    next();
  };
}
