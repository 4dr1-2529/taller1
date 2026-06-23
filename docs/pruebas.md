# Producción (Vercel + Railway)

Con servicios desplegados:

| Check | URL / acción |
|-------|--------------|
| Health backend | `GET https://taller1-production.up.railway.app/health` |
| Login web | https://taller1-frontend.vercel.app |
| Director | `director@blenkir.edu.pe` / `mbappe29` |
| Profesor | `profesor1@blenkir.edu.pe` / `mbappe29` |
| Estudiante | `estudiante0001@blenkir.edu.pe` / `mbappe29` |

Verificar por rol:

1. Dashboard carga sin F5 ni 401 en consola del navegador
2. Estudiante no puede acceder a rutas `/students` (403)
3. Profesor solo ve sus secciones en filtros

Seed en BD vacía (consola Railway): `npm run db:seed --workspace=backend && npm run db:seed:demo --workspace=backend`

Guía: [DEPLOY.md](DEPLOY.md)

---

## Comandos

```bash
# Desde tesis-dashboard/
npm run type-check        # TypeScript frontend + backend
npm run test              # Unitarios backend + ML Python
npm run test:backend      # Solo backend (58 tests aprox.)
npm run test:smoke        # Requiere API :4000 y ML :5000 en ejecución
npm run lint              # ESLint frontend

cd backend && npm run test
cd machine-learning && python tests/test_predict.py
```

## Cobertura unitaria backend

| Archivo | Contenido |
|---------|-----------|
| `backend/tests/schemas.test.ts` | Login, estudiantes, notas, predict, alertas, roles |
| `backend/tests/validation-fields.test.ts` | DNI, teléfono, notas, nombres sin dígitos |
| `backend/tests/teacher-scope.test.ts` | Alcance profesor por sección de curso |
| `backend/tests/estudiante-scope.test.ts` | Rechazo studentId ajeno, estados de nota |
| `backend/tests/roles-profesor.test.mjs` | Visibilidad docente |
| `backend/tests/roles-estudiante.test.mjs` | Endpoints y filtros estudiante |
| `backend/tests/permissions.test.mjs` | Matriz Director / Profesor / Estudiante |
| `backend/tests/response.test.mjs` | Envelope `success` / `message` / `data` |
| `backend/tests/prediction-format.test.mjs` | Formato tesis español |

## Casos funcionales recomendados

### Director
1. Login `director@blenkir.edu.pe`
2. CRUD estudiante, profesor, curso, matrícula
3. Dashboard con totales institucionales
4. Predicción y alertas globales

### Profesor
5. Login `profesor1@blenkir.edu.pe`
6. Filtros grado → sección → Buscar en Notas/Asistencia/LMS
7. Registrar nota y asistencia solo en sus salones
8. Profesor en curso ajeno → 403

### Estudiante
9. Login `estudiante0001@blenkir.edu.pe`
10. Dashboard personal (sin totales globales)
11. Mis notas / asistencia / LMS / riesgo — solo datos propios
12. `GET /students` o `/profesor/dashboard` → 403
13. Enviar `?studentId=otro` en `/estudiante/notas` → 403

### General
14. Login inválido → 401
15. Predicción medio/alto genera alerta
16. Smoke: `npm run test:smoke` con servicios levantados

## Smoke (integración)

```bash
npm run dev   # en otra terminal
npm run test:smoke
```

Ver también [pruebas-funcionales.md](./pruebas-funcionales.md) y [pruebas-no-funcionales.md](./pruebas-no-funcionales.md).
