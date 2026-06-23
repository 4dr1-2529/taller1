# Cuentas de acceso — I.E.P. Blenkir (producción)

**Contraseña para todas las cuentas:** `mbappe29`

## Archivos (usar estos para entrar a la web)

| Archivo | Contenido |
|---------|-----------|
| **`estudiantes.csv`** | 660 alumnos — columna `email_login` |
| **`profesores.csv`** | 23 docentes — columna `email_login` |
| `cuentas.json` | Mismo datos en JSON + verificación |

Sitio: https://taller1-frontend.vercel.app

## Actualizar desde producción (datos reales verificados)

```bash
cd tesis-dashboard/backend
npm run export:accounts:web
```

Eso descarga correos de la tabla `usuario`, prueba logins y sobrescribe los CSV.

> Requiere que Railway tenga desplegado el endpoint `/admin/cuentas-acceso`.

## Si el login falla en la web

En Railway → **taller1-production** → **Variables** → agregar `RUN_REPAIR=1` → redeploy → quitar la variable.

## Ejemplos verificados

Consulte las primeras filas de `estudiantes.csv` y `profesores.csv` tras ejecutar `export:accounts:web`.
