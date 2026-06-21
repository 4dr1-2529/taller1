# Tesis Dashboard v2.0

> **Modelo predictivo basado en ensemble learning para la identificación del riesgo de deserción estudiantil** — fusión de datos académicos y comportamiento en LMS.

**Repositorio:** [github.com/4dr1-2529/taller1](https://github.com/4dr1-2529/taller1) (código en `tesis-dashboard/`)  
**Institución:** I.E.P. Blenkir Huancayo · Perú  
**Tipo:** Software SaaS educativo con IA explicable y persistencia real

### Producción (Vercel + Railway)

| Servicio | URL |
|----------|-----|
| **Frontend** | https://taller1-frontend.vercel.app |
| **API** | https://taller1-production.up.railway.app/api/v1 |
| **Health** | https://taller1-production.up.railway.app/health |

Guía de despliegue: **[docs/DEPLOY.md](docs/DEPLOY.md)** · Cambios recientes: **[CHANGELOG.md](CHANGELOG.md)**

---

## Arquitectura

| Servicio | Puerto | Tecnología |
|----------|--------|------------|
| Frontend | 3029 | Next.js 16, React 19, Tailwind 4, Recharts |
| Backend API | 4000 | Express, Prisma, MySQL (XAMPP), JWT |
| ML Service | 5000 | FastAPI, scikit-learn, XGBoost, Stacking |

```
tesis-dashboard/
├── frontend/               # Next.js (App Router)
├── backend/                # API REST + Prisma ORM
│   ├── src/                # controllers, routes, services, validators
│   └── prisma/             # schema, seed, migrate-roles.sql
├── machine-learning/       # FastAPI + entrenamiento ensemble
│   ├── app/                # API inferencia
│   ├── models/             # Artefactos .joblib + metrics.json
│   ├── utils/              # Validadores de entrada
│   └── train.py
├── database/mysql/         # Guía XAMPP
└── docs/                   # API, roles, pruebas, Postman, SonarQube, DEPLOY
```

### Entornos

| Entorno | Frontend | Backend | Base de datos |
|---------|----------|---------|---------------|
| **Local** | `:3029` | `:4000/api/v1` | MySQL XAMPP `:3306` |
| **Producción** | Vercel | Railway | MySQL Railway |

## Inicio rápido

### 1. Prerrequisitos

- Node.js 20+
- **XAMPP** con MySQL iniciado (puerto 3306), o MySQL 8+
- Python 3.11+

### 2. Dependencias

```bash
npm install
cd backend && npm install && cd ..
pip install -r machine-learning/requirements.txt
```

### 3. Base de datos

```bash
# 1. Inicie MySQL en XAMPP
# 2. (Opcional) crear BD:
powershell -File scripts/setup-mysql-xampp.ps1

cp backend/.env.example backend/.env
# Edite DATABASE_URL, JWT_SECRET, etc.

npm run db:push
npm run db:seed          # estructura académica + permisos
npm run db:seed:demo     # 50 estudiantes, 5 profesores, predicciones, alertas
```

**BD existente con roles antiguos** (tutor, psicólogo, apoderado): ejecute antes de `db:push`:

```bash
cd backend
npx prisma db execute --file prisma/migrate-roles.sql
npx prisma db push --accept-data-loss
npx prisma generate
```

Ver [backend/prisma/migrations/README-REFACTOR.md](backend/prisma/migrations/README-REFACTOR.md).

**Administrador manual** (opcional, variables en `backend/.env`):

```bash
npm run db:bootstrap
```

### 4. Entrenar modelos IA

```bash
npm run ml:train
```

### 5. Ejecutar

```bash
npm run dev
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3029 |
| API | http://localhost:4000/api/v1 |
| ML Docs | http://localhost:5000/docs |

Si aparece `EADDRINUSE` en 3029/4000/5000, cierre instancias previas o termine los procesos que usan esos puertos.

### MySQL no conecta

Si el login devuelve **500** con `Can't reach database server at localhost:3306`:

1. Abra **XAMPP Control Panel** e inicie **MySQL**, o ejecute `C:\xampp\mysql_start.bat`
2. Verifique `DATABASE_URL` en `backend/.env`
3. Ejecute `npm run db:push` y `npm run db:seed:demo` si la BD está vacía


### Credenciales demo (`db:seed:demo`)

Contraseña para todos: **`Tesis2026!`**

| Rol (UI) | Email | Rol sistema |
|----------|-------|-------------|
| Director | `director@blenkir.edu.pe` | `admin` |
| Profesor | `profesor1@blenkir.edu.pe` | `docente` |
| Estudiante | `estudiante0001@blenkir.edu.pe` | `estudiante` |

Tras `db:seed:demo`: **660 estudiantes** (`estudiante0001` … `estudiante0660`), **15 profesores**, **22 secciones**.

Legacy: `director@iep-huancayo.edu.pe`, `admin@iep-huancayo.edu.pe`

---

## Funcionalidades

### Core
- Dashboard analítico por rol (KPIs, gráficos Recharts)
- Predicción de riesgo (bajo / medio / alto) con interpretabilidad
- Ensemble ML: Random Forest, XGBoost/HistGradientBoosting, Stacking
- Alertas tempranas (`nueva`, `en_seguimiento`, `resuelta`) con factores y recomendación
- **Mensajería académica** (comunicados globales, avisos de curso, mensajes directos)

### Seguridad
- JWT + refresh tokens (hash SHA-256 en sesión)
- RBAC con **3 roles**: `admin`, `docente`, `estudiante`
- Brute-force protection, XSS sanitization, rate limiting, Helmet
- Auditoría (AuditLog) y sesiones con invalidación
- CORS configurable (orígenes explícitos, `*` o `*.vercel.app`)
- Validación `JWT_SECRET` ≥ 32 caracteres en producción

### Frontend (auth por rol)
- Hook `useAuthReady` — evita llamadas API antes de confirmar el rol (sin 401 al login)
- Servicios separados: `directorService`, `profesorService`, `estudianteService`

### UI/UX
- Modo claro / oscuro, responsive, skeletons, toasts (Sonner)
- Validaciones en formularios (DNI, teléfono, notas, rangos académicos)

---

## Roles y permisos

| Rol sistema | Etiqueta UI | Alcance |
|-------------|-------------|---------|
| `admin` | **Director** | Gestión total, comunicados globales, predicciones y alertas |
| `docente` | **Profesor** | Sus cursos y estudiantes; notas, asistencia, LMS, predicción, mensajes |
| `estudiante` | **Estudiante** | Dashboard personal, `/estudiante/*`, mensajería recibida |

**Eliminados en v2.0:** tutor, psicólogo, apoderado, seguimiento psicológico, chat genérico.

Detalle: [docs/roles.md](docs/roles.md) · [docs/roles-permisos.md](docs/roles-permisos.md)

---

## Respuesta API estándar

**Éxito (200/201):**

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

**Error (4xx/5xx):**

```json
{
  "success": false,
  "message": "Error descriptivo",
  "errors": []
}
```

El frontend (`frontend/src/services/api.ts`) desenvuelve automáticamente `data`.

---

## API (resumen)

### Auth
- `POST /auth/login` · `POST /auth/refresh` · `GET /auth/me` · `POST /auth/change-password`

### Académico (Director / Profesor)
- `GET/POST /students` — solo **admin** crea/elimina; **docente** listado restringido
- `GET/POST /teachers`, `/courses`, `/matriculas`, `/grades`, `/attendance` — según rol

### Profesor (`/profesor/*`)
- Dashboard, grados, secciones, cursos, estudiantes, notas, asistencia, LMS, predicciones, alertas

### Estudiante (`/estudiante/*`)
- `GET /estudiante/perfil`, `/dashboard`, `/notas`, `/asistencia`, `/lms`, `/prediccion`, `/alertas`, `/mensajes`
- `POST /estudiante/prediccion` — actualizar predicción propia (ID desde token)

### Predicción e IA (Director / Profesor)
- `POST /predict` — riesgo + historial + alerta si medio/alto
- `GET /predictions` · `GET /dashboard/kpis` · `GET /alerts` · `PATCH /alerts/:id`
- `GET /ml/metrics`

### Mensajería académica
- `GET /messages/rooms` · `GET /messages/:roomId` · `POST /messages` · `PATCH /messages/:roomId/read`

### ML Service (`:5000`)
- `POST /predict` · `GET /metrics` · `GET /health`

Documentación completa: [docs/API.md](docs/API.md) · Colección Postman: [docs/postman/](docs/postman/)

---

## Machine Learning

### Modelos
- **Random Forest** · **XGBoost** (o HistGradientBoosting) · **Stacking**
- Mejor modelo por **F1-score** → `models/best_model.joblib`

### Variables (10 features)
`promedio_general`, `cursos_desaprobados`, `asistencia_general`, `frecuencia_acceso_lms`, `tiempo_plataforma`, `tareas_ratio`, `participacion_actividades`, `uso_foros`, `disminucion_actividad`, `estado` (activo / en_riesgo / retirado)

### Respuesta formato tesis

```json
{
  "probabilidad_abandono": 0.85,
  "score_predictivo": 85,
  "nivel_riesgo": "Alto",
  "factores_riesgo": [],
  "recomendacion": "…",
  "modelo_usado": "random_forest",
  "fecha_prediccion": "2026-06-02T12:00:00.000Z"
}
```

Alias en inglés (`score`, `level`, `factors`, …) para compatibilidad con el frontend.

```bash
npm run ml:train
npm run ml:test
npm run test:smoke    # requiere API :4000 y ML :5000 en ejecución
npm run test          # unit backend + ML (sin smoke)
```

Más: [docs/machine-learning.md](docs/machine-learning.md)

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend + API + ML |
| `npm run dev:web` / `dev:api` / `dev:ml` | Servicio individual |
| `npm run build` | Build producción |
| `npm run db:push` | Sincronizar schema Prisma |
| `npm run db:seed` | Estructura y permisos |
| `npm run db:seed:demo` | Datos demo (660 estudiantes, 15 profesores) |
| `npm run db:bootstrap` | Crear admin desde `.env` |
| `npm run db:studio` | Prisma Studio |
| `npm run ml:train` | Entrenar modelos |
| `npm run ml:test` | Tests Python ML |
| `npm run test` | Unitarios backend + ML |
| `npm run type-check` | TypeScript frontend + backend |
| `npm run test:backend` | Solo tests backend |
| `npm run test:smoke` | Smoke API + ML + login |
| `npm run db:railway:fix-p3009` | Recuperar migración fallida en Railway |
| `npm run start:prod` | Arranque producción (migrate + API) |
| `npm run db:reset:full` | Reset completo BD + reseed |
| `npm run lint` | ESLint frontend |

---

## Despliegue producción

Despliegue actual: **Vercel** (frontend) + **Railway** (backend + MySQL).

```env
# Vercel
NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1

# Railway (backend)
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=blenkir_tesis_2026_jwt_secret_min_32_chars   # mín. 32 chars
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://taller1-frontend.vercel.app
```

Pasos completos, seed, troubleshooting P3009/CORS/login: **[docs/DEPLOY.md](docs/DEPLOY.md)**

---

## Variables de entorno

### Frontend (`frontend/.env.local`)

```env
# Local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Producción (Vercel)
# NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1
```

### Backend (`backend/.env`)

```env
DATABASE_URL="mysql://root@localhost:3306/tesis_dashboard"
JWT_SECRET="blenkir_tesis_2026_jwt_secret_min_32_chars"
JWT_EXPIRES_IN="8h"
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN="http://localhost:3029"
ML_SERVICE_URL="http://localhost:5000"
```

Copie desde `backend/.env.example` y `frontend/.env.example`.

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [CHANGELOG.md](CHANGELOG.md) | Historial de cambios (v2.0.1 despliegue + fixes) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel + Railway + MySQL, variables, seed, troubleshooting |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Capas y flujo de datos |
| [docs/API.md](docs/API.md) | Endpoints REST |
| [docs/roles.md](docs/roles.md) | Matriz de permisos |
| [docs/roles-permisos.md](docs/roles-permisos.md) | Roles Director / Profesor / Estudiante |
| [docs/pruebas.md](docs/pruebas.md) | Comandos y casos de prueba |
| [docs/validaciones.md](docs/validaciones.md) | Reglas de formularios |
| [docs/machine-learning.md](docs/machine-learning.md) | Entrenamiento e inferencia |
| [docs/pruebas-funcionales.md](docs/pruebas-funcionales.md) | Casos de prueba |
| [docs/pruebas-no-funcionales.md](docs/pruebas-no-funcionales.md) | Seguridad y rendimiento |
| [docs/postman.md](docs/postman.md) | Colección Postman |
| [docs/sonarqube.md](docs/sonarqube.md) | Análisis estático SonarQube |

### SonarQube (preparación)

```bash
# Desde tesis-dashboard/ con SonarScanner instalado
sonar-scanner -Dproject.settings=sonar-project.properties
```

Exclusiones: `node_modules`, `dist`, `.next`, `coverage`, `venv`, `__pycache__`, `.env`, modelos `.joblib`.

Checklist antes del análisis: ver [docs/sonarqube.md](docs/sonarqube.md).

| Documento BD | Contenido |
|--------------|-----------|
| [database/blenkir-v3/DER-BLENKIR.md](database/blenkir-v3/DER-BLENKIR.md) | Rediseño BD v3 — 51 tablas Primaria Blenkir |
| [database/blenkir-v3/README.md](database/blenkir-v3/README.md) | Scripts SQL e instalación |
| [database/mysql/README.md](database/mysql/README.md) | XAMPP / MySQL |
| [backend/README.md](backend/README.md) | API, endpoints por rol, tests |
| [frontend/README.md](frontend/README.md) | Next.js, menú por rol, servicios |

---

## Tesis

Sistema desarrollado como proyecto universitario avanzado — software escalable tipo SaaS educativo con IA explicable y persistencia real.

**Título:** Modelo predictivo basado en técnicas de ensemble learning para la identificación del riesgo de deserción estudiantil mediante fusión de datos académicos y comportamiento en LMS.
