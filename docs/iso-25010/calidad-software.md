# Modelo de calidad de software — ISO/IEC 25010

**Sistema:** Tesis Dashboard v2.0  
**Norma:** ISO/IEC 25010 — Modelo de calidad del producto software  
**Versión:** 2.0

---

## 1. Introducción

Este documento relaciona cada **característica de calidad** ISO/IEC 25010 con **funcionalidades reales** del sistema, indicando evidencia concreta, método de medición y estado de verificación.

**Leyenda de estado:**

| Estado | Significado |
|--------|-------------|
| ✅ Verificado | Cubierto por tests automatizados y/o evidencia en repo |
| 🔄 Parcial | Implementado; evidencia manual pendiente en `docs/evidencias/` |
| 📋 Planificado | Documentado; requiere ejecución de prueba manual |

---

## 2. Tabla maestra de calidad

| Característica ISO 25010 | Evidencia dentro del sistema | Cómo se mide | Estado |
| ------------------------ | ---------------------------- | ------------ | ------ |
| **Funcionalidad — Login** | `POST /auth/login`, pantalla `/login`, JWT + refresh | Test `schemas.test.ts` login válido/inválido; captura login exitoso | ✅ Verificado |
| **Funcionalidad — Dashboard** | `RoleDashboard`, `ProfessorDashboard`, `StudentDashboard`, `GET /dashboard/kpis` | TC-DASH-* plan pruebas; capturas KPIs por rol | ✅ Verificado |
| **Funcionalidad — Predicción IA** | `POST /predict`, `PredictionView`, FastAPI `/predict` | `prediction-format.test.mjs`, `ml:test` | ✅ Verificado |
| **Funcionalidad — Roles** | RBAC `authorize()`, `ROLE_SECTIONS`, menú filtrado | `permissions.test.mjs`, `roles-*.test.mjs` | ✅ Verificado |
| **Funcionalidad — Registro de notas** | `GradesView`, `POST /grades`, `/profesor/notas` | TC-NOT-*; validación rango 0–20 | ✅ Verificado |
| **Funcionalidad — Reportes** | `ReportsView`, `POST /reports`, jsPDF/xlsx | TC-REP-*; export manual | 🔄 Parcial |
| **Funcionalidad — Alertas** | `AlertsView`, tabla `alert`, PATCH estado | TC-ALT-*; smoke Postman | ✅ Verificado |
| **Funcionalidad — CRUD estudiantes** | `StudentsView`, `/students` | Postman DIRECTOR; captura CRUD | ✅ Verificado |
| **Funcionalidad — Asignación docente** | `TeacherAssignmentsView`, tutores + polidocencia | Seed 8 tutores + 15 polidocencia | ✅ Verificado |
| **Funcionalidad — Mensajería** | `MensajeriaAcademicaView`, `/messages` | Prueba manual comunicados | 🔄 Parcial |
| **Usabilidad — Navegación por rol** | Sidebar agrupado `sidebar-nav.ts` | TC-FE-02; captura menú por rol | ✅ Verificado |
| **Usabilidad — Sin F5 al login** | `useAuthReady` espera rol antes de APIs | Fix v2.0.1; consola sin 401 al cargar | ✅ Verificado |
| **Usabilidad — Feedback visual** | Sonner toasts, `RiskBadge`, `RiskGauge`, Recharts | Revisión UX manual | 🔄 Parcial |
| **Usabilidad — Filtros académicos** | Grado → sección → curso en notas/asistencia | `validation-fields.test.ts` limpieza filtros | ✅ Verificado |
| **Usabilidad — Modo claro/oscuro** | Tailwind CSS 4 theming | Captura tema claro y oscuro | 📋 Planificado |
| **Fiabilidad — Health check** | `GET /health` Railway | HTTP 200 producción | ✅ Verificado |
| **Fiabilidad — ML degradado** | Heurística si ML no disponible | Apagar ML local → API responde | 🔄 Parcial |
| **Fiabilidad — Migraciones Prisma** | `railway-start.mjs`, recovery P3009 | Log migrate deploy Railway | ✅ Verificado |
| **Fiabilidad — Seed/repair prod** | `RUN_DEMO_SEED`, `RUN_REPAIR` | Documentado DEPLOY.md | ✅ Verificado |
| **Eficiencia — Rate limit login** | `express-rate-limit` en auth | Intentos brute-force bloqueados | ✅ Verificado |
| **Eficiencia — Alcance profesor** | `teacher-scope` reduce consultas | `teacher-scope.test.ts` | ✅ Verificado |
| **Eficiencia — Build Turbopack** | `next dev --turbopack` | Tiempo build < 3 min | ✅ Verificado |
| **Eficiencia — Inferencia ML** | joblib en memoria | Tiempo `/predict` < 3 s | 🔄 Parcial |
| **Seguridad — JWT** | Access + refresh, expiración configurable | Login → token → `/auth/me` | ✅ Verificado |
| **Seguridad — bcrypt contraseñas** | Hash en tabla `usuario` | No plaintext en BD | ✅ Verificado |
| **Seguridad — Refresh SHA-256** | `sesion.token_hash` max 128 chars | Fix login 500 v2.0.1 | ✅ Verificado |
| **Seguridad — RBAC 403** | Profesor no POST `/students` | `permissions.test.mjs` | ✅ Verificado |
| **Seguridad — Scope estudiante** | `rejectClientStudentId()` | `estudiante-scope.test.ts` | ✅ Verificado |
| **Seguridad — Helmet + XSS** | Headers HTTP + sanitización | Revisión middleware | ✅ Verificado |
| **Seguridad — CORS Vercel** | `CORS_ORIGIN` producción | Login desde Vercel sin CORS error | ✅ Verificado |
| **Mantenibilidad — TypeScript** | Strict en frontend, backend, shared | `npm run type-check` exitoso | ✅ Verificado |
| **Mantenibilidad — Tests backend** | 58+ tests unitarios | `npm run test:backend` | ✅ Verificado |
| **Mantenibilidad — Monorepo workspaces** | `@tesis/shared` tipos compartidos | Build shared antes de frontend | ✅ Verificado |
| **Mantenibilidad — Documentación ISO** | `docs/iso-*`, `docs/arquitectura/` | Índice INDICE-ISO.md | ✅ Verificado |
| **Mantenibilidad — ESLint** | `eslint src` frontend | `npm run lint` sin errores | ✅ Verificado |
| **Portabilidad — Local XAMPP** | MySQL local + Express + Next | README instalación | ✅ Verificado |
| **Portabilidad — Railway backend** | Node 20, `DATABASE_URL` plugin | Deploy producción activo | ✅ Verificado |
| **Portabilidad — Vercel frontend** | `NEXT_PUBLIC_API_URL` | taller1-frontend.vercel.app | ✅ Verificado |
| **Portabilidad — ML Python** | `requirements.txt`, uvicorn | `npm run ml:train` multiplataforma | ✅ Verificado |

