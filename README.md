# Tesis Dashboard v2.0

> **Modelo predictivo basado en ensemble learning para la identificación del riesgo de deserción estudiantil** — fusión de datos académicos y comportamiento en LMS.

**Institución:** I.E.P. Blenkir Huancayo · Perú  
**Tipo:** Software SaaS educativo con IA explicable y persistencia real

---

## Arquitectura

| Servicio | Puerto | Tecnología |
|----------|--------|------------|
| Frontend | 3029 | Next.js 16, React 19, Tailwind 4, Recharts |
| Backend API | 4000 | Express, Prisma, MySQL (XAMPP), JWT |
| ML Service | 5000 | FastAPI, scikit-learn, XGBoost, Stacking |

```
tesis-dashboard/
├── frontend/               # Next.js (src vía enlace a /src durante migración)
├── machine-learning/       # FastAPI + scikit-learn (ensemble)
│   ├── app/                # API inferencia
│   ├── data/               # Datasets CSV
│   ├── models/             # Artefactos .joblib
│   ├── training/           # Guía entrenamiento
│   ├── evaluation/         # Métricas y evaluación
│   ├── reports/            # Reportes exportados
│   ├── utils/              # Validadores de entrada
│   └── train.py            # Script principal
├── src/                    # Código UI (App Router)
│   ├── app/                # Pages + API routes
│   ├── components/         # UI components + views
│   ├── contexts/           # Auth + Theme providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Shared utilities (risk engine, recommendations)
│   ├── services/           # API client
│   ├── types/              # TypeScript types
│   └── data/               # Constantes UI (sin datos demo)
├── backend/                # API REST + Prisma ORM
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, sanitization, error handling
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic (ML client, risk engine)
│   │   ├── utils/          # Prisma, audit logging
│   │   └── validators/     # Zod schemas
│   └── prisma/             # Database schema + migrations
│   ├── app/main.py         # FastAPI (machine-learning/)
│   └── train.py            # Entrenamiento ensemble
├── database/mysql/         # Guía XAMPP · database/postgresql/ (referencia)
└── docs/                   # Architecture documentation
```

## Inicio rápido

### 1. Prerrequisitos

- Node.js 20+
- **XAMPP** con MySQL iniciado (puerto 3306), o MySQL 8+
- Python 3.11+

### 2. Dependencias

```bash
# Frontend + root
npm install

# Backend
cd backend && npm install && cd ..

# ML Service
pip install -r machine-learning/requirements.txt
```

### 3. Base de datos

```bash
# 1. Inicie MySQL en el panel de XAMPP
# 2. Cree la base (opcional):
powershell -File scripts/setup-mysql-xampp.ps1

cp backend/.env.example backend/.env

# Migrar tablas (Prisma → MySQL)
npm run db:push
npm run db:seed

# Crear administrador (variables en backend/.env)
# ADMIN_EMAIL=admin@tucolegio.edu.pe
# ADMIN_PASSWORD=SuClaveSegura123!
npm run db:bootstrap
```

### 4. Entrenar modelos IA

```bash
npm run ml:train
```

### 5. Ejecutar todo

