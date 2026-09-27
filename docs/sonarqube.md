# SonarQube

## Estado real del Quality Gate (verificado 2026-09-27)

Análisis ejecutado por CI (SonarQube Cloud, proyecto `4dr1-2529_taller1`). Hay **tres resultados
distintos** que no deben confundirse:

| Ámbito | Head | Resultado | Condiciones |
|--------|------|-----------|-------------|
| PR #5 (ya fusionado) | `1c4f5ae` | FAILED | `C Reliability Rating on New Code` (exigía ≥ A) |
| `main` (tras el squash de PR #5) | `d3c0b80` | **FAILED** | `D Reliability Rating on New Code` **y** `D Security Rating on New Code` (ambos exigían ≥ A) |
| PR #6 (documentación) | `0e59217` | PASSED | 7 issues nuevos, 0 Security Hotspots, 0,0 % cobertura y 0,0 % duplicación en código nuevo |

- **Que el PR #6 pase el Quality Gate no significa que `main` esté en verde**: su diff es documentación,
  QA, ISO, evidencias y branding, sin código funcional nuevo.
- Los ratings D de `main` los sostienen **27 issues de New Code** (20 `BUG`: 14 MAJOR · 6 CRITICAL;
  7 `VULNERABILITY`: 1 CRITICAL · 2 MAJOR · 4 MINOR). **1** fue introducido por el PR #5
  (`frontend/src/components/views/LearningView.tsx:157`, `typescript:S9011`, confirmado con `git blame`)
  y **26 son preexistentes** (el PR #5 solo tocó 58 ficheros, todos de `frontend/`).
- Detalle completo: `docs/evidencias/sonarqube/sonarcloud-main-newcode-issues-20260927.json` ·
  resumen: `docs/evidencias/sonarqube/README.md`.
- No se modificó el Quality Gate, no se marcó ningún issue como falso positivo y no se relanzó ningún
  análisis (no hay `SONAR_TOKEN` en este entorno). La corrección de esos issues queda pendiente en una
  rama separada **`fix/sonar-main-quality-gate`**, a crear después de fusionar el PR #6.

## Instalaciones reproducibles y contenedor ML

- CI usa `npm ci --ignore-scripts` y genera el cliente Prisma de forma explícita con `npm run prisma:generate`.
- CI y Docker instalan `machine-learning/requirements.lock` con `--only-binary=:all: --require-hashes`: se verifican las versiones y hashes de todas las dependencias y solo se permiten wheels.
- El contenedor ejecuta el servicio con el usuario `app` (UID 10001), sin privilegios de root. El código y los modelos permanecen de solo lectura para ese usuario.

Después de cambiar `machine-learning/requirements.txt`, regenerar el lock desde la raíz con uv 0.8.22 y revisar el diff:

```bash
uv pip compile machine-learning/requirements.txt --universal --python-version 3.12 --only-binary :all: --generate-hashes --output-file machine-learning/requirements.lock
python -m pip install --only-binary=:all: --require-hashes -r machine-learning/requirements.lock
npm run ml:test
```

Un nuevo análisis de SonarQube Cloud debe confirmar el cierre de los hallazgos después del push.

## Configuración

Archivo raíz: `sonar-project.properties`

```bash
sonar-scanner -Dproject.settings=sonar-project.properties
```

## Fuentes analizadas

- `backend/src`
- `frontend/src`
- `machine-learning/app`, `machine-learning/utils`

## Exclusiones

| Patrón | Motivo |
|--------|--------|
| `**/node_modules/**` | Dependencias |
| `**/.next/**`, `**/dist/**`, `**/build/**` | Artefactos compilados |
| `**/coverage/**` | Reportes de cobertura |
| `**/venv/**`, `**/.venv/**`, `**/__pycache__/**` | Python virtualenv |
| `**/.env`, `**/.env.*` | Secretos |
| `**/*.joblib`, `**/models/**` | Modelos ML binarios |
| `**/prisma/migrations/**` | SQL generado |
| `**/database/**` | Scripts SQL de referencia |

## Checklist antes del análisis

- [ ] `npm run test` sin fallos (backend + ML)
- [ ] `npm run lint` en frontend
- [ ] `npm run type-check` en backend y frontend
- [ ] Sin `console.log` de depuración en `src/`
- [ ] Variables sensibles solo en `.env` (no en código)
- [ ] Respuestas API con envelope `success` / `message` / `data`
- [ ] (Opcional) Generar LCOV: `frontend/coverage/lcov.info`, `backend/coverage/lcov.info`

## Objetivos de calidad

- Reducir **Bugs** y **Vulnerabilidades**
- Bajar **Code Smells** y **duplicación**
- Mantener complejidad ciclomática razonable en controllers

## Cobertura (opcional)

Rutas en `sonar.javascript.lcov.reportPaths`. Generar con herramienta de cobertura antes de `sonar-scanner`.
