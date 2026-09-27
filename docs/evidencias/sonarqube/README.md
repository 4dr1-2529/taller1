# Evidencias — SonarQube / SonarCloud

Análisis estático de calidad de código. **Estado verificado 2026-09-27: el análisis es REAL y fue
ejecutado por CI; el Quality Gate de `main` sigue en FAIL (D Reliability + D Security).**

## Estado verificado (2026-09-27)

| Ámbito | Head | Análisis | Resultado | Condiciones |
|--------|------|----------|-----------|-------------|
| Proyecto | `4dr1-2529_taller1` (SonarQube Cloud) | — | — | — |
| **PR #5** (ya fusionado) | `1c4f5ae` | GitHub Actions, 2026-09-26T14:06:53Z | **FAILED** | `C Reliability Rating on New Code` (exigía ≥ A) |
| **`main`** tras el squash de PR #5 | `d3c0b80` | GitHub Actions, 2026-09-26T15:24:54Z → 15:26:12Z | **FAILED** (`SonarCloud Code Analysis` = `failure`) | `D Reliability Rating on New Code` **y** `D Security Rating on New Code` (ambos exigían ≥ A) |
| **PR #6** (esta rama) | `0e59217` | GitHub Actions, 2026-09-26 | **PASSED** | ninguna — 7 issues nuevos, 0 Security Hotspots, 0,0 % cobertura y 0,0 % duplicación en código nuevo |

> **Que el PR #6 pase no significa que `main` esté en verde.** El PR #6 es documentación/QA/ISO/
> evidencias/branding: su diff no corrige código de aplicación, por eso su Quality Gate pasa. El estado
> real del repositorio es **FAILED en `main`**. **No se declaró «Sonar resuelto».**

### Issues que sostienen los ratings D de `main`

Fuente: API pública de SonarCloud, rama `main`, `sinceLeakPeriod=true`.

| Métrica | Valor |
|---------|-------|
| Issues de New Code (`BUG` + `VULNERABILITY`) | **27** — 20 `BUG` (14 MAJOR · 6 CRITICAL) y 7 `VULNERABILITY` (1 CRITICAL · 2 MAJOR · 4 MINOR) |
| Introducidos por el PR #5 | **1** — `frontend/src/components/views/LearningView.tsx:157` (`typescript:S9011`); `git blame` → línea del commit `d3c0b80` |
| Preexistentes al PR #5 | **26** — el PR #5 solo tocó 58 ficheros, todos en `frontend/`; el resto: `backend/scripts` 16, `backend/tests` 6, `backend/prisma` 2, `machine-learning/app` 1, `scripts/` 1 |
| Front/New Code de `main` | arranca a inicios de junio de 2026 (frontera: ≤ 2026-06-05 fuera; ≥ 2026-06-09 dentro) — **no equivale a «código del PR #5»** |

No se modificó el Quality Gate, no se marcó ningún issue como falso positivo y no se relanzó ningún
análisis (no hay `SONAR_TOKEN` en este entorno).

## Evidencia guardada

| Fichero | Contenido |
|---------|-----------|
| `sonarcloud-estado-20260926.json` | Check runs y combined status de `main` + estado del PR #5 (solo lectura vía API de GitHub) |
| `sonarcloud-quality-gate-pr5-20260926.json` | Comentario del bot de SonarCloud con el Quality Gate del PR #5 |
| `sonarcloud-main-newcode-issues-20260927.json` | **27 issues de New Code de `main`** (regla, severidad, fichero, línea, mensaje, primera detección y origen PR#5/preexistente) + condiciones del Quality Gate + frontera del periodo de New Code |
| `sonarcloud-estado-pr6.json` | Checks y estado del PR #6 (esta rama, documentación): SonarCloud `success`, `validate` `success`, Vercel `success` |

## Qué guardar aquí

| Tipo | Ejemplo |
|------|---------|
| Estado de checks del análisis | `sonarcloud-estado-YYYYMMDD.json` |
| Comentario del Quality Gate | `sonarcloud-quality-gate-<PR>-YYYYMMDD.json` |
| Issues de una rama (con origen) | `sonarcloud-<rama>-issues-YYYYMMDD.json` |
| Capturas de dashboard / issues / coverage | `sonarqube-dashboard.png`, `sonarqube-issues.png`, `sonarqube-coverage.png` |
| Quality Gate PASS | `sonarqube-quality-gate.png` |

## Métricas esperadas

- 0 bugs críticos en producción
- Vulnerabilidades de seguridad resueltas
- Code smells documentados con plan de mejora
- **Quality Gate en PASS** (hoy: FAIL en `main` por `D Reliability` y `D Security` on New Code)

## Pendiente fuera del alcance de este PR

Corregir los 27 issues en una rama **`fix/sonar-main-quality-gate`**, a crear **después** de fusionar el
PR #6. Este PR (#6) conserva su alcance: documentación, QA, ISO, evidencias y branding.

## Referencia

[ISO 25010 — Mantenibilidad / Fiabilidad](../../iso-25010/calidad-software.md) ·
[Estado actual V6](../../ESTADO_ACTUAL_V6.md)
