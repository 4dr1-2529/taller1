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

## 2. Tabla de trazabilidad código — ISO/IEC 25010

| Norma | Característica | Módulo | Archivo | Implementación | Evidencia | Estado |
|-------|----------------|--------|---------|----------------|-----------|--------|
| ISO/IEC 25010 | Funcionalidad — adecuación | Autenticación | `backend/src/controllers/auth.controller.ts` | `POST /auth/login`, JWT + refresh, rate-limit IP | `backend/tests/schemas.test.ts`; `plan-pruebas/evidencias-finales/login/login.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — adecuación | Login UI | `frontend/src/app/(auth)/login/page.tsx` | Formulario `#login-email`, validación Zod cliente | `capturas-manifest.json` (login) | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — exactitud | Notas | `backend/src/validators/schemas.ts` | `gradeSchema` rango 0–20 | `schemas.test.ts`; `evidencias-finales/notas/notas.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — exactitud | Predicción IA | `machine-learning/app/main.py` | `POST /predict`, `LEVEL_MAP`, `proba_to_score()` | `machine-learning/tests/test_predict.py` (6 tests); `ia/metricas-ml.json` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | API REST | `backend/src/routes/index.ts` | 96 rutas HTTP con RBAC | `plan-pruebas/matriz-pruebas/matriz-casos.md` (77 casos) | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | Dashboard | `frontend/src/components/dashboard/RoleDashboard.tsx` | KPIs vía `GET /dashboard/kpis` | `evidencias-finales/dashboard/dashboard.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | Estudiantes | `frontend/src/components/views/StudentsView.tsx` | CRUD `GET/POST /students` | `evidencias-finales/estudiantes/estudiantes.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | Profesores | `frontend/src/components/views/TeachersView.tsx` | CRUD `/teachers` solo admin | `evidencias-finales/profesores/profesores.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | Cursos | `frontend/src/components/views/CoursesView.tsx` | Catálogo cursos/secciones | `evidencias-finales/cursos/cursos.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | Alertas | `frontend/src/components/views/AlertsView.tsx` | Estados `nueva` / `en_seguimiento` / `resuelta` | `evidencias-finales/alertas/alertas.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — completitud | Reportes | `frontend/src/components/views/ReportsView.tsx` | Export jsPDF/xlsx | `evidencias-finales/reportes/reportes.png` | ✅ Verificado |
| ISO/IEC 25010 | Funcionalidad — interoperabilidad | Backend ↔ ML | `backend/src/services/ml-client.ts` | `predictWithMl()`, timeout 8s, `buildMlPayload()` | `scripts/evidence/verify-stack.mjs` (IA predict PASS) | ✅ Verificado |
| ISO/IEC 25010 | Usabilidad — operabilidad | Navegación por rol | `frontend/src/app/(shell)/page.tsx` | `ROLE_SECTIONS` 14/10/6 secciones | `backend/tests/permissions.test.mjs`; capturas por módulo | ✅ Verificado |
| ISO/IEC 25010 | Usabilidad — reconocibilidad | Sidebar | `frontend/src/components/AppSidebar.tsx` | Iconos Lucide, grupos `sidebar-nav.ts` | Capturas dashboard, notas, predicción | ✅ Verificado |
| ISO/IEC 25010 | Fiabilidad — disponibilidad | Health | `backend/src/routes/index.ts` | `GET /health` | `verificacion-stack.json` → Backend health PASS | ✅ Verificado |
| ISO/IEC 25010 | Fiabilidad — tolerancia a fallos | ML fallback | `machine-learning/app/main.py` | `heuristic_predict()` si sin modelo | `test_predict.py` TC heurístico | ✅ Verificado |
| ISO/IEC 25010 | Fiabilidad — recuperabilidad | BD | `backend/scripts/railway-start.mjs` | `prisma migrate deploy`, repair P3009 | `docs/DEPLOY.md`; seed `db:seed:demo` | ✅ Verificado |
| ISO/IEC 25010 | Eficiencia — tiempo de respuesta | Rate limit | `backend/src/index.ts` | `express-rate-limit` global | `plan-pruebas/pruebas-seguridad/jwt.md` | ✅ Verificado |
| ISO/IEC 25010 | Eficiencia — utilización | Alcance docente | `backend/src/utils/teacher-scope.ts` | Filtro Prisma por secciones asignadas | `teacher-scope.test.ts` | ✅ Verificado |
| ISO/IEC 25010 | Seguridad — confidencialidad | JWT | `backend/src/middleware/auth.ts` | `authenticate`, `Bearer` token | `jwt.md`; login → students 200 | ✅ Verificado |
| ISO/IEC 25010 | Seguridad — integridad | RBAC | `backend/src/middleware/auth.ts` | `authorize(...roles)` | `permissions.test.mjs`, `roles-*.test.mjs` | ✅ Verificado |
| ISO/IEC 25010 | Seguridad — autenticidad | Contraseñas | `backend/prisma/seed-demo.ts` | bcrypt en `usuario.passwordHash` | `db:demo-bcrypt`; login director OK | ✅ Verificado |
| ISO/IEC 25010 | Seguridad — resistencia | Headers | `backend/src/index.ts` | `helmet()`, CORS whitelist, `sanitizeBody` | `pruebas-seguridad/autenticacion.md` | ✅ Verificado |
| ISO/IEC 25010 | Mantenibilidad — modularidad | Capas backend | `backend/src/controllers/`, `services/` | Separación controller / service / validator | 11 archivos en `backend/tests/` | ✅ Verificado |
| ISO/IEC 25010 | Mantenibilidad — capacidad de prueba | Tests | `backend/package.json` | `npm run test` → 31 tests Node | Ejecución local: 31 pass / 0 fail | ✅ Verificado |
| ISO/IEC 25010 | Mantenibilidad — capacidad de prueba | Tests ML | `machine-learning/train.py` | `npm run ml:test` | 6 tests unittest OK | ✅ Verificado |
| ISO/IEC 25010 | Mantenibilidad — analizabilidad | Tipos | `packages/shared/`, TS strict | `npm run type-check` monorepo | CI local documentado en `recursos.md` | ✅ Verificado |
| ISO/IEC 25010 | Portabilidad — adaptabilidad | Entorno | `backend/src/config/env.ts` | `DATABASE_URL`, `ML_SERVICE_URL`, `CORS_ORIGIN` | `backend/.env.example`; XAMPP + Railway | ✅ Verificado |
| ISO/IEC 25010 | Portabilidad — instalabilidad | Monorepo | `package.json` raíz | workspaces frontend/backend/shared | `npm run dev` puertos 3029/4000/5000 | ✅ Verificado |

**Automatización verificada:** 31 tests backend + 6 tests ML (`npm run test:backend`, `npm run ml:test`).

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
| Capacidad de prueba | 31 tests backend (`backend/tests/`), 6 tests ML | `npm run test:backend`, `ml:test` |

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
- [Plan de pruebas ISO 29119](../../plan-pruebas/README.md)
- [Trazabilidad normas](../../plan-pruebas/matriz-pruebas/trazabilidad.md)
- [Evidencias QA](../../plan-pruebas/evidencias-finales/README.md)
