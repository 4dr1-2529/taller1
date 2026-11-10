# Auditoría local de cobertura — 10 de noviembre de 2026

## Resultado medido

La cobertura se midió por separado para conservar la instrumentación entre procesos. Backend y frontend pasaron todas sus pruebas; la cobertura de ML también se regeneró. Backend y frontend aún no llegan a 100%.

| Área | Pruebas | Líneas/Statements | Ramas | Funciones |
|---|---:|---:|---:|---:|
| Backend (c8, LCOV fusionado por archivo) | 603/603 | 7,532/7,781 · **96.80%** | 2,065/2,708 · **76.26%** | 563/711 · **79.18%** |
| Frontend (c8) | 558/558 | 14,356/15,636 · **91.81%** | 3,082/3,997 · **77.10%** | 1,281/1,468 · **87.26%** |
| Machine learning (coverage.py) | 104/104 | 554 statements · **100%** | 138/138 · **100%** | No medido por cobertura.py |

No se excluyeron archivos de aplicación para elevar porcentajes. ML cubre todo el alcance configurado (`app` y `train.py`); no implica que frontend o backend estén al 100%.

## Archivos con más líneas pendientes

El comando general `npm run coverage` ahora encadena `coverage:backend`, `coverage:frontend` y `coverage:ml`. En backend se instrumenta cada archivo de pruebas por separado y se combinan los LCOV, filtrando rutas de Node que no son fuentes reales. La ejecución anterior de c8 fusionaba incorrectamente procesos aislados y llegó a subcontar cientos de líneas; esa era una fuente de oscilación de la lectura anterior.

### Backend: más líneas y ramas pendientes

| Archivo | Líneas pendientes | Ramas pendientes |
|---|---:|---:|
| `backend/src/routes/index.ts` | 22 | 1 |
| `backend/src/controllers/teacher-assignments.controller.ts` | 20 | 8 |
| `backend/src/controllers/estudiante.controller.ts` | 17 | 12 |
| `backend/src/controllers/grades.controller.ts` | 17 | 11 |
| `backend/src/index.ts` | 16 | 5 |
| `backend/src/config/env.ts` | 16 | 9 |
| `backend/src/controllers/students.controller.ts` | 13 | 9 |
| `backend/src/controllers/admin.controller.ts` | 12 | 15 |
| `backend/src/controllers/attendance.controller.ts` | 12 | 18 |
| `backend/src/controllers/reports.controller.ts` | 12 | 20 |

### Frontend

| Archivo | Líneas sin ejecutar |
|---|---:|
| `frontend/src/components/views/TeachersView.tsx` | 55 |
| `frontend/src/app/(shell)/page.tsx` | 54 |
| `frontend/src/components/views/StudentsView.tsx` | 54 |
| `frontend/src/components/views/AttendanceView.tsx` | 44 |
| `frontend/src/components/views/PredictionView.tsx` | 44 |
| `frontend/src/components/AppSidebar.tsx` | 41 |
| `frontend/src/components/student/StudentAttendanceView.tsx` | 37 |
| `frontend/src/components/views/GradesView.tsx` | 37 |
| `frontend/src/components/student/StudentPredictionView.tsx` | 36 |
| `frontend/src/components/views/AlertsView.tsx` | 36 |

Los informes actuales están en `coverage/backend/lcov.info`, `coverage/frontend/lcov.info` y `machine-learning/coverage.xml`. Frontend pasó 558/558; Machine Learning pasó 104/104. Las líneas y ramas se reportan por separado porque una línea ejecutada no significa que todos sus resultados condicionales hayan sido probados.

## Verificaciones relacionadas

- `npm run type-check`: aprobado para shared, frontend, backend y herramientas.
- `npm run lint`: aprobado.
- `npm run build`: aprobado para shared, API y Next.js.
- `npm run db:dataset:validate --workspace=backend`: `DEFINITIVE_DATASET_VALID=true`, con 250 estudiantes, 24 docentes y 1 director.
- `npm run coverage:ml`: usa `scripts/run-ml-coverage.mjs` para localizar Python con `coverage` y `pytest` en Windows, macOS o Linux.

## SonarQube local

El análisis local actualizado es la tarea `fde81927-22c9-4d11-ae0e-e9afed957520` (scanner: `ANALYSIS SUCCESSFUL`, procesamiento: `SUCCESS`); [dashboard MiProyecto](http://localhost:9000/dashboard?id=MiProyecto). SonarQube informa **90.0% de cobertura general**, **93.6% de líneas** (1,529 sin cubrir de 23,971) y **77.3% de condiciones** (1,558 sin cubrir de 6,858). Duplication: 0.7%. El Quality Gate está `OK` para las métricas de código nuevo (cobertura 89.9%, umbral 80%); la cobertura global sigue por debajo incluso del objetivo alternativo de 95%, así que no debe presentarse como cobertura total.

Respecto a la medición previa que constaba en este informe, la cobertura global pasó de 89.9% a 90.0%; hay 17 líneas menos sin cubrir y 9 condiciones menos pendientes. El salto previo desde 81.1% se debió a corregir el LCOV backend, que antes estaba subcontado. La vista global y el Quality Gate usan métricas distintas: el Gate evalúa código nuevo.

La carga se completó con dos advertencias no bloqueantes: faltó blame SCM en archivos locales aún sin commit y el resaltado de `frontend/src/app/styles/base.css:773` apuntó un carácter después del fin de línea. El escáner acabó con código 0 y el servidor procesó el informe correctamente.

## Organización

`frontend/src/app/globals.css` queda como punto de entrada del CSS. Los tokens, resets y componentes base están en `frontend/src/app/styles/base.css`; las vistas, dashboards y reglas responsive están en `frontend/src/app/styles/presentation.css`. La hoja de estilos mantiene el contenido anterior y se importa en ese orden.
