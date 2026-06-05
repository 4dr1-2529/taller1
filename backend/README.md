# Backend API (Express + Prisma)

API REST del sistema predictivo de deserción — **I.E.P. Blenkir Huancayo**.

## Requisitos

- Node.js 20+
- MySQL 8+ (XAMPP recomendado en puerto 3306)

## Configuración

```bash
cp .env.example .env
# Edite DATABASE_URL, JWT_SECRET, CORS_ORIGIN, ML_SERVICE_URL

npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run db:seed:demo   # datos demo (660 estudiantes, 15 profesores)
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
│   ├── estudiante.controller.ts   # Rol estudiante (solo propio)
│   └── profesor.controller.ts     # Rol docente (alcance por curso)
├── services/          # Lógica de negocio
├── routes/index.ts    # Rutas + authorize()
├── middleware/        # auth, errorHandler
├── utils/             # student-scope, teacher-scope, estudiante-scope
└── validators/        # Schemas Zod
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

- JWT + `authorize("admin" | "docente" | "estudiante")`
- `rejectClientStudentId()` — 403 si el frontend envía otro estudiante
- Endpoints globales (`/students`, `/grades`, etc.) restringidos a director/profesor

## Tests

```bash
npm run test
```

Incluye: `estudiante-scope.test.ts`, `teacher-scope.test.ts`, `validation-fields.test.ts`, `roles-estudiante.test.mjs`, `roles-profesor.test.mjs`.

Documentación completa: [../docs/API.md](../docs/API.md)
