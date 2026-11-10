# I.E.P. Blenkir — 2026

Sistema de tesis de predicción de riesgo estudiantil con datos académicos y actividad LMS observada. Roles: Director, Profesor y Estudiante. Se conserva Next.js + Express + Prisma/MySQL + Python Ensemble Learning.

Documentación vigente en ../docs: ARQUITECTURA.md, API.md, roles-permisos.md, DEPLOY.md, machine-learning.md y tesis/REPORTE-REFACTORIZACION-2026.md.

Desde la raíz: npm ci; npm run build --workspace=@tesis/shared; npm run db:generate; npm run type-check; npm run lint; npm run test:backend; npm run test --workspace=frontend; npm run build. ML: instalar requirements.txt y ejecutar sus pruebas. Configure variables según .env.example, nunca agregue secretos a Git.

El frontend consume la API poblada con Data Seed V6: fuente operativa sintética de 250 estudiantes, 24 docentes y 1 director. El dataset experimental de ML V6 es independiente (225 estudiantes, 450 observaciones). La fuente de datos se valida e importa desde el workspace de backend; este frontend no contiene semillas de población.

Sin artefacto ML compatible con siete variables, el sistema informa que el modelo no está disponible; no produce predicciones ficticias. Despliegue preparado para Vercel y Railway, sin operaciones en producción.
