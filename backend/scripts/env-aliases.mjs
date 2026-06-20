/** Copia en ESM para scripts que corren antes de dist (misma lógica que env-aliases.ts). */
const ENV_ALIASES = {
  JWT_SECRETO: "JWT_SECRET",
  ORIGEN_CORS: "CORS_ORIGIN",
  ENTORNO_NODO: "NODE_ENV",
  MYSQL_URL: "DATABASE_URL",
  MYSQL_PUBLIC_URL: "DATABASE_URL",
};

const NODE_ENV_ALIASES = {
  producción: "production",
  produccion: "production",
  desarrollo: "development",
  prueba: "test",
  test: "test",
};

const MIN_JWT_SECRET = 32;

export function applyEnvAliases(env) {
  for (const [from, to] of Object.entries(ENV_ALIASES)) {
    const source = env[from]?.trim();
    const target = env[to]?.trim();
    if (source && !target) {
      env[to] = source;
    }
  }

  const nodeEnv = env.NODE_ENV?.trim();
  if (nodeEnv) {
    const mapped = NODE_ENV_ALIASES[nodeEnv.toLowerCase()];
    if (mapped) env.NODE_ENV = mapped;
  }
}

export function validateRailwayEnv(env) {
  applyEnvAliases(env);

  const lines = [];

  if (!env.DATABASE_URL?.trim()) {
    lines.push(
      "- DATABASE_URL: obligatoria. En Railway vincule la variable del plugin MySQL o use ${{MySQL.DATABASE_URL}}.",
    );
  }

  const jwt = env.JWT_SECRET?.trim() ?? "";
  if (!jwt) {
    lines.push(
      "- JWT_SECRET: obligatoria (no use JWT_SECRETO). Ejemplo: blenkir_tesis_2026_jwt_secret_min_32_chars",
    );
  } else if (jwt.length < MIN_JWT_SECRET) {
    lines.push(
      `- JWT_SECRET: debe tener al menos ${MIN_JWT_SECRET} caracteres (actual: ${jwt.length}).`,
    );
  }

  const nodeEnv = env.NODE_ENV?.trim();
  if (nodeEnv && !["development", "production", "test"].includes(nodeEnv)) {
    lines.push(`- NODE_ENV: use "production" (no "producción"). Valor actual: "${nodeEnv}".`);
  }

  if (lines.length === 0) return null;

  return [
    "[railway-start] Variables de entorno inválidas en Railway:",
    ...lines,
    "",
    "Variables correctas:",
    "  DATABASE_URL, JWT_SECRET (≥32), NODE_ENV=production, CORS_ORIGIN, HOST=0.0.0.0",
  ].join("\n");
}
