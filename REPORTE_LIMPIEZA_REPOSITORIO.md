# Reporte de limpieza del repositorio

## Archivos eliminados

Se eliminaron los logs generados bajo `plan-pruebas/evidencias-finales/logs/`, `plan-pruebas/evidencias-finales/terminal/` y `plan-pruebas/pruebas-unitarias/evidencias/`. Los CSV/JSON de cuentas demo ya no estaban rastreados al iniciar la revisión.

## Archivos movidos a legacy

No se movieron archivos automáticamente. Las referencias PostgreSQL y migraciones Prisma históricas requieren decisión explícita para no romper compatibilidad.

## Archivos conservados

- Código frontend, backend y Machine Learning.
- `backend/prisma/schema.prisma` y migraciones.
- `backend/prisma/seed-demo.ts`.
- Tests, scripts de QA, documentación técnica y académica.
- Matrices, reportes y evidencias no basadas en logs.
- Colección Postman, saneada para usar `{{DEMO_PASSWORD}}`.

## Archivos generados agregados a `.gitignore`

Se añadieron reglas para logs, builds, coverage, temporales, exports, bases locales y exportaciones de cuentas demo.

## Credenciales eliminadas

- No se encontraron contraseñas demo literales en el contenido actual.
- No se generaron contraseñas nuevas.
- Postman ya no contiene una contraseña literal.
- Las credenciales deben rotarse en cualquier entorno externo donde hayan existido.

## Documentación actualizada

- `docs/cuentas-demo/README.md` ahora usa `DEMO_PASSWORD=<CONFIGURAR_EN_VARIABLE_DE_ENTORNO>`.
- Postman usa la variable `{{DEMO_PASSWORD}}`.

## Elementos que requieren revisión manual

- Los logs históricos de QA fueron eliminados por ser artefactos generados; las matrices y reportes consolidados se conservaron.
- Migraciones Prisma históricas: no se renombraron ni eliminaron.
- Historial Git: esta limpieza no reescribe commits ni sustituye la rotación de credenciales expuestas históricamente.
