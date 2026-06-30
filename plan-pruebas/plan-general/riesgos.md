# Riesgos del plan de pruebas

**Proyecto:** Tesis Dashboard v2.0 · **Norma:** ISO/IEC 29119-2 (proceso de pruebas)

---

## Matriz de riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación en código/proceso | Responsable |
|----|--------|-------|---------|------------------------------|-------------|
| R-01 | ML no levantado (`:5000`) → `POST /predict` usa heurística o falla | Media | Alta | `ml-client.ts` fallback; smoke `ML health` en `smoke-tests.mjs` | QA + Dev |
| R-02 | BD demo vacía → login smoke omitido | Media | Alta | `db:seed:demo` documentado; credenciales `director@blenkir.edu.pe` | DevOps |
| R-03 | Token JWT expirado en sesión larga UAT | Media | Media | `POST /auth/refresh`; `AuthProvider` en frontend | Frontend |
| R-04 | Profesor accede estudiante fuera de `seccionId` de sus cursos | Baja | Crítica | `teacher-scope.ts` + `uniqueSectionIds()` testeado en `teacher-scope.test.ts` | Backend |
| R-05 | Estudiante envía `?studentId=otro` en `/estudiante/notas` | Baja | Crítica | `rejectClientStudentId()` en `estudiante-scope.ts` — test `estudiante-scope.test.ts` | Backend |
| R-06 | Nota fuera de rango 0–20 persiste | Baja | Alta | `gradeSchema` Zod — test `schemas.test.ts` línea nota 25 → fail | Backend |
| R-07 | Build frontend falla en CI | Media | Alta | `npm run build` + `npm run lint` en `RESUMEN-QA` | QA |
| R-08 | Prisma migrate P3009 en Railway | Media | Alta | Script `db:railway:fix-p3009`; auto-recovery en `start:prod` | DevOps |
| R-09 | Predicción sin seleccionar sección en UI | Alta | Media | `PredictionView` exige `filters.seccionId` — mensaje `FILTER_HINTS.selectSeccion` | Frontend |
| R-10 | CORS bloquea login desde Vercel | Baja | Crítica | CORS en `backend/src/index.ts` con origen Vercel | Backend |
| R-11 | `metrics.json` ausente → `MlMetricsSection` error | Media | Baja | Mensaje: "Entrene el modelo: npm run ml:train" | ML |
| R-12 | Evidencias UI desactualizadas tras cambio de layout | Media | Media | `scripts/evidence/capture-ui.mjs` regenerable | QA |

---

## Riesgos residuales aceptados

- Pruebas de stress >100 usuarios concurrentes no automatizadas (fuera de alcance v2.0).
- Penetration testing externo no incluido.
- Compatibilidad IE11 no soportada (Next.js 16).

---

## Referencias código

- Auth: `backend/src/middleware/auth.ts` (`authenticate`, `authorize`)
- Scope estudiante: `backend/src/utils/estudiante-scope.ts`
- Scope profesor: `backend/src/utils/teacher-scope.ts`
- Smoke: `backend/scripts/smoke-tests.mjs`
