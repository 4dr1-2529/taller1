# Producción (Vercel + Railway)

Con servicios desplegados:

| Check | URL / acción |
|-------|--------------|
| Health backend | `GET https://backend-production-fcb1.up.railway.app/health` |
| API base | `https://backend-production-fcb1.up.railway.app/api/v1` |
| Login web | https://taller1-frontend.vercel.app |
| Director | `director@blenkir.edu.pe` / `DIRECTOR_INITIAL_PASSWORD` |
| Profesor tutor | `prof001@blenkir.edu.pe` / `TEACHER_INITIAL_PASSWORD` |
| Estudiante | `est0002@alumnos.blenkir.edu.pe` / `STUDENT_INITIAL_PASSWORD` |

Las contraseñas son **solo variables de entorno** en Railway (proyecto `TALLER1` →
`production` → servicio `backend`); no se publican valores en este documento.
Listado completo de las 275 cuentas: [BLENKIR_LOGIN_ACCOUNTS_2026.md](BLENKIR_LOGIN_ACCOUNTS_2026.md).

Verificar por rol:

1. Dashboard carga sin F5 ni 401 en consola del navegador
2. Estudiante no puede acceder a rutas `/students` (403)
3. Profesor solo ve sus secciones en filtros

Data Seed: ya está importado en producción (V5). **No ejecutar** `db:seed`, `db:seed:demo`,
`db:push` ni ningún reset sobre esa BD.

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
5. Login `prof001@blenkir.edu.pe`
6. Filtros grado → sección → Buscar en Notas/Asistencia/LMS
7. Registrar nota y asistencia solo en sus salones
8. Profesor en curso ajeno → 403

### Estudiante
9. Login `est0002@alumnos.blenkir.edu.pe`
10. Dashboard personal (sin totales globales)
11. Mis notas / asistencia / LMS / riesgo — solo datos propios
12. `GET /students` o `/profesor/dashboard` → 403
13. Enviar `?studentId=otro` en `/estudiante/notas` → 403

### General
14. Login inválido → 401
15. Predicción medio/alto genera alerta
16. Smoke: `npm run test:smoke` (requiere `API_URL` y las tres variables de contraseña de rol)

## Smoke (integración)

```bash
npm run dev   # en otra terminal
npm run test:smoke
```

Ver también [plan-pruebas/](../plan-pruebas/README.md), [pruebas-funcionales.md](./pruebas-funcionales.md) y [pruebas-no-funcionales.md](./pruebas-no-funcionales.md).
