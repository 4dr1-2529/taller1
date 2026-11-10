# Auditoría local de SonarQube — 9 de noviembre de 2026

## Resultado

- Proyecto: `MiProyecto` (`http://localhost:9000/dashboard?id=MiProyecto`).
- Revisión analizada: `b0f7a308725fb02d26fccbb6c11574c1faf7bea5`.
- El servidor procesó correctamente el análisis y el Quality Gate quedó en `OK`.
- Cobertura global informada por SonarQube: **85.4%**; cobertura de líneas: **86.8%**; cobertura de ramas: **79.8%**.
- Cobertura de código nuevo: **83.9%** (umbral 80%). Duplicación nueva: 0%; violaciones nuevas: 0.
- Medidas globales: 0 bugs, 0 vulnerabilidades, 0 code smells, 0 hotspots de seguridad; duplicación 0.7%.

El Quality Gate verde no significa que el repositorio tenga 100% de cobertura. La meta de 100% sigue pendiente.

## Cobertura comprobada por área

| Área | Pruebas | Resultado | Líneas | Ramas | Funciones |
| --- | ---: | --- | ---: | ---: | ---: |
| Backend (`c8 --all`) | 561 | 561 pasaron, 0 fallaron | 77.04% | 83.31% | 73.24% |
| Frontend (`c8 --all`) | 548 | 548 pasaron, 0 fallaron | 91.26% | 77.16% | 86.58% |
| ML (`app`, `train.py`) | 104 | 104 pasaron, 0 fallaron | 100% | 100% | No medido |

También pasaron `npm run type-check`, `npm run lint` y `npm run build`. El build ya no necesita descargar fuentes de Google durante la compilación; la aplicación usa pilas tipográficas del sistema.

## Pendientes principales de cobertura

Los reportes LCOV de esta corrida señalan estos mayores huecos de líneas:

- Backend: `backend/src/services/teacher-assignment.service.ts` (351), `backend/src/services/dashboard-analytics.service.ts` (314), `backend/src/services/estudiante.service.ts` (271), `backend/src/controllers/messages.controller.ts` (241) y `backend/src/controllers/alerts.controller.ts` (153).
- Frontend: `frontend/src/lib/export-reports.ts` (56), `frontend/src/components/views/TeachersView.tsx` (55), `frontend/src/components/views/StudentsView.tsx` (54), `frontend/src/app/(shell)/page.tsx` (54) y `frontend/src/components/views/AttendanceView.tsx` (44).

Los números son líneas instrumentadas sin ejecutar en el reporte completo `c8 --all`; no se añadieron exclusiones productivas para elevar el porcentaje.

## Dataset y versión activa

- Dataset operativo validado: `BLENKIR_DATA_SEED_V6_250`, versión `6.0-synthetic-scientific-twin`.
- Cuentas: 250 estudiantes, 24 docentes y 1 director (275 en total).
- El validador terminó con `DEFINITIVE_DATASET_VALID=true`.
- No hay archivos de dataset V5 rastreados en el árbol actual de `main`; el historial de commits conserva los blobs de revisiones antiguas.

## Advertencia del análisis

El analizador JavaScript emitió una advertencia no fatal al intentar resaltar un rango de `frontend/src/app/globals.css` en la línea 774. La tarea de SonarQube terminó correctamente y el servidor procesó el informe. Conviene revisar esa advertencia en una próxima auditoría del analizador.
