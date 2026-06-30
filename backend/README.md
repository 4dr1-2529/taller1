# Backend API (Express + Prisma)

API REST del sistema predictivo de deserción — **I.E.P. Blenkir Huancayo**.

## Producción (Railway)

| Recurso | URL / valor |
|---------|-------------|
| API | https://taller1-production.up.railway.app/api/v1 |
| Health | https://taller1-production.up.railway.app/health |
| Start | `npm run start:prod` → `railway-start.mjs` |
| Config | `railway.toml` en raíz del monorepo |

Variables mínimas en Railway:

```env
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=blenkir_tesis_2026_jwt_secret_min_32_chars
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://taller1-frontend.vercel.app
DEMO_PASSWORD=<contraseña_demo_produccion>
```

Guía completa: [../docs/DEPLOY.md](../docs/DEPLOY.md)

## Requisitos

- Node.js 20+
- MySQL 8+ (XAMPP local `:3306` o Railway en producción)

## Configuración local

```bash
cp .env.example .env
# Edite DATABASE_URL, JWT_SECRET (≥32 chars), CORS_ORIGIN, ML_SERVICE_URL

npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run db:seed:demo   # 660 estudiantes, 23 profesores (requiere DEMO_PASSWORD)
```

## Desarrollo

```bash
npm run dev          # tsx watch — puerto 4000
npm run type-check
npm run test
npm run db:studio
```

Base URL: `http://localhost:4000/api/v1`

## Estructura

```
src/
├── controllers/     # Handlers HTTP por dominio
│   ├── auth.controller.ts         # Login, refresh (token hasheado en sesión)
│   ├── estudiante.controller.ts   # Rol estudiante (solo propio)
│   └── profesor.controller.ts     # Rol docente (alcance por curso)
├── services/          # Lógica de negocio
├── routes/index.ts    # Rutas + authorize()
├── middleware/        # auth, errorHandler
├── config/env.ts      # Validación JWT_SECRET, CORS
├── utils/             # student-scope, teacher-scope, tokens (SHA-256)
└── validators/        # Schemas Zod
scripts/
├── railway-start.mjs  # migrate deploy + auto-recovery P3009
├── env-aliases.mjs    # Alias español → inglés en Railway
└── p3009-recovery.mjs
```

## Endpoints por rol

### Director (`admin`)

Gestión global: `/students`, `/teachers`, `/courses`, `/matriculas`, `/grades`, `/attendance`, `/predictions`, `/alerts`, `/dashboard/kpis`, `/reports`.

### Profesor (`docente`)

Prefijo `/profesor/*` — solo cursos y secciones donde dicta:

- `GET /profesor/dashboard`, `/grados`, `/secciones`, `/cursos`, `/estudiantes`
- `GET|POST /profesor/notas`, `/asistencia`, `/lms`, `/predicciones`, `/alertas`

### Estudiante (`estudiante`)

Prefijo `/estudiante/*` — **studentId desde JWT**, sin aceptar ID del cliente:

| Método | Ruta |
|--------|------|
| GET | `/estudiante/perfil` |
| GET | `/estudiante/dashboard` |
| GET | `/estudiante/notas` |
| GET | `/estudiante/asistencia` |
| GET | `/estudiante/lms` |
| GET | `/estudiante/prediccion` |
| POST | `/estudiante/prediccion` |
| GET | `/estudiante/alertas` |
| GET | `/estudiante/mensajes` |

## Seguridad

- JWT + refresh tokens; refresh guardado como **hash SHA-256** (`sesion.token_hash`, max 128 chars)
- `JWT_SECRET` validado al arrancar (mínimo 32 caracteres en producción)
- CORS: orígenes explícitos, wildcard `*` o `*.vercel.app`
- `authorize("admin" | "docente" | "estudiante")`
- `rejectClientStudentId()` — 403 si el frontend envía otro estudiante
- Endpoints globales restringidos a director/profesor según ruta

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run start:prod` | Producción Railway (migrate + API) |
| `npm run db:railway:fix-p3009` | Recuperar migración fallida |
| `npm run db:seed` / `db:seed:demo` | Datos iniciales y demo |
| `npm run db:repair:all` | Reparar cuentas login + notas I–II sin reset total |
| `npm run export:accounts:web` | Exportar CSV verificados desde producción |
| `npm run db:reset:full` | Reset BD + reseed |

## Tests

```bash
npm run test
```

Incluye: `estudiante-scope.test.ts`, `teacher-scope.test.ts`, `validation-fields.test.ts`, `roles-estudiante.test.mjs`, `roles-profesor.test.mjs`.

Documentación completa: [../docs/API.md](../docs/API.md) · [../CHANGELOG.md](../CHANGELOG.md)
