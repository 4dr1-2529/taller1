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

## Población operativa/demo (semilla importada originalmente como V5)

Sistema técnico vigente: **BLENKIR V6**. Población: 1 director · 24 profesores · 250 estudiantes.

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

Workflow seguro (BD local/aislada; **nunca** sobre producción):

```bash
npm run db:generate
npm run db:migrate        # o db:push solo en una BD local recién creada
npm run db:seed           # estructura + RBAC (db:seed:structure)
npm run dev               # web + api + ml
# otra terminal:
npm run test
npm run test:smoke        # requiere API y ML en ejecución + *_INITIAL_PASSWORD
```

`npm run db:seed:demo` está **deshabilitado** (`backend/scripts/legacy-population-disabled.mjs`,
`exit 1` sin tocar la BD): la población demo antigua ya no se siembra. El ML **no** necesita
`ml:train` para funcionar: los artefactos V6 (`BLENKIR_V6_BIN_20260924`) ya están versionados en
`machine-learning/artifacts/synthetic/`.

### Resultados verificados (revalidación 2026‑09‑27)

`type-check` ✅ · `lint` ✅ · `test:unit` 4/4 · `test:backend` **81/81** ·
`test --workspace=frontend` **40/40** · `ml:test` **32/32** · `build` ✅ ·
integración 39/39 (BD aislada) · smoke ⛔ no disponible sin credenciales de rol.
