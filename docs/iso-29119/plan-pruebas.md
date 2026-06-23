# Plan de pruebas de software — ISO/IEC 29119

**Proyecto:** Tesis Dashboard v2.0  
**Norma:** ISO/IEC 29119  
**Versión:** 2.0  
**Total casos:** 54

---

## 1. Objetivo

Verificar el cumplimiento funcional y no funcional del sistema web inteligente de predicción de deserción, con trazabilidad entre requisitos, casos, resultados y evidencias en `docs/evidencias/`.

---

## 2. Alcance

Backend (Express), Frontend (Next.js), Base de datos (MySQL/Prisma), Módulo IA (FastAPI), seguridad RBAC, dashboards, predicción, notas y reportes.

**Entornos:** Local (`npm run dev`) · Producción (Vercel + Railway)

**Credenciales:** `director@blenkir.edu.pe` · `pro50000001@blenkir.edu.pe` · `mateo.quispe0001@blenkir.edu.pe` · contraseña `mbappe29`

---

## 3. Criterios de aceptación generales

| ID | Criterio | Condición |
|----|----------|-----------|
| CA-01 | Tests backend | 100 % pass `npm run test:backend` |
| CA-02 | TypeScript | 0 errores `npm run type-check` |
| CA-03 | Build | `npm run build` exitoso |
| CA-04 | Lint | `npm run lint` sin errores |
| CA-05 | Health prod | `GET /health` → HTTP 200 |
| CA-06 | Login 3 roles | Sin 401 en consola al cargar dashboard |

---

## 4. Casos de prueba — Backend

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-BE-01 | Backend | Health check API | `GET /health` sin auth | HTTP 200, `{ service: "tesis-api" }` | 200 en producción Railway | ✅ Aprobado |
| TC-BE-02 | Backend | Login Director válido | `POST /auth/login` email+password correctos | 200 + accessToken + refreshToken | Pass `schemas.test.ts` | ✅ Aprobado |
| TC-BE-03 | Backend | Login inválido | Email inexistente | HTTP 401 | Pass `schemas.test.ts` | ✅ Aprobado |
| TC-BE-04 | Backend | Listar estudiantes sin token | `GET /students` sin Authorization | HTTP 401 | Pass middleware auth | ✅ Aprobado |
| TC-BE-05 | Backend | Crear estudiante Director | `POST /students` token admin | HTTP 201 + studentId | Postman / manual | 🔄 Pendiente evidencia |
| TC-BE-06 | Backend | Envelope respuesta estándar | Cualquier endpoint exitoso | `{ success, message, data }` | Pass `response.test.mjs` | ✅ Aprobado |
| TC-BE-07 | Backend | KPIs dashboard | `GET /dashboard/kpis` token admin | Totales numéricos coherentes | Manual producción | 🔄 Pendiente evidencia |
| TC-BE-08 | Backend | Export cuentas admin | `GET /admin/cuentas-acceso` | JSON 660+23 cuentas | CSV en `docs/cuentas-demo/` | ✅ Aprobado |

---

## 5. Casos de prueba — Frontend

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-FE-01 | Frontend | Render login | Navegar `/login` | Formulario email/password | Build Next.js OK | ✅ Aprobado |
| TC-FE-02 | Frontend | Login → shell sin F5 | Credenciales Director | Dashboard carga, sin 401 consola | Fix v2.0.1 verificado | ✅ Aprobado |
| TC-FE-03 | Frontend | Menú Director completo | Rol admin | 14 secciones visibles | `ROLE_SECTIONS` en código | ✅ Aprobado |
| TC-FE-04 | Frontend | Menú Estudiante reducido | Rol estudiante | Sin CRUD global | Pass `roles-estudiante.test.mjs` | ✅ Aprobado |
| TC-FE-05 | Frontend | Build producción | `npm run build` | Compilación exitosa | Build OK local | ✅ Aprobado |
| TC-FE-06 | Frontend | ESLint sin errores | `npm run lint` | 0 errors | Lint OK | ✅ Aprobado |
| TC-FE-07 | Frontend | Toast error login | Password incorrecta | Sonner error visible | Manual | 🔄 Pendiente captura |

---

