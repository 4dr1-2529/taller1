# Pruebas no funcionales

## Seguridad

- JWT obligatorio en rutas protegidas.
- Contraseñas con bcrypt (nunca en respuestas JSON).
- Rate limiting y Helmet en Express.
- RBAC por rol en cada módulo sensible.

## Rendimiento

- Paginación en listado de estudiantes.
- Límite de 150 mensajes por sala.
- Agregaciones dashboard en una sola consulta (`dashboard-analytics.service.ts`).

## Usabilidad

- Dashboards por rol (Director, Profesor, Estudiante).
- Estados vacíos y skeleton de carga.
- Modo claro/oscuro vía variables CSS.

## Mantenibilidad

- TypeScript en frontend y backend.
- Validación Zod centralizada.
- Documentación en `docs/`.

## Preparación SonarQube

Ver `docs/sonarqube.md` y `sonar-project.properties` en la raíz.
