# SonarQube

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
