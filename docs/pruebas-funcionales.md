# Pruebas funcionales

## Automatizadas (Node / Python)

| Comando | Alcance |
|---------|---------|
| `npm run test:backend` | Validadores, roles, formato predicción |
| `npm run ml:test` | ML predict + features |
| `npm run test:smoke` | API + ML en ejecución (integración) |

## Casos cubiertos

### AUTH
- Login válido / inválido (validators.test.mjs, smoke)

### Estudiantes / profesores / cursos
- CRUD vía Postman (manual) y smoke con director

### Predicción
- Riesgo bajo, medio, alto (ML test + smoke)

### Alertas
- Creación automática en POST `/predict` (riesgo medio/alto)
- PATCH estado (Postman + smoke)

### Roles
- `roles-scope.test.mjs` — matriz permitido/prohibido

## Ejecución local

```bash
npm run db:push
npm run db:seed
npm run db:seed:demo
npm run ml:train
npm run dev
# otra terminal:
npm run test
```