---

## 3. Detalle por característica y capa

### 3.1 Funcionalidad

| Subcaracterística | Backend | Frontend | IA |
|-------------------|---------|----------|-----|
| Completitud | 80+ endpoints `/api/v1` | 14 secciones Director, 10 Profesor, 6 Estudiante | `/predict`, `/metrics`, `/health` |
| Corrección | Zod validators | Form validation | Clasificación 3 clases |
| Adecuación | RBAC por rol tesis | Menú acotado | Factores en español |

### 3.2 Usabilidad

| Aspecto | Implementación |
|---------|----------------|
| Reconocibilidad | Iconos Lucide, breadcrumbs `SECTION_BREADCRUMB` |
| Capacidad de aprendizaje | Sidebar agrupado: Panel, Académico, IA, Comunicación |
| Operabilidad | Filtros dependientes; toasts de confirmación/error |
| Protección errores usuario | Validación inline; "—" en lugar de NaN en promedios |

### 3.3 Fiabilidad

| Aspecto | Implementación |
|---------|----------------|
| Madurez | Error handler centralizado Express |
| Disponibilidad | Railway healthcheck 120 s timeout |
| Recuperabilidad | `db:repair:all`, `RUN_REPAIR=1` |
| Tolerancia a fallos | ML fallback heurístico |

### 3.4 Eficiencia de desempeño

| Aspecto | Implementación |
|---------|----------------|
| Tiempo de respuesta | Filtros Prisma por rol reducen rows |
| Utilización recursos | Prisma connection pool |
| Capacidad | 660 estudiantes demo sin degradación |

### 3.5 Seguridad

| Aspecto | Implementación |
|---------|----------------|
| Confidencialidad | JWT; estudiante solo datos propios |
| Integridad | Audit log; validación server-side |
| Autenticidad | Login email institucional `@blenkir.edu.pe` |
| Responsabilidad | `audit_log` acciones Director |

### 3.6 Mantenibilidad

| Aspecto | Implementación |
|---------|----------------|
| Modularidad | controllers / services / validators |
| Reusabilidad | hooks, ui components, `@tesis/shared` |
| Analizabilidad | SonarQube prep, ESLint |
| Modificabilidad | Prisma migrations versionadas |
| Capacidad de prueba | 58+ tests backend, ml:test |

### 3.7 Portabilidad

| Aspecto | Implementación |
|---------|----------------|
| Adaptabilidad | Env vars por entorno |
| Instalabilidad | npm workspaces, pip requirements |
| Reemplazabilidad | ML service desacoplado vía HTTP |

---

## 4. Funcionalidades clave — mapa evidencia

```
Login ──────────► auth.controller.ts · login/page.tsx · schemas.test.ts
Dashboard ──────► RoleDashboard · /dashboard/kpis · TC-DASH-*
Predicción IA ──► predict.controller · PredictionView · ml:test
Roles ──────────► authorize() · ROLE_SECTIONS · permissions.test.mjs
Notas ──────────► GradesView · grades.controller · TC-NOT-*
Reportes ───────► ReportsView · /reports · jsPDF
Alertas ─────────► AlertsView · alerts.controller · TC-ALT-*
```

---

## 5. Referencias

- [Macroproceso ISO 9001](../iso-9001/macroproceso-academico.md)
- [Plan de pruebas ISO 29119](../iso-29119/plan-pruebas.md)
- [Evidencias](../evidencias/README.md)
- [Índice general](../INDICE-ISO.md)
