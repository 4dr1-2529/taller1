# Pruebas caja blanca — API

Inventario **87 rutas** en `backend/src/routes/index.ts` — análisis por prefijo.

---

## Rutas públicas (sin JWT)

| Método | Ruta | Handler |
|--------|------|---------|
| GET | `/health` | `sendSuccess({ service: "tesis-api", version: "2.0.0" })` |
| POST | `/auth/login` | `login` |
| POST | `/auth/refresh` | `refresh` |

---

## Matriz authorize() por prefijo

| Prefijo | Roles permitidos | Tests |
|---------|------------------|-------|
| `/students` POST/PUT/DELETE | `admin` | TC-SEC-03, permissions |
| `/students` GET | `admin`, `docente` | teacher-scope |
| `/profesor/*` | `docente` | roles-profesor |
| `/estudiante/*` | `estudiante` | estudiante-scope |
| `/teacher-assignments` | `admin` | TC-CN-10 |
| `/admin/*` | `admin` | TC-BE-08 |
| `/predictions` | `admin`, `docente` | TC-INT-02 |
| `/attendance` DELETE | `admin` only | TC-SEC-07 |
| `/reports` POST | `admin`, `docente` | TC-CN-09 |
| `/reports` DELETE | `admin` only | TC-REP-04 |

---

## Condiciones de entrada (Zod)

| Schema | Campo crítico | Rama fail | Test |
|--------|---------------|-----------|------|
| `gradeSchema` | `nota` 0–20 | nota=25 | TC-CB-01 |
| `predictSchema` | `studentId` XOR metrics | `{}` | TC-CB-02 |
| `alertStatusSchema` | enum 3 valores | `cerrada` | TC-CB-03 |
| `createUserSchema` | role enum | `tutor` | TC-SEC-06 |

---

## Repositorio (Prisma)

Todas las rutas usan `prisma` desde `utils/prisma.ts` — 52 modelos en `schema.prisma`. Sin capa repository explícita; servicios encapsulan queries complejas (`dashboard-analytics.service.ts`).
