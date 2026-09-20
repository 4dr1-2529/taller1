# I.E.P. Blenkir — 2026

Sistema de tesis de predicción de riesgo estudiantil con datos académicos y actividad LMS observada. Roles: Director, Profesor y Estudiante. Se conserva Next.js + Express + Prisma/MySQL + Python Ensemble Learning.

Documentación vigente en docs: ARQUITECTURA.md, API.md, roles-permisos.md, DEPLOY.md, machine-learning.md y tesis/REPORTE-REFACTORIZACION-2026.md.

Desde la raíz: npm ci; npm run build --workspace=@tesis/shared; npm run db:generate; npm run type-check; npm run lint; npm run test:backend; npm run test --workspace=frontend; npm run build. ML: instalar requirements.txt y ejecutar sus pruebas. Configure variables según .env.example, nunca agregue secretos a Git.

No hay seed demo automático. El Data Seed de 200 estudiantes NO fue regenerado porque corresponde a una fase posterior. El Excel antiguo es legacy y no define la arquitectura. Consulte docs/tesis/PLAN-NUEVO-DATA-SEED-200.md desde la raíz.

Sin artefacto ML compatible con siete variables, el sistema informa que el modelo no está disponible; no produce predicciones ficticias. Despliegue preparado para Vercel y Railway, sin operaciones en producción.
