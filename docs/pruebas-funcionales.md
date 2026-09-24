# Pruebas funcionales

## Automatizadas (Node / Python)

| Comando | Alcance |
|---------|---------|
| `npm run type-check` | TypeScript frontend + backend |
| `npm run test:backend` | Validadores, roles, alcance profesor/estudiante |
| `npm run ml:test` | ML predict + features |
| `npm run test:smoke` | API + ML en ejecución (integración) |

## Casos cubiertos en unitarios

### AUTH
- Login válido / inválido (`schemas.test.ts`)

### Estudiante
- `estudiante-scope.test.ts` — 403 con studentId ajeno
- `roles-estudiante.test.mjs` — sin endpoints director/profesor
- Estados de nota: Aprobado / En riesgo / Desaprobado

### Profesor
- `teacher-scope.test.ts` — secciones vía cursos
- `roles-profesor.test.mjs` — no filtra como director

### Predicción
- Formato tesis español (`prediction-format.test.mjs`)
- Riesgo bajo/medio/alto (ML test + smoke)

### Alertas
- PATCH estado (Postman + smoke)
- Estudiante: solo lectura vía `/estudiante/alertas`

### Roles
- `permissions.test.mjs` — matriz permitido/prohibido

## Pruebas manuales por rol

## Credenciales vigentes (Data Seed V5)

| Rol | Credencial | Verificar |
|-----|------------|-----------|
| Director | `director@blenkir.edu.pe` | Totales globales, CRUD, reportes |
| Profesor | `prof001@blenkir.edu.pe` | Filtros salón, notas propias |
| Estudiante | `est0002@alumnos.blenkir.edu.pe` | Sin filtros globales, solo `/estudiante/*` |

Contraseñas: variables de entorno `DIRECTOR_INITIAL_PASSWORD`, `TEACHER_INITIAL_PASSWORD`
y `STUDENT_INITIAL_PASSWORD`; no se publican valores en la documentación.

> **Deprecated:** las cuentas `*.demo@…` y el comando `npm run db:seed:demo` pertenecen a la
> población demo anterior y ya no existen. Ver `docs/BLENKIR_LOGIN_ACCOUNTS_2026.md`.

## Ejecución local

```bash
npm run db:push
npm run db:seed
npm run db:seed:demo
npm run ml:train
npm run dev
# otra terminal:
npm run test
npm run test:smoke
```
