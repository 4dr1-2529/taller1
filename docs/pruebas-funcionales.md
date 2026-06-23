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

| Rol | Credencial demo | Verificar |
|-----|-----------------|-----------|
| Director | `director@blenkir.edu.pe` | Totales globales, CRUD, reportes |
| Profesor tutor | `pro50000001@blenkir.edu.pe` | Filtros salón, notas propias |
| Estudiante | `mateo.quispe0001@blenkir.edu.pe` | Sin filtros globales, solo `/estudiante/*` |

Contraseña: `mbappe29`

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
