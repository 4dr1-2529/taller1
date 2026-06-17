/** URL base del API — resuelta en runtime, no en build (Vercel prerender). */

const DEV_BASE = "http://localhost:4000/api/v1";

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return DEV_BASE;
  return "";
}

export function requireApiBaseUrl(): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL no está configurada. Defínala en Vercel → Settings → Environment Variables.",
    );
  }
  return base;
}