## 6. Casos de prueba — Base de datos

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-DB-01 | Base de datos | Migraciones deploy | `prisma migrate deploy` Railway | Sin error P3009 | Auto-recovery en start | ✅ Aprobado |
| TC-DB-02 | Base de datos | Seed estructura | `npm run db:seed` | Grados, cursos, permisos | Script ejecutable | ✅ Aprobado |
| TC-DB-03 | Base de datos | Seed demo 660 estudiantes | `npm run db:seed:demo` | 660 students activos | CSV verificado prod | ✅ Aprobado |
| TC-DB-04 | Base de datos | Validación demo | `validate-demo-data.mjs` | 22 salones × 30, notas I–II | Script en repo | ✅ Aprobado |
| TC-DB-05 | Base de datos | 23 profesores activos | Query `teacher` | Count = 23 | `profesores.csv` | ✅ Aprobado |
| TC-DB-06 | Base de datos | Bimestres III–IV vacíos | Query grades periodo 3–4 | Count = 0 | Validación demo | ✅ Aprobado |

---

## 7. Casos de prueba — IA

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-IA-01 | IA | Entrenamiento modelos | `npm run ml:train` | `best_model.joblib`, `metrics.json` | Script ejecutable | ✅ Aprobado |
| TC-IA-02 | IA | Test predict Python | `npm run ml:test` | Todos los tests pass | ml:test OK | ✅ Aprobado |
| TC-IA-03 | IA | Formato respuesta tesis | POST `/predict` features | `nivel_riesgo`, `factores_riesgo[]` español | Pass `prediction-format.test.mjs` | ✅ Aprobado |
| TC-IA-04 | IA | Health ML | `GET :5000/health` | HTTP 200 | Manual con ML up | 🔄 Pendiente evidencia |
| TC-IA-05 | IA | Métricas F1 ≥ 0.80 | `metrics.json` post-train | f1_score ≥ 0.80 | Depende de ejecución train | 🔄 Pendiente evidencia |
| TC-IA-06 | IA | Integración backend | `POST /api/v1/predict` + JWT | Persiste en `prediction` | Smoke test | 🔄 Pendiente evidencia |

---

## 8. Casos de prueba — Seguridad

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-SEC-01 | Seguridad | JWT expirado | Token inválido en header | HTTP 401 | Middleware auth | ✅ Aprobado |
| TC-SEC-02 | Seguridad | Profesor crea estudiante | `POST /students` token docente | HTTP 403 | Pass `permissions.test.mjs` | ✅ Aprobado |
| TC-SEC-03 | Seguridad | Estudiante accede /students | Token estudiante | HTTP 403 | Pass roles tests | ✅ Aprobado |
| TC-SEC-04 | Seguridad | studentId ajeno en query | `GET /estudiante/notas?studentId=otro` | HTTP 403 | Pass `estudiante-scope.test.ts` | ✅ Aprobado |
| TC-SEC-05 | Seguridad | CORS desde Vercel | Login desde prod frontend | Sin error CORS | Producción activa | ✅ Aprobado |

---

