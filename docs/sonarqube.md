# SonarQube

## Configuración

Archivo: `sonar-project.properties` (raíz del monorepo).

## Análisis externo (no ejecutado en CI por defecto)

```bash
# Ejemplo con SonarScanner CLI instalado localmente
sonar-scanner -Dproject.settings=sonar-project.properties
```

## Objetivos de calidad

- Reducir bugs y vulnerabilidades en `backend/src` y `frontend/src`.
- Controlar duplicación y code smells.
- Aumentar cobertura con `npm run test` antes del análisis.

## Cobertura (opcional)

Generar LCOV si se configura Vitest/Jest en frontend:

```bash
# futuro: npm run test:coverage --workspace=frontend
```

Rutas esperadas en `sonar-project.properties`:

- `frontend/coverage/lcov.info`
- `backend/coverage/lcov.info`

## Exclusiones

- `node_modules`, `.next`, `dist`
- Modelos `.joblib` y carpeta `machine-learning/models/`
