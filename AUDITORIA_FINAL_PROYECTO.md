# Auditoría final del proyecto

## 1. Resumen
Se corrigieron los controles de reset demo, logout, recuperación P3009, configuración MySQL, contrato ML y documentación principal. La demo vigente queda definida para 1 director, 3 profesores y 9 estudiantes ficticios.

## 2. Problemas encontrados
- Seed demo heredado para 660 estudiantes y 23 profesores.
- Docker Compose usaba PostgreSQL y una contraseña fija.
- P3009 podía ejecutar borrado automático de tablas.
- `estado` participaba en el vector ML.
- No existía endpoint backend de logout.
- Había exportaciones versionadas con credenciales demo.
- El conteo documentado no coincidía con el schema.

## 3. Archivos modificados
Se modificaron los manifests, Docker Compose, `.gitignore`, auth frontend/backend, seed demo, scripts P3009/reset, ML (`features.py`, `dataset.py`, `train.py`, FastAPI), pruebas, documentación, Sonar y CI. Se retiraron los CSV/JSON de cuentas versionados.

## 4. Problemas corregidos
- `POST /api/v1/auth/logout` revoca sesiones.
- `db:reset:demo` exige `RESET_DEMO_DB=1` y bloquea producción.
- P3009 detiene el arranque sin `DROP` automático.
- `npm run db:count-models` reporta el conteo real.

## 5. Seguridad
Las contraseñas demo se leen exclusivamente desde `DEMO_PASSWORD`. `JWT_SECRET` usa placeholder. No se validó una rotación de secretos externos porque requiere acceso al proveedor.

## 6. Base de datos
Prisma declara `provider = "mysql"`; Docker usa `mysql:8`. El conteo ejecutado fue: `Modelos Prisma: 52`. No se ejecutó reset contra una base real.

## 7. Machine Learning
El vector vigente tiene 9 variables y excluye `estado`. `ML_DATA_MODE=real` exige `DATASET_PATH` y detiene el entrenamiento si no existe. `ML_DATA_MODE=demo` es solo demostración técnica. No se inventó dataset real ni métrica científica.

## 8. Frontend
Se añadió llamada de logout backend antes de limpiar almacenamiento local. `npm run lint` y el type-check pasaron.

## 9. Backend
Se mantiene la autorización por roles y el scope existente. Los tests de backend pasaron: 27 + 31 casos.

## 10. Despliegue
FastAPI tiene `machine-learning/Dockerfile`, health ampliado y CORS por `ML_CORS_ORIGINS`. `ML_SERVICE_URL` debe apuntar a la URL Railway real.

## 11. Pruebas
Evidencia ejecutada: `npm run type-check`, `npm run lint`, `npm run build`, `npm run test:backend` y `npm run ml:test`, todos exitosos. La prueba de base MySQL, RBAC real entre cuentas y smoke de Railway quedan PENDIENTE DE EVIDENCIA REAL.

## 12. Datos demo finales
El seed crea 1 director, 3 profesores y 9 estudiantes, con 3 asignaciones, 9 matrículas, notas, asistencia, LMS, predicciones y alertas mínimas.

## 13. Elementos pendientes por necesitar evidencia real
- Dataset institucional autorizado y anonimizado.
- Entrenamiento científico y métricas reales.
- URLs, variables y health checks de Railway/Vercel.
- Ejecución del seed contra MySQL limpio.

## 14. Comandos para ejecutar localmente
```powershell
$env:DEMO_PASSWORD = "<valor-local-no-versionado>"
$env:RESET_DEMO_DB = "1"
npm install
npm run db:reset:demo
npm run type-check
npm run test:backend
npm run ml:test
```

## 15. Comandos para desplegar
```powershell
npm run build
npm run db:migrate:deploy
npm run start:prod --workspace=backend
```
FastAPI se despliega desde `machine-learning` con `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## 16. Estado final

| Elemento | Estado | Evidencia |
|---|---|---|
| Frontend | ✅ | `npm run lint`, `npm run type-check`, `npm run build` |
| Backend | ✅ | `npm run test:backend`, `npm run build` |
| MySQL | ✅ | schema Prisma y `docker-compose.yml` |
| ML | ⚠️ | contrato y tests OK; dataset real pendiente |
| Seguridad | ⚠️ | secretos retirados del código trabajado; rotación externa pendiente |
| QA | ⚠️ | tests locales actuales OK; QA integrado final pendiente |
| Vercel | ⚠️ | configuración existente; URL productiva requiere verificación externa |
| Railway Backend | ⚠️ | scripts seguros; despliegue real pendiente |
| Railway ML | ⚠️ | Dockerfile y health preparados; despliegue real pendiente |