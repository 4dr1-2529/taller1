# Pruebas

## Comandos

```bash
# Desde tesis-dashboard/
npm run test              # Unitarios backend (Zod, permisos, formato) + ML Python
npm run test:smoke        # Requiere API :4000 y ML :5000 en ejecución
cd backend && npm run test
cd machine-learning && python tests/test_predict.py
```

## Cobertura unitaria backend

| Archivo | Contenido |
|---------|-----------|
| `backend/tests/schemas.test.ts` | Login, estudiantes, notas, predict, alertas, roles |
| `backend/tests/permissions.test.mjs` | Matriz Director / Profesor / Estudiante |
| `backend/tests/response.test.mjs` | Envelope `success` / `message` / `data` |
| `backend/tests/roles-scope.test.mjs` | Permisos documentados |
| `backend/tests/prediction-format.test.mjs` | Formato tesis español |

## Casos funcionales recomendados

1. Login válido / inválido
2. Permisos por rol (403 en rutas prohibidas)
3. Crear estudiante, profesor, curso (Director)
4. Registrar nota y asistencia (Profesor en su curso)
5. Predecir riesgo bajo / medio / alto (ML `:5000/predict`)
6. Generar alerta tras predicción medio/alto
7. Estudiante sin token → 401
8. Profesor en curso ajeno → 403

## Smoke (integración)

```bash
npm run dev   # en otra terminal
npm run test:smoke
```

Ver también [pruebas-funcionales.md](./pruebas-funcionales.md).
