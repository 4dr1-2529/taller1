# Main Release Readiness 2026 — cierre profesional pre-Data Seed

## Cierre de matrícula elegible — 2026-09-21
- Commit funcional validado y promovido a `main`: `a23f547f6de01b6ceec4c0934ffcee80b4a4528a`.
- El selector de Nueva matrícula ofrece únicamente estudiantes sin ninguna matrícula 2026;
  también excluye matrículas retiradas y trasladadas.
- Tras una matrícula exitosa se actualizan estadísticas y tabla, se limpia el estudiante y,
  si era el último candidato, aparece `No hay estudiantes pendientes de matrícula` sin F5.
- El botón de registro queda deshabilitado sin candidatos y mantiene protección contra doble envío.
- Retiro y traslado usan `ConfirmDialog`; conserva Escape, trampa/restauración de foco y bloqueo
  de cierre mientras procesa. La tabla mantiene sus acciones y columnas breves legibles.
- El backend no fue modificado: conserva la autoridad y responde HTTP 409 ante una segunda
  matrícula 2026 activa, retirada o trasladada.
- Pulido adicional recuperado: pluralización correcta de `alerta activa` en el sidebar.

## Validación del cierre
- Prisma validate: válido; 57 modelos; sin cambios de schema ni migraciones.
- Type-check compartido + frontend + backend: correcto.
- Lint frontend: correcto.
- Backend: 27 + 32/32.
- Integración aislada: 32/32, incluida la garantía HTTP 409.
- Frontend: 13/13, incluidos tres casos de elegibilidad y estado vacío.
- ML: 7/7.
- Build backend y frontend: correctos.
- Búsqueda de datos falsos revisada; sin métricas inventadas nuevas. Se preservaron los fixes de
  promedios honestos y `ultimaActividadLms = { fecha, tipo, minutos }`.

## QA visual del cierre
- Base local aislada `127.0.0.1:33316/blenkir_refactor_test`, eliminada al terminar; producción
  no fue modificada.
- Escenario: 9 estudiantes matriculados y 1 pendiente. Los cuatro viewports mostraron solo
  `EST-010 — Alumno PendienteJ`: 1440x900, 1366x768, 768x1024 y 390x844.
- Después del alta, sin F5: estado vacío, botón deshabilitado y tabla con 10 matrículas.
- Light/dark sin overflow horizontal; consola, `pageerror` y respuestas HTTP 500 inesperadas: 0.
- `ConfirmDialog` móvil: texto, foco inicial, Escape y restauración de foco verificados.

## CI y despliegues del cierre
- GitHub Actions run `35644440146`: `completed / success` para `a23f547`.
- Vercel: estado GitHub `success`, deployment completado. `/login` responde 200 y renderiza el
  acceso sin overlay ni errores de consola.
- Railway: estado GitHub `success` con `No deployment needed - watched paths not modified`, ya que
  el commit solo cambia frontend. Sin embargo, el dominio configurado
  `taller1-production.up.railway.app` responde 404 `Application not found` en `/health` y
  `/api/v1/health`; no fue posible validar login autenticado ni dashboards productivos.
- Data Seed V2, Excel V2, entrenamiento ML y predicciones sintéticas: NO ejecutados.

## Veredicto actual
`MAIN NO LISTO PARA DATA SEED V2 — pendientes: restaurar el dominio/servicio Railway y repetir el smoke productivo autenticado por roles.`

## Cadena de promoción
- SHA main anterior: `bc04e468a9842f96591f5e42b5dd26f2f48ea809`
- 6 commits promovidos por fast-forward (sin squash, sin force):
  `e04887f`, `101d68a`, `73f9c0b`, `c2af9ff`, `7f0b27c`, `06c96ba`
- Diff main→audit antes del merge: 36 archivos, +1209/−98 (backend, frontend, tests, docs).
- Merge-base verificado: `bc04e46`; audit descendiente directo; `origin/main` sin movimientos ajenos.

## Fix adicional sobre main (hallazgo P1 del smoke visual)
Smoke desde main detectó `undefined%`/`NaN%`/timestamp crudo en "Última actividad LMS" del
dashboard estudiante: el backend enviaba `{semana: ISO}` sin `actividadPct` y el frontend lo
renderizaba. Corrección honesta (sin métrica inventada):
- `estudiante.service.ts`: `ultimaActividadLms = { fecha, tipo, minutos }`.
- `StudentDashboard.tsx`: "Tipo · fecha es-PE · minutos" + etiquetas de tipo LMS; sin barra NaN.
- Test de regresión en integración (contrato sin `actividadPct`/`semana`).

## Validaciones sobre main (reales, no heredadas)
- Prisma validate: schema válido, 57 modelos, sin migraciones nuevas.
- type-check ✓ · lint ✓.
- Backend 27+32/32 · integración 32/32 (incluye matrícula, reasignación, PUT docente,
  traslado, retiro, auth, dashboard evidencia real, actividad LMS honesta).
- Frontend 10/10 · ML 7/7 · build backend ✓ · build frontend ✓.
- Smoke visual desde main: 3 roles × desktop/móvil + dark, 0 errores inesperados.

## Deployment
Observar únicamente builds/health de Vercel/Railway tras el push. Sin seeds, sin migraciones
destructivas, sin tocar BD productiva.

