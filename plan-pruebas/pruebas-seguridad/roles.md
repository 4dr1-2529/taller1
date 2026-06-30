# Pruebas de seguridad — Roles (RBAC)

**Casos:** TC-SEC-02, TC-SEC-03, TC-SEC-04, TC-ROL-01 … TC-ROL-04

---

## Matriz resumida

| Acción | Director | Profesor | Estudiante |
|--------|----------|----------|------------|
| CRUD estudiantes | ✅ | ❌ 403 | ❌ 403 |
| Notas en salón propio | ✅ | ✅ | Solo lectura |
| Predicción global | ✅ | Ámbito | Solo propia |
| Reportes | ✅ | Limitado | ❌ 403 |
| `/students` API | ✅ | ❌ | ❌ |

---

## Tests automatizados

`permissions.test.mjs` — 27 tests pass  
`roles-estudiante.test.mjs`, `roles-profesor.test.mjs`

Ver [docs/roles-permisos.md](../../docs/roles-permisos.md)
