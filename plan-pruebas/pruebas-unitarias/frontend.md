# Pruebas unitarias — Frontend

**Comandos:** `npm run type-check` · `npm run lint` · `npm run build`

No hay suite Jest en frontend; la verificación es **estática + build + UAT capturado**.

---

## Verificaciones automatizadas reales

| Script | Workspace | Qué comprueba |
|--------|-----------|---------------|
| `type-check` | `@tesis/shared`, `frontend`, `backend` | Tipos `AuthUser.role`: `admin \| docente \| estudiante` |
| `lint` | `frontend` | ESLint Next.js — `qa-lint-frontend.txt` PASS |
| `build` | `frontend` | Compilación App Router `(auth)/login`, `(shell)/page` |

---

## Lógica de rol testeable en código

### `ROLE_SECTIONS` (`page.tsx` L54–91)

| Rol API | Secciones UI | Count |
|---------|--------------|-------|
| `admin` | Dashboard … Reportes (14) | TC-FE-03 |
| `docente` | Sin Profesores, Asignaciones, Matrículas, Reportes (10) | TC-FE-04 |
| `estudiante` | Dashboard, Notas, Asistencia, LMS, Predicción, Mensajería (6) | TC-FE-05 |

### `section-labels.ts`

Estudiante ve: `Notas` → "Mis notas", `Predicción` → "Mi riesgo" (`getSectionLabel`).

---

## Componentes críticos (sin test unitario — UAT/captura)

| Componente | Archivo | Caso matriz |
|------------|---------|-------------|
| Login | `app/(auth)/login/page.tsx` | TC-FE-01, TC-CN-01 |
| `PredictionView` | `views/PredictionView.tsx` | Requiere `seccionId` antes de predecir — TC-CN-07 |
| `GradesView` | `views/GradesView.tsx` | Filtros bimestre — TC-CN-06 |
| `ReportsView` | `views/ReportsView.tsx` | 4 botones export — TC-CN-09 |
| `MlMetricsSection` | `views/MlMetricsSection.tsx` | `api.getMlMetrics()` — TC-INT-07 |

---

## Servicios HTTP (`api.ts`)

Métodos reales usados en pruebas integración: `login`, `getDashboardKpis`, `predict`, `getPredictions`, `getAlerts`, `getMlMetrics`, `getStudents`, `getTeachers`.
