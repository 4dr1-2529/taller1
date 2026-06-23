# Changelog

Todos los cambios notables del proyecto **Tesis Dashboard v2.0** (I.E.P. Blenkir Huancayo).

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [2.0.2] — 2026-06-04

### Añadido

- **README principal** ampliado: stack, estructura monorepo, scripts, variables de entorno y URLs de producción
- **Cuentas determinísticas:** emails estables (`mateo.quispe0001@…`, `pro50000001@…`) sincronizados con BD
- **Exportación verificada:** endpoint `GET /admin/cuentas-acceso` + scripts `export:accounts:web` y `verify-production-accounts`
- **8 tutores** exclusivos 1°–2° + **15 docentes** polidocencia 3°–6° (23 total)
- Scripts raíz: `db:repair:all`, `export:accounts:web`
- CSV canónicos en `docs/cuentas-demo/` (660 estudiantes + 23 profesores)

### Corregido

- **Notas NaN** en vista Director: filtro por bimestre, coerción numérica en API y frontend
- **Notas I–II** completas para todos los estudiantes/cursos; bimestres III–IV vacíos
- **Plantilla docente:** asignaciones tutor/polidocencia y cobertura de cursos
- Documentación y Postman alineados con credenciales actuales (eliminados emails legacy)
- Lint frontend: dependencias de hooks y imports sin usar

---

## [2.0.1] — 2026-06-04

### Despliegue producción

- Frontend en **Vercel**: https://taller1-frontend.vercel.app
- Backend API en **Railway**: https://taller1-production.up.railway.app/api/v1
- MySQL gestionado en Railway (plugin MySQL + `DATABASE_URL` vinculada al backend)
- Guía completa: [docs/DEPLOY.md](docs/DEPLOY.md)

### Corregido

- **P3009 (Prisma migrate):** migración inicial sin BOM UTF-8; defaults `updated_at` compatibles con MySQL; recuperación automática en `railway-start.mjs` y script `db:railway:fix-p3009`
- **JWT_SECRET:** validación mínimo 32 caracteres en arranque Railway; alias de variables en español normalizados (`env-aliases.mjs`)
- **CORS:** soporte para `*` y subdominios `*.vercel.app` además de orígenes explícitos
- **Login 500:** hash SHA-256 del refresh token antes de guardar en `sesion.token_hash` (columna `VARCHAR(128)`)
- **Race condition auth (frontend):** las APIs ya no se llaman antes de confirmar el rol del usuario
  - Nuevo hook `useAuthReady`
  - Guardias en `useAcademicStructure`, `useAcademicData`, `useProfessorStructure`
  - Guardias en dashboards y vistas de estudiante/profesor
  - Evita 401 al entrar como Director, Profesor o Estudiante sin necesidad de F5

### Añadido

- Scripts Railway: `start:prod`, `db:railway:fix-p3009`, `railway.toml`
- Configuración Vercel: `vercel.json` con build del monorepo (`@tesis/shared` + frontend)
- Documentación de despliegue ampliada en README y `docs/DEPLOY.md`

---

## [2.0.0] — 2026-05 / 2026-06

### Añadido

- **3 roles:** Director (`admin`), Profesor (`docente`), Estudiante (`estudiante`)
- APIs dedicadas: `/profesor/*`, `/estudiante/*`
- **Matrículas institucionales** (estudiante + año lectivo + sección)
- **Mensajería académica** (comunicados, avisos de curso, mensajes directos)
- Schema Prisma **Blenkir v3** (~51 tablas)
- Seed demo: 660 estudiantes, 23 profesores, 22 secciones, predicciones y alertas
- Dashboard por rol con KPIs, gráficos Recharts y predicción ensemble ML
- Tests de roles, alcance docente/estudiante y formato de respuesta API
- Preparación SonarQube (bugs, accesibilidad, seguridad)

### Eliminado

- Roles legacy: tutor, psicólogo, apoderado
- Endpoints y vistas de seguimiento psicológico / chat genérico

### Seguridad

- JWT + refresh tokens con invalidación de sesión
- RBAC en middleware `authorize()`
- `rejectClientStudentId()` en API estudiante
- Rate limiting, Helmet, sanitización XSS, protección brute-force
- Eliminación de bcrypt hardcodeado en seeds SQL

---

## Credenciales demo (post-seed)

Contraseña para todos: **`mbappe29`**

| Rol | Email |
|-----|-------|
| Director | `director@blenkir.edu.pe` |
| Profesor tutor | `pro50000001@blenkir.edu.pe` |
| Estudiante | `mateo.quispe0001@blenkir.edu.pe` |

Listado completo: `docs/cuentas-demo/estudiantes.csv` y `profesores.csv`.

Ejecutar una vez en BD vacía:

```bash
npm run db:seed --workspace=backend
npm run db:seed:demo --workspace=backend
```