```bash
npm run dev
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3029 |
| API | http://localhost:4000/api/v1 |
| ML Docs | http://localhost:5000/docs |

### Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@iep-huancayo.edu.pe | Tesis2026! |
| Docente | docente@iep-huancayo.edu.pe | Tesis2026! |
| Tutor | tutor@iep-huancayo.edu.pe | Tesis2026! |
| Psicólogo | psicologo@iep-huancayo.edu.pe | Tesis2026! |
| Estudiante | estudiante@iep-huancayo.edu.pe | Tesis2026! |

---

## Funcionalidades

### Core
- Dashboard analítico con KPIs y gráficos Recharts
- Predicción de riesgo (bajo / medio / alto) con interpretabilidad
- Ensemble ML: Random Forest, XGBoost, Stacking
- Alertas tempranas y recomendaciones automáticas
- Chat interno para coordinación entre roles

### Seguridad
- JWT Authentication con refresh tokens
- Role-based access control (admin, docente, tutor, psicólogo, estudiante)
- Brute-force protection en login
- XSS sanitization, rate limiting, Helmet CSP
- Auditoría completa de acciones (AuditLog)
- Sesiones con invalidación

### UI/UX
- Modo claro / oscuro robusto
- Responsive design (mobile, tablet, desktop)
- Glassmorphism + gradientes modernos
- Skeleton loading states
- Toast notifications (Sonner)
- Validaciones en tiempo real
- Accesibilidad mejorada

### Datos
- Base de datos MySQL normalizada (XAMPP)
- 18 modelos con relaciones completas
- Índices optimizados
- Trazabilidad y control de cambios
- Exportación PDF / Excel

---

## Roles y permisos

| Funcionalidad | Admin | Docente | Tutor | Psicólogo | Estudiante |
|---------------|-------|---------|-------|-----------|------------|
| Dashboard global | ✅ | ✅ | ✅ | ✅ | ✅ (solo su data) |
| Gestión estudiantes | ✅ CRUD | ✅ Create | ✅ Create | ❌ | ❌ |
| Gestión profesores | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Gestión cursos | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| Predicción IA | ✅ | ✅ | ✅ | ✅ | ✅ (solo su data) |
| Alertas | ✅ | ✅ | ✅ | ✅ | ❌ |
| Seguimiento psicológico | ✅ | ❌ | ✅ | ✅ | ❌ |
| Chat | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reportes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Administración usuarios | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| Logs de auditoría | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## API Endpoints

### Auth
- `POST /api/v1/auth/login` — Iniciar sesión
- `POST /api/v1/auth/refresh` — Renovar token
- `GET /api/v1/auth/me` — Perfil actual
- `POST /api/v1/auth/change-password` — Cambiar contraseña

### Estudiantes
- `GET /api/v1/students` — Listar (con paginación y búsqueda)
- `POST /api/v1/students` — Crear (admin, tutor, docente)
- `GET /api/v1/students/:id` — Detalle
- `PUT /api/v1/students/:id` — Actualizar
- `DELETE /api/v1/students/:id` — Eliminar (admin)

### IA / Predicción
- `POST /api/v1/predict` — Predecir riesgo (guarda historial + alerta si medio/alto)
- `GET /api/v1/predictions` — Historial de predicciones (filtro por estudiante)
- `GET /api/v1/predictions/:id` — Detalle de predicción
- `GET /api/v1/dashboard/kpis` — Estadísticas globales y tendencia
- `GET /api/v1/alerts` — Alertas tempranas (alcance por rol)
- `GET /api/v1/ml/metrics` — Métricas del modelo (RF, XGBoost/HGB, Stacking)

### ML Service (puerto 5000)
- `POST /predict` — Probabilidad de abandono, score, nivel, factores, recomendación
- `GET /metrics` — Comparación Accuracy, Precision, Recall, F1, matrices de confusión
- `GET /health` — Estado del servicio

### Administración (solo admin)
- `GET /api/v1/admin/users` — Listar usuarios
- `POST /api/v1/admin/users` — Crear usuario
- `PUT /api/v1/admin/users/:id` — Actualizar usuario
- `DELETE /api/v1/admin/users/:id` — Eliminar usuario
- `GET /api/v1/admin/audit-logs` — Logs de auditoría
- `GET /api/v1/admin/system-stats` — Estadísticas del sistema

Ver [API.md](docs/API.md) para documentación completa.

---

## Machine Learning

### Modelos (ensemble learning)
- **Random Forest** — 150 árboles, `class_weight=balanced`
- **XGBoost** (o HistGradientBoosting si hay incompatibilidad de versiones)
- **Stacking** — RF + HGB con meta-clasificador RF
- **Selección automática** del mejor modelo por **F1-score** → se guarda en `models/best_model.joblib`

### Variables de la tesis (10 features)
| Variable | Descripción |
|----------|-------------|
| `promedio_general` | Promedio académico (0–20) |
| `cursos_desaprobados` | Cantidad de cursos con nota &lt; 11 |
| `asistencia_general` | Porcentaje de asistencia (0–100) |
| `frecuencia_acceso_lms` | Actividad promedio semanal en LMS |
| `tiempo_plataforma` | Horas semanales en plataforma |
| `tareas_ratio` | Tareas entregadas / totales |
| `participacion_actividades` | Participación en actividades |
| `uso_foros` | Uso de foros (0–1) |
| `disminucion_actividad` | Caída de actividad entre semanas |
| `estado` | activo / en_riesgo / retirado |

### Salida de `/predict` (formato tesis + compatibilidad)

```json
{
  "probabilidad_abandono": 0.85,
  "score_predictivo": 85,
  "nivel_riesgo": "Alto",
  "factores_riesgo": [],
  "recomendacion": "",
  "modelo_usado": "stacking",
  "fecha_prediccion": "2026-06-02T12:00:00.000Z"
}
```

También se devuelven alias en inglés/camelCase (`score`, `level`, `factors`, etc.) para el frontend.

### Flujo del sistema

```
Frontend (3029) → Backend API (4000) → ML Service (5000)
                      ↓
            Historial (Prediction)
                      ↓
         Alerta temprana (medio/alto) → Dashboard + Notificaciones
