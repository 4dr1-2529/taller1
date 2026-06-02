# Base de datos Blenkir v3

Rediseño completo para **I.E.P. Blenkir — Primaria** (660 estudiantes, 22 secciones, 16 cursos).

## Archivos

| Archivo | Descripción |
|---------|-------------|
| [DER-BLENKIR.md](./DER-BLENKIR.md) | Documentación: 51 tablas, relaciones, justificación, diagrama ER |
| [01-schema.sql](./01-schema.sql) | DDL completo (MySQL 8) |
| [02-seed-estructura.sql](./02-seed-estructura.sql) | Institución, roles, grados, secciones, cursos, 15 profesores, director |
| [generate-poblacion.mjs](./generate-poblacion.mjs) | Generador de 660 estudiantes |
| [03-seed-poblacion.sql](./03-seed-poblacion.sql) | Población generada (ejecutar tras generar) |

## Instalación

```powershell
cd "c:\Users\HP\Music\proyecto de taller\tesis-dashboard"

# 1. Esquema
mysql -u root < database\blenkir-v3\01-schema.sql

# 2. Estructura
mysql -u root tesis_blenkir < database\blenkir-v3\02-seed-estructura.sql

# 3. Generar e importar 660 estudiantes
node database\blenkir-v3\generate-poblacion.mjs > database\blenkir-v3\03-seed-poblacion.sql
mysql -u root tesis_blenkir < database\blenkir-v3\03-seed-poblacion.sql
```

## Verificación rápida

```sql
USE tesis_blenkir;
SELECT COUNT(*) AS secciones FROM seccion;           -- 22
SELECT COUNT(*) AS cursos FROM curso_catalogo;       -- 16
SELECT COUNT(*) AS profesores FROM profesor;         -- 15
SELECT COUNT(*) AS estudiantes FROM estudiante;      -- 660
SELECT COUNT(*) AS ofertas FROM curso_oferta;        -- ~308 (22 sec × ~14 cursos/grado prom.)
```

## Credenciales

Password: `Tesis2026!`

- Director: `director@blenkir.edu.pe`
- Profesores: `profesor1@blenkir.edu.pe` … `profesor15@blenkir.edu.pe`
- Estudiantes: `estudiante0001@blenkir.edu.pe` … `estudiante0660@blenkir.edu.pe`

## Relación con Prisma

El backend actual (`backend/prisma/schema.prisma`) usa un modelo simplificado compatible en concepto. Esta carpeta es la **fuente de verdad** para la tesis y migración futura a 51 tablas normalizadas.
