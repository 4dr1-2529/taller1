# Pruebas unitarias — Backend

**Comando:** `npm run test:backend` · **Ubicación:** `backend/tests/` (11 archivos)

---

## Inventario real de suites

| Archivo | Framework | Qué valida (código fuente) |
|---------|-----------|----------------------------|
| `schemas.test.ts` | node:test | `loginSchema`, `studentSchema`, `gradeSchema`, `predictSchema`, `alertStatusSchema`, `courseSchema`, `teacherSchema`, `createUserSchema`, `changePasswordSchema` desde `src/validators/schemas.ts` |
| `validation-fields.test.ts` | node:test | DNI, teléfono, nombres sin dígitos, rangos nota |
| `teacher-scope.test.ts` | node:test | `uniqueSectionIds()`, `studentScopeFromSections()` — lógica de `utils/teacher-scope.ts` |
| `estudiante-scope.test.ts` | node:test | `rejectClientStudentId()` — `utils/estudiante-scope.ts`; `notaEstadoLabel()` — `utils/grade-status.ts` |
| `permissions.test.mjs` | node:test | Matriz `PERMISOS` admin/docente/estudiante |
| `roles-estudiante.test.mjs` | node:test | Rutas prohibidas para rol estudiante |
| `roles-profesor.test.mjs` | node:test | Alcance docente vs director |
| `roles-scope.test.mjs` | node:test | Resolución `resolveStudentScope` |
| `response.test.mjs` | node:test | `sendSuccess` / `sendCreated` envelope |
| `prediction-format.test.mjs` | node:test | Formato tesis: `nivel_riesgo`, `probabilidad_abandono`, `factores_riesgo` |
| `validators.test.mjs` | node:test | Validadores auxiliares |

---

## Casos mapeados a rutas (`routes/index.ts`)

| Caso matriz | Test / ruta | Assert real |
|-------------|-------------|-------------|
| TC-BE-02 | `loginSchema` email `dir@blenkir.edu.pe` | `safeParse.success === true` |
| TC-BE-03 | `loginSchema` email `x` | `success === false` |
| TC-BE-05 | `authorize("admin")` en `POST /students` | Docente → 403 (permissions) |
| TC-BE-06 | `response.test.mjs` | `{ success, message, data }` |
| TC-SEC-05 | `estudiante-scope.test.ts` | `AppError` "No tiene permiso" |
| TC-ROL-05 | `teacher-scope.test.ts` | `seccionId: { in: [10n, 20n] }` |

---

## Ejecución y evidencia

```bash
cd tesis-dashboard
npm run test:backend
# Salida → docs/evidencias_finales/qa/qa-test-backend.txt
```

Ver también [controladores.md](controladores.md) · [servicios.md](servicios.md)
