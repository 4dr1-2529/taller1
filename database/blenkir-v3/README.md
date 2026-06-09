# Base de datos Blenkir v3

Rediseño completo para **I.E.P. Blenkir — Primaria** (660 estudiantes, 22 secciones, 16 cursos).

## Recomendado (Prisma)

Para desarrollo y demo del panel, use el seed del backend (sin hashes en SQL):

```powershell
cd tesis-dashboard
npm run db:reset:full
```

Credenciales demo: ver `README.md` del proyecto (`director@blenkir.edu.pe`, contraseña en documentación).

## Archivos SQL legacy (tesis / 51 tablas)

| Archivo | Descripción |
|---------|-------------|
| [DER-BLENKIR.md](./DER-BLENKIR.md) | 51 tablas, relaciones, diagrama ER |
| [01-schema.sql](./01-schema.sql) | DDL completo (MySQL 8) |
| [02-seed-estructura.sql](./02-seed-estructura.sql) | Institución, roles, grados, secciones, cursos |
| [generate-poblacion.mjs](./generate-poblacion.mjs) | Generador de 660 estudiantes |
| `03-seed-poblacion.sql` | **Generado localmente** (no versionado; sin credenciales embebidas) |

### Importación SQL con hash bcrypt en sesión

Los scripts SQL **no contienen hashes**. Defina `@demo_bcrypt_hash` antes de importar:

```powershell
cd tesis-dashboard

# 1. Esquema
mysql -u root < database\blenkir-v3\01-schema.sql

# 2. Hash bcrypt (requiere DEMO_PASSWORD)
$env:DEMO_PASSWORD = "Tesis2026!"
$hash = npm run db:demo-bcrypt --silent

# 3. Estructura + usuarios director/profesores
mysql -u root tesis_blenkir -e "SET @demo_bcrypt_hash='$hash'; SOURCE database/blenkir-v3/02-seed-estructura.sql"

# 4. Generar e importar 660 estudiantes
node database\blenkir-v3\generate-poblacion.mjs > database\blenkir-v3\03-seed-poblacion.sql
mysql -u root tesis_blenkir -e "SET @demo_bcrypt_hash='$hash'; SOURCE database/blenkir-v3/03-seed-poblacion.sql"
```

## Verificación rápida

```sql
USE tesis_blenkir;
SELECT COUNT(*) AS secciones FROM seccion;      -- 22
SELECT COUNT(*) AS estudiantes FROM estudiante; -- 660
```

## Relación con Prisma

El backend (`backend/prisma/`) usa un modelo simplificado compatible. Esta carpeta es referencia para la tesis y migración futura a 51 tablas normalizadas.