## BD
Sin cambios de schema ni migraciones en toda la promoción. BD de QA limpia (0/0/0/0).

## Data Seed
Todavía NO ejecutado. Main queda como base oficial para iniciarlo.

## Auditoría de infraestructura productiva - 2026-09-21
- Git inspeccionado en `main`, limpio y sincronizado con `origin/main` en
  `f8c9d0f08e25643a67d9071fc87119914ecc951b` antes de esta actualización documental.
- Railway CLI confirma el proyecto `TALLER1`, entorno `production`, servicio `backend` en línea,
  repositorio `4dr1-2529/taller1` y branch `main`. MySQL y su volumen existentes siguen en línea;
  no se creó otra base ni se ejecutó seed, reset, `db push`, `DROP` o `TRUNCATE`.
- Causa del incidente: el dominio Railway cambió. El dominio anterior
  `taller1-production.up.railway.app` quedó huérfano y responde 404 `Application not found`;
  el servicio no fue eliminado ni pausado.
- URL Railway vigente: `https://backend-production-fcb1.up.railway.app`.
- `GET /health`: HTTP 200, `{"ok":true,"service":"tesis-dashboard-api"}`.
- `GET /api/v1/health`: HTTP 200, servicio `tesis-api`, versión `2.0.0`.
- Health verificado el 2026-09-21 a las 19:54 UTC. CORS devuelve exactamente
  `Access-Control-Allow-Origin: https://taller1-frontend.vercel.app`.
- Deployment Railway vigente: `success`; una réplica activa, puerto inyectado `8080`, build y
  `start:prod` según `railway.toml`. Las variables requeridas existen; sus valores no se expusieron.
- Vercel: `/login` responde HTTP 200. El bundle productivo usa
  `https://backend-production-fcb1.up.railway.app/api/v1`; no conserva llamadas al dominio viejo,
  por lo que no se modificaron variables ni se forzó un redeploy.
- Smoke público: frontend 200 y ambos health 200, sin CORS roto.
- Smoke autenticado por roles: pendiente. `DEMO_PASSWORD` existe en Railway, pero no autentica las
  cuentas director históricas contempladas por el proyecto. No se cambiaron contraseñas ni datos
  para sortear este control. Director, profesor y estudiante requieren credenciales productivas
  vigentes antes de validar sus vistas, consola y red de extremo a extremo.
- ML no fue entrenado y no se generaron predicciones ficticias.

## Veredicto de infraestructura - 2026-09-21
`MAIN NO LISTO PARA DATA SEED V2 - pendiente: proporcionar o sincronizar de forma autorizada una cuenta productiva válida por rol y completar el smoke autenticado de Director, Profesor y Estudiante.`

## Certificación final del smoke productivo - 2026-09-21
- Base certificada antes de esta actualización documental: `df87b213db4600d06eddb4e16ca0f0b5f2fef9f6`;
  CI `35649060086` en `completed / success`.
- Se inspeccionó únicamente metadata no sensible. La población productiva actual está rotulada de
  forma inequívoca como demo: correos `.demo`, códigos académicos `DEMO-*` y creación en bloque.
- Se seleccionaron exactamente tres cuentas QA activas: usuario `1` (Director), usuario `2`
  (Profesor con curso, sección y estudiantes dentro de scope) y usuario `5` (Estudiante con
  matrícula e inscripción). No se modificaron emails, roles ni relaciones académicas.
- Se creó `SMOKE_PASSWORD` segura en Railway y se sincronizaron exclusivamente esos tres IDs con
  bcrypt de 12 rondas. La contraseña, hashes, tokens y secretos no se imprimieron ni documentaron.
- Railway deployment `3b847ac4-a673-463a-8f6f-583dff55d4a0`: `SUCCESS`.
- Backend vigente: `https://backend-production-fcb1.up.railway.app`; health HTTP 200.
- Vercel vigente: `https://taller1-frontend.vercel.app`; `/login` y los tres paneles renderizan sin
  overlay de error y consumen únicamente el dominio Railway vigente.
- Director: login, dashboard, estudiantes, profesores, matrícula 2026, cursos, grados/secciones,
  alertas, mensajes y configuración verificados.
- Profesor: login, dashboard, cursos y secciones asignadas, estudiantes de scope, notas,
  asistencia, materiales, actividades, LMS, alertas y mensajes verificados. El acceso global y a
  un estudiante fuera de scope fue rechazado con HTTP 403.
- Estudiante: login, dashboard propio, notas, asistencia, materiales, actividades, actividad LMS,
  mensajes y avisos verificados. El acceso a otro estudiante fue rechazado con HTTP 403.
- Consola/red para los tres roles: 0 `pageerror`, 0 errores JS, 0 HTTP 500, 0 errores CORS,
  0 llamadas al dominio Railway anterior, localhost o endpoints legacy, 0 `undefined`, 0 `NaN`.
- Los scripts temporales fueron eliminados. No quedaron contraseñas, hashes, tokens, dumps ni
  capturas sensibles en el repositorio.
- No se ejecutó Data Seed, no se entrenó ML y no hubo cambios de schema, migraciones, reset,
  `DROP`, `TRUNCATE` ni creación de datos académicos.

## Veredicto final pre-Data-Seed - 2026-09-21
`MAIN COMPLETO, VALIDADO Y LISTO PARA DATA SEED V2`
