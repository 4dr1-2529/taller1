# Despliegue 2026-v2

No se ha desplegado ni reseteado producción durante esta refactorización.

1. Revisar el diff y respaldar MySQL. Ensayar las migraciones sobre una copia aislada antes de Railway.
2. Instalar dependencias y compilar shared/backend. Ejecutar Prisma validate/generate y migrate deploy. Nunca migrate reset en producción.
3. Railway inicia generate → migrate deploy → API; no ejecuta seed demo, reparación de poblaciones ni reset. Las migraciones fallidas detienen el proceso.
4. Configurar DATABASE_URL, JWT_SECRET, CORS_ORIGIN y ML_SERVICE_URL mediante variables del entorno, sin secretos versionados.
5. Desplegar ML con artefactos revisados para siete variables, classes_ [0,1,2], metadata y dependencias fijadas. Hasta disponer de modelo compatible, predicción devuelve 503; no se reutilizan modelos legacy.
6. En Vercel conservar NEXT_PUBLIC_API_URL apuntando a la API Railway (incluido /api/v1). Recompilar el frontend después de cambiar esta variable.
7. Verificar login/refresh, scopes, registro transaccional, materiales, mensajes y avisos con cuentas autorizadas.

Migraciones nuevas: 20260919000000_blenkir_2026 (correlativo, DNI profesor, materiales, actividades, eventos e índices); 20260919010000_prediction_contract (separa estado administrativo y añade trazabilidad de predicciones). Las tablas LMS históricas se conservan ignoradas por Prisma, no se borran datos históricos. El estado administrativo antiguo en_riesgo se normaliza a activo; sus predicciones no cambian. Las migraciones históricas ya aplicadas no se reescriben.

## Limpieza demo opcional

db:reset:demo invoca reset-demo-safe.ts. Requiere ALLOW_DEMO_RESET=true, DATABASE_URL explícita y DEMO_RESET_MANIFEST con userIds y synthetic:true. Por defecto solo muestra el alcance; DEMO_RESET_EXECUTE=true habilita la limpieza. Rechaza NODE_ENV=production y profesores con alumnos fuera del manifiesto. Debe usarse únicamente en una copia de pruebas. Mantiene institución, roles, catálogos, periodos, correlativos, identidades desactivadas, mensajes y auditoría. No se ejecutó este reset durante la refactorización.

No ejecutar scripts de población legacy. El Data Seed definitivo **V5** (275 usuarios) ya está importado en producción: no se ejecutan `db:seed`, `db:seed:demo`, `db:push`, migraciones de reset ni ninguna limpieza sobre esa base. Revisar las cuentas históricas antes de habilitarlas: la migración histórica de contraseñas comunes no constituye una política válida para cuentas nuevas.