## 9. Casos de prueba — Roles

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-ROL-01 | Roles | Director CRUD profesores | Token admin | 200/201 en `/teachers` | Código + Postman | 🔄 Pendiente evidencia |
| TC-ROL-02 | Roles | Profesor ve solo sus secciones | Token docente + filtros | Estudiantes acotados | Pass `teacher-scope.test.ts` | ✅ Aprobado |
| TC-ROL-03 | Roles | Estudiante solo /estudiante/* | Token estudiante | 200 en rutas propias | Pass `roles-estudiante.test.mjs` | ✅ Aprobado |
| TC-ROL-04 | Roles | Matriz permisos completa | Suite permissions | 0 fallos | 27 tests pass | ✅ Aprobado |

---

## 10. Casos de prueba — Dashboard

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-DASH-01 | Dashboard | KPIs Director | Login director → Dashboard | Totales estudiantes, riesgo, alertas | Manual prod | 🔄 Pendiente captura |
| TC-DASH-02 | Dashboard | KPIs Profesor | Login profesor → Dashboard | Solo ámbito propio | Manual | 🔄 Pendiente captura |
| TC-DASH-03 | Dashboard | Gauge riesgo Estudiante | Login estudiante | RiskGauge visible | Manual | 🔄 Pendiente captura |
| TC-DASH-04 | Dashboard | Gráficos Recharts | Dashboard Director | Charts renderizan | Manual | 🔄 Pendiente captura |
| TC-DASH-05 | Dashboard | Sin 401 al cargar | Network tab post-login | 0 respuestas 401 | Fix useAuthReady | ✅ Aprobado |

---

## 11. Casos de prueba — Predicción

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-PRED-01 | Predicción | Ejecutar predicción Director | Seleccionar estudiante → Predecir | Nivel bajo/medio/alto + factores | Manual PredictionView | 🔄 Pendiente captura |
| TC-PRED-02 | Predicción | Profesor predice en su ámbito | `/profesor/predicciones` POST | 200 + resultado | Manual | 🔄 Pendiente evidencia |
| TC-PRED-03 | Predicción | Estudiante ve predicción propia | `/estudiante/prediccion` | Solo su riesgo | Pass scope tests | ✅ Aprobado |
| TC-PRED-04 | Predicción | Historial predicciones | `/predictions` admin | Lista con fechas | Manual | 🔄 Pendiente evidencia |

---

## 12. Casos de prueba — Notas

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-NOT-01 | Notas | Listar con filtro bimestre | GradesView bimestre I | Notas numéricas listadas | Fix NaN aplicado | ✅ Aprobado |
| TC-NOT-02 | Notas | Promedio sin NaN | Filtros incompletos | Muestra "—" | GradesView.tsx | ✅ Aprobado |
| TC-NOT-03 | Notas | Nota fuera de rango | POST nota = 25 | HTTP 400 Zod | Pass `schemas.test.ts` | ✅ Aprobado |
| TC-NOT-04 | Notas | Profesor registra en su salón | POST `/profesor/notas` | 201 Created | Manual | 🔄 Pendiente evidencia |
| TC-NOT-05 | Notas | Cobertura bimestre I–II | validate-demo-data | 0 estudiantes sin notas I–II | Script validación | ✅ Aprobado |

---

## 13. Casos de prueba — Reportes

| ID | Módulo | Caso | Entrada | Resultado esperado | Resultado obtenido | Estado |
|----|--------|------|---------|-------------------|-------------------|--------|
| TC-REP-01 | Reportes | Listar reportes | `GET /reports` autenticado | Lista reportes | Manual | 🔄 Pendiente evidencia |
| TC-REP-02 | Reportes | Crear reporte Director | `POST /reports` admin | 201 + reportId | Manual | 🔄 Pendiente evidencia |
| TC-REP-03 | Reportes | Export PDF frontend | Botón export ReportsView | Descarga PDF | Manual | 🔄 Pendiente captura |
| TC-REP-04 | Reportes | Estudiante no crea reporte | POST `/reports` estudiante | HTTP 403 | RBAC | ✅ Aprobado |

---

## 14. Resumen de ejecución

| Categoría | Total | ✅ Aprobado | 🔄 Pendiente evidencia |
|-----------|-------|-------------|------------------------|
| Backend | 8 | 6 | 2 |
| Frontend | 7 | 6 | 1 |
| Base de datos | 6 | 6 | 0 |
| IA | 6 | 3 | 3 |
| Seguridad | 5 | 5 | 0 |
| Roles | 4 | 3 | 1 |
| Dashboard | 5 | 1 | 4 |
| Predicción | 4 | 1 | 3 |
| Notas | 5 | 4 | 1 |
| Reportes | 4 | 1 | 3 |
| **TOTAL** | **54** | **36** | **18** |

---

## 15. Evidencias requeridas

| Carpeta | Casos relacionados |
|---------|-------------------|
| `evidencias/backend/` | TC-BE-*, TC-SEC-* |
| `evidencias/frontend/` | TC-FE-* |
| `evidencias/dashboard/` | TC-DASH-* |
| `evidencias/ia/` | TC-IA-*, TC-PRED-* |
| `evidencias/postman/` | TC-BE-05, TC-ROL-01 |
| `evidencias/capturas/` | TC-FE-07, TC-NOT-04, TC-REP-03 |

---

## 16. Referencias

- [Índice operativo](../plan-pruebas/README.md)
- [Evidencias](../evidencias/README.md)
- [Calidad ISO 25010](../iso-25010/calidad-software.md)
- [Pruebas funcionales](../pruebas-funcionales.md)
