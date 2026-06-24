# Evidencias finales — ejecución 100% local

> Generado con datos reales del sistema en ejecución local (MySQL XAMPP + Backend :4000 + Frontend :3029 + ML :5000).  
> **No se utilizó Railway ni Vercel.**

## Entorno verificado

| Servicio | URL | Estado |
|----------|-----|--------|
| Frontend | http://localhost:3029 | Next.js |
| Backend API | http://localhost:4000/api/v1 | Express + Prisma |
| Modelo IA | http://localhost:5000 | FastAPI |
| MySQL | `tesis_dashboard` | 660 estudiantes · 23 profesores |

### Credenciales demo (capturas)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Director | director@blenkir.edu.pe | mbappe29 |
| Profesor | pro50000001@blenkir.edu.pe | mbappe29 |
| Alumno | mateo.quispe0001@blenkir.edu.pe | mbappe29 |

## Estructura de entrega

| Carpeta | Contenido |
|---------|-----------|
| `capturas/` | Screenshots UI reales por módulo (login, dashboards, notas, IA, reportes, QA) |
| `diagramas/` | Duplicado PNG/SVG de arquitectura e ISO |
| `arquitectura/` | Arquitectura general, frontend, backend, BD, modelo IA, pipelines ML, flujos |
| `ia/` | Matriz confusión, ROC, feature importance, métricas individuales |
| `metricas/` | Gráficos ML + `metricas-evaluacion-local.json` |
| `base_datos/` | Diagrama ER desde `schema.prisma` |
| `api/` | Flujo Frontend → API → Backend → Prisma → MySQL → IA |
| `iso/` | Macroproceso ISO 9001, ISO 25010, ISO 29119 + matriz trazabilidad |
| `qa/` | Logs type-check, Jest, pytest, lint + resumen visual |

## Checklist de evidencias (16 bloques)

1. **Login** — `capturas/01-login/` (Director, Profesor, Alumno)
2. **Dashboard** — `capturas/02-dashboard/`
3. **Profesores** — listado, detalle, asignaciones, carga académica
4. **Cursos** — listado y asignaciones
5. **Estudiantes** — listado, detalle, mis notas (alumno)
6. **Notas** — bimestre I/II y proceso completo
7. **Predicción IA** — resultado, nivel, probabilidad (`07-prediccion/`)
8. **Dashboard IA** — gráficos, alertas, historial (`08-dashboard-ia/`)
9. **Reportes** — los 4 exportables + vista completa (`09-reportes/`)
10. **Arquitectura** — PNG/SVG en `arquitectura/` y `diagramas/`
11. **Modelo IA** — métricas en `ia/` y `metricas/`
12. **Base de datos** — ER en `base_datos/`
13. **API** — flujo en `api/`
14. **QA** — `qa/` + `capturas/14-qa/`
15. **Calidad ISO 25010** — `iso/MATRIZ-ISO-25010.md`
16. **Entrega** — esta carpeta `evidencias_finales/`

## Regenerar evidencias

Con servicios locales activos:

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
npm run dev:ml     # terminal 3
npm run evidence:generate
```

O paso a paso:

```bash
node scripts/evidence/capture-ui.mjs
node scripts/evidence/capture-supplement.mjs
python scripts/evidence/generate-ml-charts.py
python scripts/evidence/generate-er-diagram.py
python scripts/evidence/generate-architecture-diagrams.py
node scripts/evidence/run-qa.mjs
node scripts/evidence/capture-qa-screens.mjs
node scripts/evidence/generate-iso-matrix.mjs
```

## Notas técnicas

- Capturas UI: Playwright + Microsoft Edge (`channel: msedge`).
- Diagramas: Matplotlib (Graphviz no disponible en este entorno Windows).
- Predicción en servidor requiere seleccionar **Grado + Sección** antes de ejecutar.
- Copias selectivas también en `docs/evidencias/` (subcarpetas legacy).
