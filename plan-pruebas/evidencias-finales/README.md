# Evidencias finales — QA local

Capturas **reales** generadas con Playwright (Microsoft Edge) contra el stack en ejecución.

**Fecha de última generación:** ver `resultados/capturas-manifest.json`

---

## Verificación del stack

| Componente | Resultado | Evidencia |
|------------|-----------|-----------|
| Frontend `:3029` | HTTP 200 | `resultados/verificacion-stack.json` |
| Backend `:4000` | `/api/v1/health` OK | idem |
| Base de datos | Login `director@blenkir.edu.pe` + `GET /students` | idem |
| IA `:5000` | `/health` + `/predict` | `ia/health-ml.json`, `ia/metricas-ml.json` |

---

## Estructura de capturas

| Carpeta | Módulo UI | Archivo |
|---------|-----------|---------|
| [login/](login/) | Pantalla de acceso | `login.png` |
| [dashboard/](dashboard/) | Dashboard director | `dashboard.png` |
| [profesores/](profesores/) | `TeachersView` | `profesores.png` |
| [cursos/](cursos/) | `CoursesView` | `cursos.png` |
| [estudiantes/](estudiantes/) | `StudentsView` | `estudiantes.png` |
| [usuarios/](usuarios/) | Gestión usuarios (estudiantes) | `usuarios-estudiantes.png` |
| [notas/](notas/) | `GradesView` | `notas.png` |
| [prediccion/](prediccion/) | `PredictionView` | `prediccion.png` |
| [alertas/](alertas/) | `AlertsView` | `alertas.png` |
| [reportes/](reportes/) | `ReportsView` | `reportes.png` |
| [configuracion/](configuracion/) | `TeacherAssignmentsView` | `configuracion-asignaciones.png` |
| [ia/](ia/) | Métricas servicio ML | `metricas-ml.json`, `health-ml.json` |
| [resultados/](resultados/) | Logs QA | `verificacion-stack.json`, `capturas-manifest.json` |

---

## Trazabilidad normativa

| Norma | Documento |
|-------|-----------|
| ISO/IEC 25010 | `docs/iso-25010/calidad-software.md` |
| ISO 9001 | `docs/iso-9001/macroproceso-academico.md` |
| ISO/IEC 29119 | `docs/iso-29119/plan-pruebas.md` |
| Índice cruzado | `matriz-pruebas/trazabilidad.md` |

---

## Regenerar (local)

```bash
# 1. MySQL XAMPP + datos demo
$env:DATABASE_URL="mysql://root@localhost:3306/tesis_dashboard"
cd backend && npx prisma db push && npm run db:seed && npm run db:seed:demo

# 2. Servicios (3 terminales o npm run dev)
npm run dev:ml    # :5000
npm run dev:api   # :4000
npm run dev:web   # :3029

# 3. Evidencias
npm run evidence:generate
```

**Credenciales captura:** `director@blenkir.edu.pe` / `DEMO_PASSWORD` (`backend/.env`)

---

## Scripts

- `scripts/evidence/verify-stack.mjs` — health backend, BD, ML
- `scripts/evidence/capture-ui.mjs` — screenshots Edge
- `scripts/evidence/run-all.mjs` — pipeline completo
