# Evidencias — SonarQube / SonarCloud

Análisis estático de calidad de código. **Estado del análisis (2026-09-26): el análisis es REAL y fue
ejecutado por CI; el Quality Gate está en FAIL.**

## Estado verificado

| Elemento | Valor |
|----------|-------|
| Proyecto | `4dr1-2529_taller1` (SonarQube Cloud) |
| Análisis en el PR #5 | Ejecutado por GitHub Actions el 2026-09-26T14:06:53Z |
| Resultado Quality Gate | **FAILED** |
| Condición incumplida | `C Reliability Rating on New Code` (se exigía ≥ `A`) |
| Check `SonarCloud Code Analysis` en `main` | `completed` / **`failure`** |
| Análisis nuevo en esta auditoría | **No ejecutado** — no hay `SONAR_TOKEN` autorizado en este entorno; no se modificó ninguna configuración de Sonar |

## Evidencia guardada

| Fichero | Contenido |
|---------|-----------|
| `sonarcloud-estado-20260926.json` | Check runs y combined status de `main` + estado del PR #5 (solo lectura vía API de GitHub) |
| `sonarcloud-quality-gate-pr5-20260926.json` | Comentario del bot de SonarCloud con el Quality Gate del PR #5 |

## Qué guardar aquí

| Tipo | Ejemplo |
|------|---------|
| Estado de checks del análisis | `sonarcloud-estado-YYYYMMDD.json` |
| Comentario del Quality Gate | `sonarcloud-quality-gate-<PR>-YYYYMMDD.json` |
| Capturas de dashboard / issues / coverage | `sonarqube-dashboard.png`, `sonarqube-issues.png`, `sonarqube-coverage.png` |
| Quality Gate PASS | `sonarqube-quality-gate.png` |

## Métricas esperadas

- 0 bugs críticos en producción
- Vulnerabilidades de seguridad resueltas
- Code smells documentados con plan de mejora
- **Quality Gate en PASS** (hoy: FAIL por Reliability Rating on New Code)

## Referencia

[ISO 25010 — Mantenibilidad / Fiabilidad](../../iso-25010/calidad-software.md) ·
[Estado actual V6](../../ESTADO_ACTUAL_V6.md)
