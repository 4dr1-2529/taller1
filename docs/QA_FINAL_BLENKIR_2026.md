# QA Final Blenkir 2026 — visual + funcional

Fecha: 2026-09-21. Commit base: `7f0b27c` (CI run 39 completed/success).
Entorno: backend local :4000 + frontend local :3029 + MySQL aislada 127.0.0.1:33316
(`blenkir_refactor_test`) + Chrome del sistema vía Playwright. Sin producción, sin seed.

## Matriz rol×pantalla×viewport (barrido crawler: click real por cada sección del sidebar)

- Desktop 1440×900 light: 46 pantallas (20 director, 15 profesor, 11 estudiante) — 0 errores
  de consola, 0 responses 5xx, 0 overflow horizontal.
- Desktop 1440×900 dark: 46 pantallas — 0 incidencias, contraste verificado por captura.
- Móvil 390×844: 46 pantallas — 0 incidencias (drawer, tablas con scroll, KPI 2-col).
- Tablet 768×1024: dashboard + drawer — overflow 0, 0 errores.
- Login desktop/móvil: inputs visibles, labels, loading, error profesional con clave mala.

## Flujos probados (con fixtures efímeros: 1 admin, 2 docentes, 3 estudiantes, notas,
## asistencia y mensajería creadas por API real)
Login 3 roles; dashboards con datos reales (18/20 mixto, 0/20 real, — sin datos, 100% real);
matrícula única y "Ya matriculado en 2026"; retiro/traslado con historial; reasignación con
ConfirmDialog (endpoint único); notas 0–20 + recálculo vía API (promedio 0, asistencia 100);
asistencia semántica; materiales/actividades por scope; mensajería separada de avisos;
predicción 503 sin modelo (UI "no disponible") y 409 sin datos; alertas vacías honestas;
reportes con "Sin predicción"; auditoría solo director; configuración con inputs visibles y
persistencia real (`systemConfig`); notificaciones propias; scopes A↔B verificados en integración.

## Errores encontrados y correcciones
1. Resumen persistido desactualizado al sembrar por SQL directo (artefacto de fixture, no bug):
   verificado vía API real (bulk asistencia → promedio 0, asistencia 100).
2. Crawler móvil inicial colgado por clicks en nav oculta → drawer-first + timeout acotado.
3. Etiquetado light/dark invertido por toggle en contexto fresco → renombrado a evidencia correcta
   (default light; dark conmutado). Ningún cambio de código requerido en los tres casos.

## Consola / network
0 `console.error`, 0 `pageerror`, 0 hydration warnings, 0 responses 5xx en 139 pantallas.
401/403/409/503 solo los intencionales de matrices de seguridad (cubiertos en integración).

## Datos ficticios — barrido final
Sin `Math.random`/mocks/fallbacks en UI activa. Fallbacks numéricos existentes solo operan con
predicción persistida real y nunca se renderizan sin ella ("Sin predicción"). Sin cantidades,
riesgos, promedios ni nombres institucionales inventados.

## Suites finales
type-check ✓ · lint ✓ · backend 27+32/32 · integración 31/31 · frontend 10/10 · ML 7/7 ·
prisma validate ✓ (schema válido, 57 modelos) · build backend ✓ · build frontend ✓.

## Evidencia visual
`C:/Users/HP/AppData/Local/Temp/opencode/qa-final/` (138 capturas: desktop light/dark, móvil,
tablet) + `visual/` (Fase 11/11.1). No commiteadas al repo por ser temporales.

## Limpieza
Fixtures eliminados, scripts efímeros borrados, servidores apagados, BD aislada en 0/0/0/0.

## Pendientes
Ninguno funcional. Pulido futuro: pantallas secundarias con datos del seed, light-mode fino.

## Veredicto
`QA funcional y visual final completado. El sistema queda habilitado para preparar Data Seed V2.`
(No se ejecutó el seed.)
