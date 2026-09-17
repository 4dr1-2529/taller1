# SonarQube

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
