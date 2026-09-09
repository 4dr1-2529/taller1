# Cuentas demo del sistema

**Contraseña demo:** variable `DEMO_PASSWORD` en `backend/.env` (local) o Railway (producción). No se publica en el repositorio.

El seed vigente crea 1 director, 3 profesores y 9 estudiantes ficticios. Las contraseñas nunca se almacenan en este directorio.

## Actualizar desde producción (datos reales verificados)

```bash
cd tesis-dashboard/backend
npm run export:accounts:web
```

Eso descarga correos de la tabla `usuario`, prueba logins y sobrescribe los CSV.

> Requiere que Railway tenga desplegado el endpoint `/admin/cuentas-acceso`.

## Si el login falla en la web

En Railway → **taller1-production** → **Variables** → agregar `RUN_REPAIR=1` → redeploy → quitar la variable.

Los archivos exportados desde producción no se versionan. Configure `DEMO_PASSWORD` localmente y use `npm run db:reset:demo` con `RESET_DEMO_DB=1`.
