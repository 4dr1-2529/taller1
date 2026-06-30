# Recursos del plan de pruebas

---

## Equipo y roles

| Rol | Responsabilidad | Artefactos |
|-----|-----------------|------------|
| Ingeniero QA | Diseño casos, ejecución, matriz, evidencias | `plan-pruebas/`, `matriz-casos.xlsx` |
| Desarrollador Backend | Mantener `backend/tests/`, rutas `routes/index.ts` | 11 suites Jest/node:test |
| Desarrollador Frontend | Lint, build, vistas por rol `ROLE_SECTIONS` | `frontend/src/app/(shell)/page.tsx` |
| ML Engineer | `machine-learning/tests/test_predict.py`, `train.py` | `models/best_model.joblib` |
| DevOps | MySQL seed, Railway/Vercel smoke | `docs/DEPLOY.md` |

---

## Herramientas (del `package.json` raíz)

| Herramienta | Script | Workspace / ruta |
|-------------|--------|------------------|
| Jest / node:test | `npm run test:backend` | `backend/package.json` |
| pytest | `npm run ml:test` | `machine-learning/tests/` |
| TypeScript | `npm run type-check` | shared + frontend + backend |
| ESLint | `npm run lint` | frontend |
| Smoke integración | `npm run test:smoke` | `backend/scripts/smoke-tests.mjs` |
| Playwright (Edge) | `npm run evidence:generate` | `scripts/evidence/` |
| Prisma Studio | `npm run db:studio` | inspección BD 52 modelos |

---

## Entorno hardware/software mínimo

| Recurso | Especificación |
|---------|----------------|
| SO | Windows 10/11 o Linux |
| Node.js | ≥ 20 (`engines` en package.json) |
| Python | 3.11+ con scikit-learn, FastAPI |
| MySQL | 8.x — base `tesis_dashboard` |
| Navegador | Microsoft Edge (capturas Playwright `channel: msedge`) |
| RAM | ≥ 8 GB (dev + MySQL + ML simultáneo) |

---

## Datos de prueba (seed real)

| Entidad | Cantidad | Origen |
|---------|----------|--------|
| Estudiantes | 660 | `npm run db:seed:demo` |
| Profesores | 23 | `docs/cuentas-demo/profesores.csv` |
| Salones | 22 × 30 alumnos | `validate-demo-data.mjs` |
| Contraseña demo | `mbappe29` | `backend/scripts/default-password.mjs` |

---

## Credenciales por rol (producción y local)

| Rol | Email | API role (`RolCodigo`) |
|-----|-------|------------------------|
| Director | `director@blenkir.edu.pe` | `admin` |
| Profesor | `pro50000001@blenkir.edu.pe` | `docente` |
| Estudiante | `mateo.quispe0001@blenkir.edu.pe` | `estudiante` |

---

## Documentación de soporte

- API rutas: `backend/src/routes/index.ts` (87 rutas registradas)
- Postman: `docs/postman/tesis-dashboard.postman_collection.json`
- Roles UI: `ROLE_SECTIONS` en `frontend/src/app/(shell)/page.tsx` líneas 54–91
