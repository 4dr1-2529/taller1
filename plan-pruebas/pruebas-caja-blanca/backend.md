# Pruebas caja blanca — Análisis de cobertura

**Alcance:** `backend/src/` + `machine-learning/app/` + validadores Zod

---

## Cobertura por capa (archivos de test reales)

| Capa | Archivos producción | Archivos test | Cobertura indirecta |
|------|---------------------|---------------|---------------------|
| Validadores | `validators/schemas.ts` | `schemas.test.ts`, `validation-fields.test.ts` | Alta |
| Auth middleware | `middleware/auth.ts` | smoke + integración JWT | Media |
| Scope profesor | `utils/teacher-scope.ts` | `teacher-scope.test.ts` | Alta |
| Scope estudiante | `utils/estudiante-scope.ts` | `estudiante-scope.test.ts` | Alta |
| Permisos rol | lógica dispersa controllers | `permissions.test.mjs` | Media |
| ML features | `app/features.py` | `test_feature_vector_shape` | Alta |
| Formato tesis | mapeo predict response | `prediction-format.test.mjs` | Alta |
| Controllers (27+) | `controllers/*.ts` | Parcial vía schemas + smoke | Media-Baja |

---

## Funciones con tests directos

| Función | Archivo test |
|---------|--------------|
| `uniqueSectionIds` | `teacher-scope.test.ts` |
| `studentScopeFromSections` | `teacher-scope.test.ts` |
| `rejectClientStudentId` | `estudiante-scope.test.ts` |
| `notaEstadoLabel` | `estudiante-scope.test.ts` |
| `build_feature_vector` | `test_predict.py` |
| `heuristic_predict` | `test_predict.py` |
| `validate_predict_payload` | `test_predict.py` |
| `puede(rol, accion)` | `permissions.test.mjs` |

---

## Ramas sin cobertura unitaria (smoke/UAT)

- `ml-client.ts` fallback cuando ML caído
- `reports.controller` export PDF/Excel (solo frontend `export-reports.ts`)
- `messages.controller` límite 150 mensajes
- `NotificationBell` polling

Ver [servicios.md](../pruebas-unitarias/servicios.md) · [controladores.md](../pruebas-unitarias/controladores.md)
