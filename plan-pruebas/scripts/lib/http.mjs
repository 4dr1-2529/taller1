import { URLS } from "./config.mjs";

export async function login(email, password) {
  const t0 = performance.now();
  const r = await fetch(`${URLS.api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
  });
  const ms = Math.round(performance.now() - t0);
  const body = await r.json().catch(() => ({}));
  const token = body.data?.token ?? body.token;
  if (!r.ok || !token) {
    throw new Error(`login ${email} → ${r.status}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return { token, ms, body };
}

export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const t0 = performance.now();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${URLS.api}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const ms = Math.round(performance.now() - t0);
  let json = null;
  const text = await r.text();
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: r.status, ok: r.ok, ms, json };
}
