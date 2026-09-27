# Base de datos Blenkir v3 — **LEGACY / NO EJECUTAR PARA BLENKIR V6**

> ⛔ **LEGACY. NO EJECUTAR PARA BLENKIR V6.**
>
> Esta carpeta es **historia de la tesis**: documenta el diseño de **51 tablas** y la población de
> **660 estudiantes / 23 profesores** de las etapas anteriores. Se conserva íntegra con fines
> documentales.
>
> - **No es** el flujo actual. El sistema técnico vigente es **BLENKIR V6**:
>   esquema Prisma (`backend/prisma/schema.prisma` → **57 modelos Prisma** = 54 activos + 3
>   `@@ignore`) y población operativa/demo de **275 usuarios (1 director · 24 profesores ·
>   250 estudiantes)**.
> - `npm run db:reset:full`, `npm run db:seed:demo` y `npm run db:push` sobre la BD de
>   producción: **PROHIBIDOS**. `db:seed:demo` y `db:reset:*` además están deshabilitados
>   (`backend/scripts/legacy-population-disabled.mjs`, `exit 1` sin tocar la BD).
> - El seed vigente **no** crea 9 estudiantes demo: la población demo antigua fue reemplazada por
>   la semilla operativa descrita en [`docs/cuentas-demo/README.md`](../../docs/cuentas-demo/README.md).
> - Workflow seguro de BD local/aislada: [`database/mysql/README.md`](../mysql/README.md).

Referencia histórica SQL para **I.E.P. Blenkir — Primaria**. La fuente vigente del esquema es
`backend/prisma/schema.prisma`.

## Flujo vigente (referencia)

Para desarrollo use Prisma sobre una **BD local/aislada**:

```powershell
npm run db:generate
npm run db:migrate      # o db:push solo en una BD local recién creada
npm run db:seed         # estructura + RBAC (db:seed:structure)
```

Credenciales de acceso: **no se versionan**; cada rol usa su variable de entorno
(`DIRECTOR_INITIAL_PASSWORD`, `TEACHER_INITIAL_PASSWORD`, `STUDENT_INITIAL_PASSWORD`).
Ver [`docs/cuentas-demo/README.md`](../../docs/cuentas-demo/README.md).

## Archivos SQL legacy (tesis / 51 tablas) — HISTORIA

| Archivo | Descripción |
|---------|-------------|
| [DER-BLENKIR.md](./DER-BLENKIR.md) | 51 tablas, relaciones, diagrama ER (**histórico**) |
| [01-schema.sql](./01-schema.sql) | DDL completo (MySQL 8) (**histórico**) |
| [02-seed-estructura.sql](./02-seed-estructura.sql) | Institución, roles, grados, secciones, cursos (**histórico**) |
| [generate-poblacion.mjs](./generate-poblacion.mjs) | Generador de 660 estudiantes (**histórico**) |
| `03-seed-poblacion.sql` | **Generado localmente** (no versionado; sin credenciales embebidas) |

### Restauración histórica (arqueología de datos — NO es el flujo V6)

> ⛔ Solo para reproducir el entorno antiguo de la tesis. **No** representa el estado del sistema
> ni la población actual.

Los scripts SQL **no contienen hashes**. Defina `@demo_bcrypt_hash` antes de importar:

```powershell
cd tesis-dashboard

# 1. Esquema
mysql -u root < database\blenkir-v3\01-schema.sql

# 2. Hash bcrypt (requiere DEMO_PASSWORD, valor local no versionado)
$env:DEMO_PASSWORD = "<valor-local-no-versionado>"
$hash = npm run db:demo-bcrypt --silent

# 3. Estructura + usuarios director/profesores
mysql -u root tesis_blenkir -e "SET @demo_bcrypt_hash='$hash'; SOURCE database/blenkir-v3/02-seed-estructura.sql"

# 4. Generar e importar los 660 estudiantes históricos
node database\blenkir-v3\generate-poblacion.mjs > database\blenkir-v3\03-seed-poblacion.sql
mysql -u root tesis_blenkir -e "SET @demo_bcrypt_hash='$hash'; SOURCE database/blenkir-v3/03-seed-poblacion.sql"
```

## Verificación rápida (entorno histórico)

```sql
USE tesis_blenkir;
SELECT COUNT(*) AS secciones FROM seccion;      -- 22 (histórico)
SELECT COUNT(*) AS estudiantes FROM estudiante; -- 660 (histórico; NO es la población vigente)
```

## Relación con Prisma

El backend (`backend/prisma/`) usa un modelo simplificado compatible. Esta carpeta es referencia
histórica de la tesis y de una migración futura a 51 tablas normalizadas que **no** está en curso.
