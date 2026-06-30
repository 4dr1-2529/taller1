# Plan general de pruebas — ISO/IEC 29119

**Proyecto:** Tesis Dashboard v2.0  
**Ejecución:** `npm run qa:pipeline` · `2026-06-30`  
**Matriz:** 86 casos en `matriz-pruebas/matriz-casos.xlsx`

---

## 1. Objetivo

Validar de forma **ejecutable y trazable** el sistema educativo predictivo (Next.js + Express + Prisma/MySQL + FastAPI ML) con datos demo reales: 660 estudiantes, 23 profesores, notas bimestre I–II, predicción de riesgo y RBAC en 3 roles.

## 2. Alcance

| Capa | Incluido |
|------|----------|
| Backend API | ~96 rutas `backend/src/routes/index.ts` |
| Frontend | Shell, login, dashboards, notas, predicción, reportes |
| Base de datos | MySQL local `tesis_dashboard`, Prisma 52 modelos |
| IA | Random Forest + XGBoost + Stacking (`machine-learning/`) |
| Seguridad | JWT, RBAC admin/docente/estudiante |

**Fuera de alcance:** Railway, Vercel, despliegue cloud (solo ambiente local).

## 3. Ambiente local

| Servicio | URL | Comando |
|----------|-----|---------|
| MySQL (XAMPP) | `localhost:3306` | `DATABASE_URL=mysql://root@localhost:3306/tesis_dashboard` |
| API | `http://localhost:4000/api/v1` | `npm run dev:api` |
| Web | `http://localhost:3029` | `npm run dev:web` |
| ML | `http://localhost:5000` | `npm run dev:ml` |

**Datos:** `npm run db:seed` + `npm run db:seed:demo`  
**Credenciales:** `director@blenkir.edu.pe` · `pro50000001@blenkir.edu.pe` · `mateo.quispe0001@blenkir.edu.pe` · contraseña `DEMO_PASSWORD` en `backend/.env`

## 4. Herramientas

| Herramienta | Uso |
|-------------|-----|
| Node `--test` / `tsx --test` | Unitarias backend |
| `pytest` (`npm run ml:test`) | Unitarias IA |
| `plan-pruebas/scripts/run-api-tests.mjs` | Caja negra + seguridad + integración HTTP |
| `plan-pruebas/scripts/run-performance.mjs` | Tiempos API (3 muestras) |
| Playwright + Edge | Capturas UI 3 roles |
| `plan-pruebas/scripts/run-whitebox.mjs` | Auditoría código + cobertura validaciones |
| `npm run type-check` / `build` / `test` | Validación final monorepo |

## 5. Estrategia (ISO 29119)

1. **Análisis** — Inventario rutas, roles, schemas Zod, features ML.
2. **Diseño** — Matriz 86 casos con trazabilidad a archivos reales.
3. **Implementación** — Scripts en `plan-pruebas/scripts/` (no documentación vacía).
4. **Ejecución** — Pipeline local con evidencias JSON/PNG/logs.
5. **Cierre** — `REPORTE-FINAL-PRUEBAS.md` + matriz actualizada.

## 6. Roles probados

| Rol | Usuario demo | Secciones UI |
|-----|--------------|--------------|
| Director (admin) | director@blenkir.edu.pe | 14 |
| Profesor (docente) | pro50000001@blenkir.edu.pe | 10 |
| Alumno (estudiante) | mateo.quispe0001@blenkir.edu.pe | 6 |

## 7. Módulos probados

Login · Dashboard (3 roles) · Usuarios/Estudiantes · Profesores · Cursos · Asignaciones · Notas B1/B2 · Asistencia · Predicción IA · Alertas · Reportes · Seguridad JWT/RBAC · Métricas ML

## 8. Criterios de entrada

- MySQL activo con schema migrado.
- Seed demo ejecutado (660 estudiantes).
- API :4000, Web :3029, ML :5000 respondiendo `GET /health` → 200.
- `npm install` completado en raíz del monorepo.

## 9. Criterios de salida

| ID | Criterio | Evidencia |
|----|----------|-----------|
| CS-01 | `npm run test` → 0 fallos | `evidencias-finales/terminal/test.log` |
| CS-02 | `npm run type-check` → 0 errores | `evidencias-finales/terminal/type-check.log` |
| CS-03 | `npm run build` → OK | `evidencias-finales/terminal/build.log` |
| CS-04 | Smoke API 4/4 | `pruebas-unitarias/evidencias/smoke-tests.log` |
| CS-05 | Login 3 roles API 200 | `evidencias-finales/api/login-*.json` |
| CS-06 | Seguridad 401/403 verificada | `pruebas-seguridad/evidencias/` |
| CS-07 | Capturas UI director+profesor+alumno | `evidencias-finales/capturas/` |
| CS-08 | Matriz ≥70 casos sin campos vacíos | `matriz-pruebas/matriz-casos.xlsx` |

## 10. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| MySQL no iniciado | Verificar XAMPP antes del pipeline |
| ML sin modelo | `npm run ml:train` |
| Capturas fallan sin Edge | Playwright `channel: msedge` |
| Tiempos variables por hardware | Umbrales documentados en reporte rendimiento |

## 11. Evidencias requeridas

Todas bajo `plan-pruebas/`:

- `evidencias-finales/capturas/` — PNG por módulo y rol
- `evidencias-finales/api/` — Respuestas HTTP
- `evidencias-finales/terminal/` — type-check, build, test
- `pruebas-*/evidencias/` — Por tipo de prueba
- `REPORTE-FINAL-PRUEBAS.md` — Resumen ejecutivo

**Comando único:** `npm run qa:pipeline`
