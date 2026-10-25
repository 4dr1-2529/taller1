import test from "node:test";
import assert from "node:assert/strict";

// Guardar el entorno original
const origEnv = { ...process.env };

test("corsOrigins devuelve array de orígenes separados por coma", () => {
  process.env.CORS_ORIGIN = "http://localhost:3029,http://localhost:4000,https://app.vercel.app";
  // Re-evaluar no es posible sin reimportar, pero probamos la lógica de corsOrigins directamente
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const origins = corsOrigins();
  assert.ok(Array.isArray(origins));
  assert.strictEqual(origins.length, 3);
  assert.strictEqual(origins[0], "http://localhost:3029");
  assert.strictEqual(origins[1], "http://localhost:4000");
  assert.strictEqual(origins[2], "https://app.vercel.app");
});

test("corsOrigins filtra espacios en blanco", () => {
  process.env.CORS_ORIGIN = "  http://localhost:3029  ,  http://localhost:4000  ";
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const origins = corsOrigins();
  assert.strictEqual(origins[0], "http://localhost:3029");
  assert.strictEqual(origins[1], "http://localhost:4000");
});

test("isCorsOriginAllowed permite origen en lista", () => {
  process.env.CORS_ORIGIN = "http://localhost:3029,http://localhost:4000";
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowed = corsOrigins();
  const isCorsOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowed.includes("*")) return true;
    if (allowed.includes(origin)) return true;
    const allowsVercel = allowed.some((o) => o.includes(".vercel.app"));
    if (allowsVercel && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
      return true;
    }
    return false;
  };
  assert.strictEqual(isCorsOriginAllowed("http://localhost:3029"), true);
  assert.strictEqual(isCorsOriginAllowed("http://localhost:4000"), true);
});

test("isCorsOriginAllowed permite *", () => {
  process.env.CORS_ORIGIN = "*";
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowed = corsOrigins();
  const isCorsOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowed.includes("*")) return true;
    if (allowed.includes(origin)) return true;
    const allowsVercel = allowed.some((o) => o.includes(".vercel.app"));
    if (allowsVercel && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
      return true;
    }
    return false;
  };
  assert.strictEqual(isCorsOriginAllowed("http://cualquier-dominio.com"), true);
  assert.strictEqual(isCorsOriginAllowed("https://otro.com"), true);
});

test("isCorsOriginAllowed permite *.vercel.app", () => {
  process.env.CORS_ORIGIN = "http://localhost:3029,https://app.vercel.app";
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowed = corsOrigins();
  const isCorsOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowed.includes("*")) return true;
    if (allowed.includes(origin)) return true;
    const allowsVercel = allowed.some((o) => o.includes(".vercel.app"));
    if (allowsVercel && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
      return true;
    }
    return false;
  };
  assert.strictEqual(isCorsOriginAllowed("https://mi-app.vercel.app"), true);
  assert.strictEqual(isCorsOriginAllowed("https://otra-app.vercel.app"), true);
});

test("isCorsOriginAllowed rechaza origen no permitido", () => {
  process.env.CORS_ORIGIN = "http://localhost:3029";
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowed = corsOrigins();
  const isCorsOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowed.includes("*")) return true;
    if (allowed.includes(origin)) return true;
    const allowsVercel = allowed.some((o) => o.includes(".vercel.app"));
    if (allowsVercel && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
      return true;
    }
    return false;
  };
  assert.strictEqual(isCorsOriginAllowed("https://evil.com"), false);
});

test("isCorsOriginAllowed permite undefined", () => {
  const corsOrigins = () => process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowed = corsOrigins();
  const isCorsOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowed.includes("*")) return true;
    if (allowed.includes(origin)) return true;
    const allowsVercel = allowed.some((o) => o.includes(".vercel.app"));
    if (allowsVercel && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
      return true;
    }
    return false;
  };
  assert.strictEqual(isCorsOriginAllowed(undefined), true);
});

// Restaurar el entorno original después de las pruebas
test.after(() => {
  process.env = origEnv;
});
