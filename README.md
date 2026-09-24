# I.E.P. Blenkir — 2026

Sistema de tesis de predicción de riesgo estudiantil con datos académicos y actividad LMS observada. Roles: Director, Profesor y Estudiante. Se conserva Next.js + Express + Prisma/MySQL + Python Ensemble Learning.

Documentación vigente en docs: ARQUITECTURA.md, API.md, roles-permisos.md, DEPLOY.md, machine-learning.md y tesis/REPORTE-REFACTORIZACION-2026.md.

Desde la raíz: npm ci; npm run build --workspace=@tesis/shared; npm run db:generate; npm run type-check; npm run lint; npm run test:backend; npm run test --workspace=frontend; npm run build. ML: instalar requirements.txt y ejecutar sus pruebas. Configure variables según .env.example, nunca agregue secretos a Git.

El Data Seed definitivo **V5** ya está importado y verificado en producción: **275 usuarios**
(1 director · 24 profesores · 250 estudiantes), 328 cursos, 3 724 matrículas y 0 cuentas sin crear.
No se ejecutan `db:seed`, `db:seed:demo`, `db:push` ni ningún reset sobre esa base.
El Excel antiguo es legacy y no define la arquitectura. Listado de cuentas:
[BLENKIR_LOGIN_ACCOUNTS_2026.md](docs/BLENKIR_LOGIN_ACCOUNTS_2026.md).

Sin artefacto ML compatible con siete variables, el sistema informa que el modelo no está disponible; no produce predicciones ficticias (`Prediction = 0`, `avgRisk = null`, `modelComparison = []`). Desplegado en Railway (backend) y Vercel (frontend); ver [CIERRE_INTEGRAL_BLENKIR_V5_2026.md](docs/CIERRE_INTEGRAL_BLENKIR_V5_2026.md).
