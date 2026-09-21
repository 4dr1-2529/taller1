# Main Release Readiness 2026 — promoción auditada + fix P1 de smoke

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
