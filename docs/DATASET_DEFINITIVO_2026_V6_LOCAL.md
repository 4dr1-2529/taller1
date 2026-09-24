# Dataset definitivo 2026 V6 — flujo local de importación

> **DATOS 100% SINTÉTICOS — USO EXCLUSIVO PARA PRUEBAS TECNOLÓGICAS, QA Y DEMOSTRACIÓN.**
> NO REPRESENTAN LA POBLACIÓN REAL DE LA I.E.P. BLENKIR NI CONSTITUYEN EVIDENCIA CIENTÍFICA.

Este documento sustituye a `DATASET_DEFINITIVO_2026_V5_LOCAL.md` (referencia histórica).
El lector y el importador ahora apuntan al Data Seed V6.

## Fuente inmutable

- Archivo: `backend/prisma/data/definitive-2026/BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx`.
- SHA256: `0bb7dd701ddc1dd9d14386d7b908ba7238e733e67b522e649da2cab74fcd0a0c`.
- `ImportConfig.dataset_id` = `BLENKIR_DATA_SEED_V6_250`.
- `ImportConfig.dataset_version` = `6.0-synthetic-scientific-twin`.
- Semilla `20260921`, corte `2026-09-21`, `bcrypt_cost=12`.
- SHA256 lógico generado: `9eb428bd0612a1f6c19040219bea939429dcaaf410b376a0211d13418fb09c50`.
- 25 hojas en el workbook; el importador lee 18 (`README`, `Resumen` + 16 con encabezado
  fijo) y las 7 `ML_V6_*` son documentación de referencia que no consume.
- La carpeta debe contener **un solo XLSX activo**: el legado `..._AUDITADO_V5.xlsx` queda
  excluido de la validación de unicidad. Cualquier otro XLSX ⇒ `ambiguous XLSX source directory`.
- Sin fórmulas, encabezados exactos, sin duplicados, sin referencias inválidas.

## Validación sin base de datos

```sh
npm run db:dataset:validate --workspace=backend   # solo lectura
npm run db:dataset:dry-run --workspace=backend    # genera tablas en memoria
```

Ambos leen el XLSX y generan las tablas **exclusivamente en memoria**: no cargan `.env`,
no instancian Prisma, no necesitan passwords y no escriben archivos poblacionales.
`DATABASE_CONNECTIONS=0`. Salida esperada: `DEFINITIVE_DATASET_VALID=true`,
`DATASET_ID=BLENKIR_DATA_SEED_V6_250`, `DATASET_VERSION=6.0-synthetic-scientific-twin`,
`LOGICAL_SHA256=9eb428bd…`, conteos idénticos a la tabla inferior.

## Reconstrucción local desde cero (ejecutada)

```sh
# 1) Reset + migraciones (5) con DATABASE_URL local exportada
npx prisma migrate reset --force          # desde backend/

# 2) Estructura sembrada (0 usuarios)
npm run db:seed:structure                 # 1 institución · 22 secciones · 90 cursos-grado
                                          # 3 roles · 9 permisos · 7 ml_feature_def ·
                                          # 3 correlativos en 0 · PRESEED_ZERO_OK

# 3) Importación real (flags + NODE_ENV=production en el proceso del script)
npm run db:dataset:import --workspace=backend -- --execute
```

Guardas de `--execute`: `ALLOW_DEFINITIVE_DATASET_IMPORT=true`,
`DEFINITIVE_DATASET_EXECUTE=true`, `ALLOW_PRODUCTION_DATASET_IMPORT=true`,
`NODE_ENV=production` **solo en ese proceso**, `DATABASE_URL` local y las tres
`*_INITIAL_PASSWORD` (≥12 caracteres) tomadas de `backend/.env` (gitignored). No hay
fallback hacia credenciales de MySQL, ni conexión con startup/postinstall/migraciones/deploy.

Antes de insertar se comprueba `PRESEED_ZERO` (cero población, actividad, ML, legacy),
estructura, RBAC, calendario, 7 features y correlativos. La carga usa transacción
Serializada, bloqueo del año lectivo, inserciones por lotes y postchecks antes del commit.
Una segunda ejecución no cumple `PRESEED_ZERO` y aborta. Nunca hay cleanup, reset, DROP ni
TRUNCATE. Salida: `MODE=EXECUTE`, `DEFINITIVE_DATASET_IMPORTED=true`.

**Discrepancia conocida:** `db:reset:full`, `db:seed:demo`, `db:reseed`, `db:reset:demo`,
`db:legacy-users` y `db:prod` apuntan a `scripts/legacy-population-disabled.mjs` y terminan
con el error «LEGACY: población y reparaciones antiguas deshabilitadas». El equivalente real
es `prisma migrate reset --force` + `npm run db:seed:structure`.

## Conteos verificados en la BD local

| Entidad | Verificado |
| --- | ---: |
| Usuario (1 admin, 24 docentes, 250 estudiantes) | **275** |
| Estudiante (activa / retirada / trasladada) | **250** (225 / 15 / 10) |
| Matrícula | **250** |
| Inscripción a curso (activa / retirada) | **3724** (3354 / 370) |
| Calificación (B1 / B2 / B3 / B4) | **10209** (3724 / 3724 / 2761 / 0) |
| Asistencia | **34950** |
| Histórico académico (B1 / B2 / B3) | 725 (250 / 250 / 225) |
| Resumen de asistencia | 750 |
| Eventos LMS | 4610 |
| Oferta / asignación | 328 / 328 |
| Recurso / actividad / progreso | 656 / 328 / 3354 |
| Predicciones, alertas y tablas ML al importar | **0 / 0 / 0** |
| Correlativos (estudiante / profesor / matrícula) | 250 / 24 / 250 → siguientes `EST-251`, `PROF-025`, `MAT-2026-251` |

Tras `npm run ml:v6:predict-all -- --write` (local) y la verificación en vivo:
251 predicciones, 189 alertas, 1757 snapshots de features, 204 factores,
**0 predicciones sin `decisionThreshold`**.

## Notas de alcance

- El XLSX V6 fue proporcionado por el usuario y no fue modificado.
- Las identidades (`dni_sintetico`, `telefono_sintetico`) son ficticias: no se validan contra
  RENIEC ni sirven para contacto real.
- `db:dataset:production-dry-run` (preflight de solo lectura contra un MySQL externo) sigue
  disponible y no acepta argumentos EXECUTE.
- Todo lo ejecutado fue **local**: sin conexión a Railway ni Vercel, sin commit, push, merge
  ni deploy. Un PASS local no equivale a un PASS productivo.