```

### Entrenamiento y métricas
```bash
npm run ml:train
```
Genera `models/metrics.json` y `models/metrics_comparison.csv` con Accuracy, Precision, Recall, F1 y matriz de confusión por modelo.

### Pruebas
```bash
npm run ml:test          # unit tests Python
npm run test:smoke       # API + ML (servicios en ejecución)
```

---

## Base de datos

### Esquema
18 modelos normalizados:
- **Usuarios y sesiones** — Auth con JWT + refresh tokens
- **Académico** — Students, Teachers, Courses, Enrollments
- **Seguimiento** — Predictions, Alerts, AiRecommendations, StudentRisk
- **Actividad** — LmsActivity, Attendance, AcademicHistory
- **Sistema** — Notifications, Reports, AuditLog, ChatMessage, DashboardSnapshot

### Diagrama DER
Ver [DER.md](docs/DER.md) y `database/mysql/README.md`

---

## Variables de entorno

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Backend (`backend/.env`)
```
DATABASE_URL="mysql://root@localhost:3306/tesis_dashboard"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="8h"
PORT=4000
CORS_ORIGIN="http://localhost:3029"
NODE_ENV="development"
```

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecutar todo (frontend + API + ML) |
| `npm run dev:web` | Solo frontend |
| `npm run dev:api` | Solo backend API |
| `npm run dev:ml` | Solo ML service |
| `npm run build` | Build producción |
| `npm run db:push` | Sincronizar schema |
| `npm run db:seed` | Poblar datos demo |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run ml:train` | Entrenar modelos IA |
| `npm run ml:test` | Pruebas unitarias ML |
| `npm run test:unit` | Formato respuesta tesis (Node) |
| `npm run test:smoke` | Pruebas smoke API/ML |
| `npm run test` | unit + ml + smoke |
| `npm run lint` | Lint código |

---

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [DER](docs/DER.md)
- [API](docs/API.md)
- [MySQL / XAMPP](database/mysql/README.md)

---

## Tesis

Sistema desarrollado como proyecto universitario avanzado — software escalable tipo SaaS educativo con IA explicable y persistencia real.

**Título:** Modelo predictivo basado en técnicas de ensemble learning para la identificación del riesgo de deserción estudiantil mediante fusión de datos académicos y comportamiento en LMS.
