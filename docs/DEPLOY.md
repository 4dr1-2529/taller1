# Despliegue 2026-v2

No se ha desplegado ni reseteado producción durante esta refactorización.

1. Revisar el diff y respaldar MySQL. Ensayar las migraciones sobre una copia aislada antes de Railway.
2. Instalar dependencias y compilar shared/backend. Ejecutar Prisma validate/generate y migrate deploy. Nunca migrate reset en producción.
3. Railway inicia generate → migrate deploy → API; no ejecuta seed demo, reparación de poblaciones ni reset. Las migraciones fallidas detienen el proceso.
4. Configurar DATABASE_URL, JWT_SECRET, CORS_ORIGIN y ML_SERVICE_URL mediante variables del entorno, sin secretos versionados.
5. Desplegar ML como servicio independiente (ver sección siguiente). Hasta que `ML_SERVICE_URL` apunte a un servicio con `/health modelLoaded=true`, predicción devuelve 503; no se reutilizan modelos legacy ni se genera riesgo ficticio.
6. En Vercel conservar NEXT_PUBLIC_API_URL apuntando a la API Railway (incluido /api/v1). Recompilar el frontend después de cambiar esta variable.
7. Verificar login/refresh, scopes, registro transaccional, materiales, mensajes y avisos con cuentas autorizadas.

Migraciones nuevas: 20260919000000_blenkir_2026 (correlativo, DNI profesor, materiales, actividades, eventos e índices); 20260919010000_prediction_contract (separa estado administrativo y añade trazabilidad de predicciones). Las tablas LMS históricas se conservan ignoradas por Prisma, no se borran datos históricos. El estado administrativo antiguo en_riesgo se normaliza a activo; sus predicciones no cambian. Las migraciones históricas ya aplicadas no se reescriben.

## Servicio ML V6 (servicio independiente)

El modelo V6 se sirve con FastAPI y se despliega como servicio aparte del backend:

- Imagen: `machine-learning/Dockerfile`. Copia `app/`, `utils/`, `models/` y **`artifacts/synthetic/`** (sin esta última capa `/health` responde `modelLoaded=false` y `/predict` devuelve 503). `.dockerignore` no excluye `artifacts/`, `*.joblib`, `metadata.json` ni `metrics.json`.
- Railway: nuevo servicio con **Root Directory = `machine-learning`** (Railway detecta el Dockerfile). Puerto: `$PORT` (por defecto 5000).
- Variable: `ML_DATA_MODE=synthetic_scientific` (es además el valor por defecto del código).
- Exposición requerida: `GET /health`, `GET /metrics`, `POST /predict`.
- `ML_CORS_ORIGINS` (opcional): orígenes permitidos para llamadas desde navegador; el backend de Railway llama por servidor, así que solo aplica a pruebas directas desde el navegador.
- Verificación tras desplegar: `/health` debe reportar `modelLoaded=true`, `model=stacking`, `dataMode=synthetic_scientific`, `n_features=7`, `experimental=true` con `modelVersion=BLENKIR_V6_BIN_20260924` y `datasetVersion=BLENKIR_V6_SYNTH_20260924` (salen de `artifacts/synthetic/metadata.json`, no están escritos en el código).

Backend → ML: la variable **`ML_SERVICE_URL` del servicio backend en Railway debe ser el dominio público real** del servicio ML anterior. El default `http://localhost:5000` es únicamente para desarrollo local; sin una URL pública real el endpoint `/predict` responde `503` de forma controlada (nunca convierte un fallo del ML en riesgo Bajo ni escribe predicciones ficticias).

Estado de esta verificación (**2026-09-26**, sin redespliegue ni cambio de variables):

- **El servicio ML sí está desplegado en Railway**: `https://ml-production-2a96.up.railway.app` responde
  `GET /health` → HTTP 200 con `modelLoaded=true`, `model=stacking`, `n_features=7`,
  `dataMode=synthetic_scientific`, `experimental=true`, `modelVersion=BLENKIR_V6_BIN_20260924` y
  `datasetVersion=BLENKIR_V6_SYNTH_20260924`; `GET /metrics` responde HTTP 200. El historial de GitHub
  confirma `TALLER1 - ml = success`.
- **El backend también está desplegado** (`/health` y `/api/v1/health` → HTTP 200) y el frontend publica en Vercel.
- **`ML_SERVICE_URL` no puede leerse desde este entorno**: su valor vive en las variables de entorno de Railway
  (dato externo al repositorio y no debe versionarse). Por eso la conectividad efectiva Backend → ML
  (`GET /api/v1/ml/metrics`, que exige JWT de admin/docente) queda registrada como
  **NO VERIFICABLE DESDE EL ENTORNO**. La verificación indirecta disponible es que el servicio ML responda
  V6 correctamente y que su dominio público sea el documentado arriba.
- Si `ML_SERVICE_URL` no apuntara a ese dominio, `/predict` responde `503` controlado (nunca un riesgo
  Bajo ficticio).

## Limpieza demo (deshabilitada)

Los scripts de limpieza y población legacy quedaron **deshabilitados** en el código: `db:reset:demo`,
`db:reset:full`, `db:reset:academic`, `db:seed:demo` y `db:seed:prod` ejecutan todos
`backend/scripts/legacy-population-disabled.mjs`, que aborta con
`LEGACY: población y reparaciones antiguas deshabilitadas` (exit 1) **sin tocar la base de datos**.
Comportamiento histórico del mecanismo (archivo `backend/scripts/reset-demo-safe.ts`, ya no invocado):
requería `ALLOW_DEMO_RESET=true`, `DATABASE_URL` explícita y `DEMO_RESET_MANIFEST`, rechazaba
`NODE_ENV=production` y solo operaba sobre una copia de pruebas. No se ejecutó ninguna limpieza en esta auditoría.

No ejecutar scripts de población legacy. El Data Seed definitivo **V5** (275 usuarios) ya está importado en producción: no se ejecutan `db:seed`, `db:seed:demo`, `db:push`, migraciones de reset ni ninguna limpieza sobre esa base. Revisar las cuentas históricas antes de habilitarlas: la migración histórica de contraseñas comunes no constituye una política válida para cuentas nuevas.
