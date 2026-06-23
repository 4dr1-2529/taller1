# Cuentas — I.E.P. Blenkir

**Contraseña institucional:** `mbappe29`

## Archivos importantes

| Archivo | Origen | Uso |
|---------|--------|-----|
| `estudiantes.csv` | Base local (tras seed) | Login local / desarrollo |
| `profesores.csv` | Base local | Docentes locales |
| `estudiantes-produccion.csv` | API Railway **real** | Login en https://taller1-frontend.vercel.app |
| `profesores-produccion.csv` | API Railway | Producción |
| `cuentas-produccion.json` | API Railway | JSON completo producción |

> **Importante:** el correo de login es el de la columna `email_login`. Debe coincidir con la tabla `usuario` del sistema.

## Regenerar cuentas locales

```bash
cd tesis-dashboard/backend
npm run db:seed:demo
npm run export:accounts
```

## Regenerar cuentas de PRODUCCIÓN (las reales del sitio web)

```bash
cd tesis-dashboard/backend
npm run export:accounts:prod
```

## Reparar producción (login + notas I–II)

En Railway → servicio **taller1-production** → **Variables**:

1. Agregar `RUN_REPAIR=1` → redeploy → esperar logs `OK — contraseña institucional: mbappe29`
2. Quitar la variable después del deploy

O reseed completo: `RUN_DEMO_SEED=1` (borra y repobla todo).

## Estudiante ejemplo (local, estable)

| Código | Salón | Correo login | Contraseña |
|--------|-------|--------------|------------|
| EST-2026-0001 | 1° A | mateo.quispe0001@blenkir.edu.pe | mbappe29 |

Tras reseed en Railway, el mismo código tendrá el mismo correo (cuentas determinísticas).
