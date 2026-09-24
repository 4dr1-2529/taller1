# Pendientes pre Data Seed 200

Criterio: solo entra aquí lo que bloquee generar datos sintéticos de QA. Estado a `bc04e46`
más rama `audit/full-functional-review` (solo documentación hasta ahora).

## Cerrado (verificado)
- [x] Roles, permisos y scopes por rol (matriz completa + integración 20/20)
- [x] Matrícula única 2026 + flujo transaccional + retiro/traslado
- [x] Correlativos seguros EST/PROF/MAT-2026
- [x] Notas/asistencia/LMS derivados, sin métricas manuales
- [x] Vector ML 7 vars + contrato FastAPI + 503 controlado
- [x] Mensajería y avisos con matriz 403
- [x] Formularios, validaciones, anti-doble-submit, paginación, búsquedas reales
- [x] Textos legacy eliminados de UI activa; agregados sin ficción
- [x] Suites verdes: backend 27+32, frontend 10/10, ML 7/7, integración 30/30, builds
- [x] Fases 5–10 flujos end-to-end: auth/sesión/cuentas, director, profesor, estudiante,
  transversales y escenarios A–F verificados (ver `docs/AUDITORIA_FLUJOS_END_TO_END_2026.md`)
- [x] Fase 11 UI/UX: design system consolidado, shell por rol, encabezados/diálogos estándar,
  formularios visibles, datos honestos (ver `docs/UI_UX_BLENKIR_2026.md`)
- [x] FASE 4 reglas de negocio: bypass PUT docente cerrado, reasignación única coherente,
  traslado documentado como externo, fórmulas promedio/asistencia/LMS y dedup de alertas
  (estudiante+nivel+abierta) verificadas contra código + tests

## Abierto (no bloqueante para el seed salvo 1)
1. Barrido visual interactivo por rol × viewport — requiere navegador con sesión (este entorno
   no tiene browser conectado). Hacerlo antes de la exposición, no del seed.
   **Estado 2026-09-24:** sustituido provisionalmente por un **smoke por API** contra producción
   (67/67: 3 logins V5, 42 endpoints permitidos y 15 denegados, 0 predicciones fabricadas).
   El barrido visual en navegador real sigue **PENDIENTE** (navegador de escritorio desconectado;
   no se ejecutó porque las contraseñas por rol no estaban en variables de entorno locales).
2. Servicio ML en producción — requiere dataset autorizado; PROHIBIDO entrenar con sintéticos.
   El seed v2 debe generarse igualmente (los perfiles funcionales variados servirán al pipeline futuro).
3. Limpieza opcional: rama remota `origin/fix/final-hardening-pre-seed` (huérfana, sin efecto).
4. `docs/tesis/PLAN-NUEVO-DATA-SEED-200.md` debe actualizarse con el manifiesto v2 al generarlo.

## Condición para generar el Data Seed v2
QA funcional y visual final completado. El sistema queda habilitado para preparar Data Seed V2.
Base funcional ampliamente estabilizada; profesionalización UI/UX, QA y alineamiento documental
concluidos. El seed debe crearse en
rama dedicada, solo contra BD aislada, con datos 100% sintéticos rotulados, sin predicciones
ficticias y sin tocar producción.
