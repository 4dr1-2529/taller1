# Tesis Dashboard v2.0

> **Modelo predictivo basado en ensemble learning para la identificación del riesgo de deserción estudiantil** — fusión de datos académicos y comportamiento en LMS.

| | |
|---|---|
| **Institución** | I.E.P. Blenkir Huancayo · Perú |
| **Repositorio** | [github.com/4dr1-2529/taller1](https://github.com/4dr1-2529/taller1) |
| **Tipo** | SaaS educativo con IA explicable y persistencia real |

---

## Producción en vivo

| Servicio | Tecnología | URL |
|----------|------------|-----|
| **Frontend** | Vercel · Next.js 16 | https://taller1-frontend.vercel.app |
| **Backend API** | Railway · Express + Prisma | https://taller1-production.up.railway.app/api/v1 |
| **Health check** | Railway | https://taller1-production.up.railway.app/health |
| **Base de datos** | Railway · MySQL 8 | (interna, vía `DATABASE_URL`) |
| **ML (local)** | FastAPI · scikit-learn | http://localhost:5000 (desarrollo) |

Guía de despliegue: **[docs/DEPLOY.md](docs/DEPLOY.md)**

---

## Stack tecnológico

### Frontend (`frontend/`)

| Tecnología | Uso |
|------------|-----|
| **Next.js 16** (App Router, Turbopack) | SPA / SSR, rutas por rol |
| **React 19** | UI components |
| **TypeScript 5** | Tipado estático |
| **Tailwind CSS 4** | Estilos responsive, modo claro/oscuro |
| **Recharts** | Gráficos del dashboard |
| **Zod** | Validación de formularios |
| **Sonner** | Notificaciones toast |
| **Lucide React** | Iconografía |
| **jsPDF / xlsx** | Exportación de reportes |

Puerto local: **3029**

### Backend (`backend/`)

| Tecnología | Uso |
|------------|-----|
| **Node.js 20+** · **Express 4** | API REST `/api/v1` |
| **TypeScript** | Código fuente tipado |
| **Prisma 6** | ORM + migraciones MySQL |
| **MySQL 8** | Persistencia (XAMPP local / Railway prod) |
| **JWT + bcrypt** | Autenticación y sesiones |
| **Zod** | Validación de requests |
| **Helmet + rate limit** | Seguridad HTTP |

Puerto local: **4000**

### Machine Learning (`machine-learning/`)

| Tecnología | Uso |
|------------|-----|
| **Python 3.11+** | Entrenamiento e inferencia |
| **FastAPI** | Microservicio ML `:5000` |
| **scikit-learn** | Random Forest, Stacking |
| **XGBoost / HistGradientBoosting** | Modelos ensemble |
| **joblib** | Artefactos `models/*.joblib` |

### Paquete compartido (`packages/shared/`)

Tipos y utilidades TypeScript compartidos entre frontend y backend (`@tesis/shared`).

### Despliegue

| Entorno | Frontend | Backend | Base de datos |
|---------|----------|---------|---------------|
| **Local** | Vercel dev `:3029` | Express `:4000` | MySQL XAMPP `:3306` |
| **Producción** | [Vercel](https://vercel.com) | [Railway](https://railway.app) | MySQL Railway |

---

## Estructura del proyecto

```
tesis-dashboard/                    # Monorepo npm workspaces
│
├── frontend/                       # Next.js 16 — interfaz web
│   ├── src/
│   │   ├── app/                    # App Router (login, shell, rutas por rol)
│   │   ├── components/             # Vistas: Students, Teachers, Grades, Alerts…
│   │   ├── contexts/               # AuthProvider
│   │   ├── hooks/                  # useAcademicFilters, useAuth…
│   │   ├── services/               # api.ts — cliente REST
│   │   └── lib/                    # Validaciones, filtros, utilidades
│   └── package.json
│
├── backend/                        # API REST Express
│   ├── src/
│   │   ├── controllers/            # auth, students, teachers, grades, predict…
│   │   ├── services/               # teacher-assignment, profesor-dashboard…
│   │   ├── routes/                 # index.ts — rutas /api/v1
│   │   ├── middleware/             # auth, errorHandler
│   │   ├── validators/             # schemas Zod
│   │   └── utils/                  # prisma, scope por rol, audit
│   ├── prisma/
│   │   ├── schema.prisma           # 51 tablas — I.E.P. Primaria Blenkir
│   │   ├── seed.ts                 # Estructura: grados, cursos, permisos
│   │   ├── seed-demo.ts            # 660 estudiantes, 23 profesores
│   │   ├── seed-assignments.ts     # Tutores 1°-2°, polidocencia 3°-6°
│   │   └── migrations/             # Migraciones SQL versionadas
│   └── scripts/                    # Railway, seed, export cuentas, repair
│
├── machine-learning/               # Servicio IA
│   ├── app/main.py                 # FastAPI /predict, /metrics
│   ├── models/                     # best_model.joblib, metrics.json
│   ├── train.py                    # Entrenamiento ensemble
│   └── requirements.txt
│
├── packages/shared/                # @tesis/shared — tipos compartidos
│
├── database/
│   ├── mysql/                      # Guía XAMPP
│   └── blenkir-v3/                 # DER, scripts SQL v3
│
├── docs/
│   ├── INDICE-ISO.md               # Índice documentación ISO
│   ├── iso-9001/ · iso-25010/ · iso-29119/
│   ├── arquitectura/               # Visión por capas
│   ├── backend/ · frontend/ · python-ia/
│   ├── evidencias/                 # Capturas y logs QA
│   ├── evidencias_finales/         # Paquete evidencias locales
│   ├── DEPLOY.md
│   ├── cuentas-demo/               # CSV login (660 + 23)
│   └── postman/
│
├── plan-pruebas/                   # Plan de pruebas ISO 29119 (54 casos)
│   ├── README.md
│   ├── plan-general/
│   ├── pruebas-unitarias/ · pruebas-caja-negra/
│   ├── matriz-pruebas/
│   └── evidencias-finales/
│
├── scripts/evidence/               # Pipeline generación evidencias
│
├── package.json                    # Scripts raíz (dev, build, db, ml)
├── CHANGELOG.md
└── README.md                       # Este archivo
```

---

## Datos institucionales (demo)

Tras `npm run db:seed:demo`:

| Recurso | Cantidad |
|---------|----------|
| Estudiantes | **660** (22 salones × 30) |
| Profesores | **23** (8 tutores 1°-2° + 15 polidocencia 3°-6°) |
| Secciones | **22** (grados 1°–6°) |
| Cursos | **16** en catálogo |
| Notas | Bimestres **I y II** completos · III–IV vacíos |
| Director | 1 cuenta admin |

### Asignación docente

| Grado | Modelo |
|-------|--------|
| **1° y 2°** | 1 tutor exclusivo por salón (dicta todos los cursos del aula) |
| **3° al 6°** | Polidocencia: 2 cursos por docente, máx. 6–8 salones |

---

## Inicio rápido (local)

### Prerrequisitos

- Node.js **20+**
- **XAMPP** con MySQL en `:3306` (o MySQL 8+)
- Python **3.11+** (servicio ML)

### Instalación

```bash
git clone https://github.com/4dr1-2529/taller1.git
cd taller1/tesis-dashboard

npm install
pip install -r machine-learning/requirements.txt

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edite DATABASE_URL y JWT_SECRET en backend/.env
```

### Base de datos

```bash
# MySQL activo en XAMPP
npm run db:push
npm run db:seed          # Estructura académica + RBAC
npm run db:seed:demo     # 660 estudiantes + 23 profesores + notas I–II
```

Reset completo: `npm run db:reset:full`

### Ejecutar

```bash
npm run ml:train         # Entrenar modelos (primera vez)
npm run dev              # Frontend :3029 + API :4000 + ML :5000
```

| Servicio | URL local |
|----------|-----------|
| Frontend | http://localhost:3029 |
| API | http://localhost:4000/api/v1 |
| ML docs | http://localhost:5000/docs |

---

## Credenciales de acceso

**Contraseña institucional (todos los roles):** `mbappe29`

| Rol | Correo ejemplo | Sistema |
|-----|----------------|---------|
| **Director** | `director@blenkir.edu.pe` | `admin` |
| **Profesor tutor** | `pro50000001@blenkir.edu.pe` | `docente` |
| **Estudiante** | `mateo.quispe0001@blenkir.edu.pe` | `estudiante` |

### Listado completo de cuentas (producción verificadas)

Los CSV con correos de login reales están en:

```
docs/cuentas-demo/estudiantes.csv   → 660 alumnos (columna email_login)
docs/cuentas-demo/profesores.csv    → 23 docentes (columna email_login)
```

Actualizar desde producción:

```bash
cd backend
npm run export:accounts:web
```

---

## Roles del sistema

| Rol BD | UI | Permisos |
|--------|-----|----------|
| `admin` | **Director** | Gestión total, comunicados, predicciones, alertas, plantilla docente |
| `docente` | **Profesor** | Sus cursos/salones: notas, asistencia, LMS, predicción, mensajes |
| `estudiante` | **Estudiante** | Dashboard personal, notas, asistencia, alertas, mensajes |

Detalle: [docs/roles.md](docs/roles.md)

---

## Scripts principales

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend + Backend + ML en paralelo |
| `npm run build` | Build producción (shared + API + web) |
| `npm run db:seed` | Estructura académica Blenkir |
| `npm run db:seed:demo` | Población demo completa |
| `npm run db:reset:full` | Reset BD + seed + demo + validación |
| `npm run db:repair:all` | Reparar cuentas login + notas I–II (sin borrar todo) |
| `npm run export:accounts:web` | Exportar CSV verificados desde producción |
| `npm run railway:seed:demo` | Seed demo en Railway (consola backend) |
| `npm run ml:train` | Entrenar ensemble ML |
| `npm run test` | Tests backend + ML |
| `npm run type-check` | TypeScript en shared, frontend y backend |
| `npm run start:prod` | Arranque Railway (migrate + API) |

Variables Railway útiles: `RUN_DEMO_SEED=1` (reseed completo) · `RUN_REPAIR=1` (reparar cuentas/notas)

---

## Variables de entorno

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# Producción (Vercel):
# NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1
```

### Backend — `backend/.env`

```env
DATABASE_URL="mysql://root@localhost:3306/tesis_dashboard"
JWT_SECRET="blenkir_tesis_2026_jwt_secret_min_32_chars"
JWT_EXPIRES_IN="8h"
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN="http://localhost:3029"
ML_SERVICE_URL="http://localhost:5000"
POLIDOCENCIA_MAX_SALONES=8
```

### Producción (Railway + Vercel)

```env
# Vercel
NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1

# Railway
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=blenkir_tesis_2026_jwt_secret_min_32_chars
NODE_ENV=production
CORS_ORIGIN=https://taller1-frontend.vercel.app
```

---

## API REST (resumen)

Base: `/api/v1`

| Grupo | Rutas |
|-------|-------|
| Auth | `POST /auth/login` · `GET /auth/me` · `POST /auth/refresh` |
| Académico | `/students` · `/teachers` · `/courses` · `/grades` · `/attendance` |
| Asignaciones | `/teacher-assignments` · `/teacher-assignments/tutor` |
| Profesor | `/profesor/*` (dashboard, notas, asistencia, LMS, alertas) |
| Estudiante | `/estudiante/*` (perfil, notas, predicción, mensajes) |
| IA | `POST /predict` · `GET /predictions` · `GET /dashboard/kpis` |
| Admin | `/admin/users` · `/admin/cuentas-acceso` · `/admin/audit-logs` |
| Mensajería | `/messages/rooms` · `POST /messages` |

Documentación completa: [docs/API.md](docs/API.md)

---

## Machine Learning

- **Modelos:** Random Forest · XGBoost/HistGradientBoosting · Stacking
- **Features:** 10 variables (promedio, asistencia, LMS, actividad…)
- **Salida:** probabilidad de abandono, nivel de riesgo, factores, recomendación

```bash
npm run ml:train
npm run ml:test
```

Más: [docs/python-ia/modelo-predictivo.md](docs/python-ia/modelo-predictivo.md)

---

## Arquitectura del sistema

Visión de capas y flujos de datos:

| Documento | Contenido |
|-----------|-----------|
| [docs/arquitectura/arquitectura-general.md](docs/arquitectura/arquitectura-general.md) | Diagrama general monorepo |
| [docs/arquitectura/arquitectura-backend.md](docs/arquitectura/arquitectura-backend.md) | Capa API Express + Railway |
| [docs/arquitectura/arquitectura-frontend.md](docs/arquitectura/arquitectura-frontend.md) | Capa UI Next.js + Vercel |
| [docs/arquitectura/arquitectura-ia.md](docs/arquitectura/arquitectura-ia.md) | Capa ML ensemble |
| [docs/backend/backend-arquitectura.md](docs/backend/backend-arquitectura.md) | Detalle técnico backend |
| [docs/frontend/frontend-arquitectura.md](docs/frontend/frontend-arquitectura.md) | Detalle técnico frontend |

---

## Railway (backend + MySQL)

| Elemento | Valor |
|----------|-------|
| API | https://taller1-production.up.railway.app/api/v1 |
| Health | https://taller1-production.up.railway.app/health |
| Start | `npm run start:prod` → `railway-start.mjs` |
| BD | Plugin MySQL Railway → `DATABASE_URL` |

Variables clave: `JWT_SECRET` (≥32 chars), `CORS_ORIGIN`, `ML_SERVICE_URL`  
Operación: `RUN_DEMO_SEED=1` · `RUN_REPAIR=1` (temporal, redeploy)

Guía: [docs/DEPLOY.md](docs/DEPLOY.md)

---

## Vercel (frontend)

| Elemento | Valor |
|----------|-------|
| URL | https://taller1-frontend.vercel.app |
| Build | `@tesis/shared` + `next build` |
| Variable | `NEXT_PUBLIC_API_URL` → URL Railway `/api/v1` |

---

## Inteligencia Artificial

Pipeline: **Datos → Preprocesamiento → Feature Engineering → RF + XGBoost → Stacking → Meta-RF → Predicción → Dashboard → Alertas**

```bash
npm run ml:train    # Entrenar ensemble, genera metrics.json
npm run ml:test     # Validar formato respuesta
npm run dev:ml      # Servicio FastAPI :5000
```

Documentación: [docs/python-ia/modelo-predictivo.md](docs/python-ia/modelo-predictivo.md)

---

## Normas ISO aplicadas

| Norma | Documento | Alcance |
|-------|-----------|---------|
| **ISO 9001** | [docs/iso-9001/macroproceso-academico.md](docs/iso-9001/macroproceso-academico.md) | Macroproceso gestión académica, KPI, responsables |
| **ISO/IEC 25010** | [docs/iso-25010/calidad-software.md](docs/iso-25010/calidad-software.md) | Calidad software con tabla de evidencias |
| **ISO/IEC 29119** | [docs/iso-29119/plan-pruebas.md](docs/iso-29119/plan-pruebas.md) | Referencia normativa → [plan-pruebas/](plan-pruebas/README.md) |

Índice completo: **[docs/INDICE-ISO.md](docs/INDICE-ISO.md)**

---

## Plan de pruebas

Índice completo: **[plan-pruebas/README.md](plan-pruebas/README.md)**

| Recurso | Descripción |
|---------|-------------|
| [plan-pruebas/indice-pruebas.md](plan-pruebas/indice-pruebas.md) | Índice de todos los documentos de prueba |
| [plan-pruebas/plan-general/plan-pruebas.md](plan-pruebas/plan-general/plan-pruebas.md) | Plan formal ISO 29119 (54 casos) |
| [plan-pruebas/matriz-pruebas/matriz-casos.xlsx](plan-pruebas/matriz-pruebas/matriz-casos.xlsx) | Matriz editable |
| [plan-pruebas/evidencias-finales/](plan-pruebas/evidencias-finales/) | Capturas, videos, resultados |

| Comando | Alcance |
|---------|---------|
| `npm run test:backend` | 58+ tests unitarios API, roles, scope |
| `npm run ml:test` | Tests modelo predictivo Python |
| `npm run type-check` | TypeScript shared + frontend + backend |
| `npm run lint` | ESLint frontend |
| `npm run build` | Build producción completo |
| `npm run test:smoke` | Integración API + ML (servicios activos) |
| `npm run evidence:generate` | Genera evidencias locales |

Referencia ISO: [docs/iso-29119/plan-pruebas.md](docs/iso-29119/plan-pruebas.md)

---

## Capturas y evidencias

Almacene capturas, logs y artefactos en **`docs/evidencias/`**:

| Carpeta | Contenido |
|---------|-----------|
| `capturas/` | Pantallas del sistema |
| `dashboard/` | KPIs por rol |
| `backend/` · `frontend/` | Resultados tests |
| `ia/` | metrics.json, matrices |
| `railway/` · `vercel/` | Despliegue producción |
| `github/` · `postman/` · `sonarqube/` | Repo, API, calidad código |

Guía: [docs/evidencias/README.md](docs/evidencias/README.md)

---

## Autores

| Rol | Institución |
|-----|-------------|
| **Proyecto de tesis** | Modelo predictivo ensemble learning — riesgo de deserción |
| **Institución** | I.E.P. Blenkir Huancayo, Perú |
| **Repositorio** | [github.com/4dr1-2529/taller1](https://github.com/4dr1-2529/taller1) |

*Desarrollado como proyecto universitario — SaaS educativo con IA explicable y persistencia real en MySQL.*

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/INDICE-ISO.md](docs/INDICE-ISO.md) | Índice ISO, arquitectura y evidencias |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Despliegue Vercel + Railway |
| [plan-pruebas/README.md](plan-pruebas/README.md) | Plan de pruebas ISO 29119 (54 casos) |
| [docs/cuentas-demo/README.md](docs/cuentas-demo/README.md) | CSV de login verificados |
| [docs/roles.md](docs/roles.md) | Permisos por rol |
| [CHANGELOG.md](CHANGELOG.md) | Historial de cambios |
| [frontend/README.md](frontend/README.md) | Frontend Next.js |
| [database/blenkir-v3/DER-BLENKIR.md](database/blenkir-v3/DER-BLENKIR.md) | Modelo BD 51 tablas |

---

## Tesis

**Título:** Modelo predictivo basado en técnicas de ensemble learning para la identificación del riesgo de deserción estudiantil mediante fusión de datos académicos y comportamiento en LMS.

Sistema desarrollado como proyecto universitario — software escalable tipo SaaS educativo con IA explicable y persistencia real en MySQL.
