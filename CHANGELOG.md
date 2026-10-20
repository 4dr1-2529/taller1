# Changelog

## 2026-10-20 — Mantenimiento documental

- `README.md` reescrito como presentación breve y guía básica (commit `7c0f770`): enlaces oficiales
  verificados en vivo (Vercel, Railway API/ML, SonarCloud), arquitectura, requisitos locales y nota sobre
  datos de demostración; se eliminó el detalle extenso reservado al Anexo 07 de la tesis.
- Documentación de SonarCloud actualizada (`docs/sonarqube.md`, `docs/ESTADO_ACTUAL_V6.md`,
  `docs/evidencias/sonarqube/README.md`, `docs/iso-25010/calidad-software.md`): el Quality Gate de `main`
  pasó a **OK** tras la fusión de las correcciones del 2026-09-28 (commits `40d066e` y `b0d5cf5`).
- Correcciones puntuales de precisión técnica: composición real del Stacking V6 (bases Random Forest +
  HistGradientBoosting; XGBoost como candidato independiente) en `docs/ESTADO_ACTUAL_V6.md`,
  `docs/python-ia/modelo-predictivo.md` y `docs/arquitectura/arquitectura-ia.md`; ruta
  `GET /estudiante/prediccion` y contrato ML de 7 variables en `docs/validaciones.md`.

## 2026-09-28 — Correcciones de calidad de código

- `40d066e` fix: resolve BLENKIR Sonar quality gate findings — corrige los issues de New Code que
  sostenían los ratings D del Quality Gate de `main`.
- `b0d5cf5` fix: resolve historical Sonar reliability issues — corrige hallazgos de fiabilidad
  históricos. Resultado: Quality Gate de `main` en OK (verificado 2026-10-20).

## 2026-v2 — 2026-09-19

Registro transaccional, correlativos persistentes, permisos académicos por rol, LMS observado, materiales/actividades, mensajes y avisos separados, siete variables ML, sin fallback ficticio, trazabilidad de predicciones y alertas, scripts legacy desacoplados. Migraciones aditivas y normalización de estado administrativo. No se regeneró el seed de 200 ni se desplegó producción. Resultados de verificación en `docs/ESTADO_ACTUAL_V6.md`.
