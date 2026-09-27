# Cuentas de acceso

El repositorio **no publica ninguna contraseña**. Cada rol usa su propia variable de entorno:

```bash
DIRECTOR_INITIAL_PASSWORD=<CONFIGURAR_EN_ENTORNO>
TEACHER_INITIAL_PASSWORD=<CONFIGURAR_EN_ENTORNO>
STUDENT_INITIAL_PASSWORD=<CONFIGURAR_EN_ENTORNO>
```

## Población operativa/demo actual

| Rol | Cantidad |
|-----|----------|
| Director | 1 |
| Profesores | 24 |
| Estudiantes | 250 |
| **Total** | **275** |

**Procedencia:** semilla operativa importada originalmente como **Data Seed V5**.
**Sistema técnico vigente:** **BLENKIR V6** (el nombre "V5" solo describe la versión histórica
del seed, no el sistema).

> Esta población es **operativa/demo persistida**: no es un dataset de datos reales
> institucionales (aún no disponibles). Tampoco confundir con el dataset ML V6 de 225 estudiantes
> / 450 snapshots, que es científico-sintético y solo entrena al modelo.

Listado completo (códigos, emails, grado/sección y estado de matrícula):
[BLENKIR_LOGIN_ACCOUNTS_2026.md](../BLENKIR_LOGIN_ACCOUNTS_2026.md).

> **Deprecated:** `DEMO_PASSWORD` / `INSTITUTION_DEFAULT_PASSWORD` corresponden a la población
> demo anterior, ya reemplazada por el Data Seed V5. Los scripts antiguos de exportación apuntaban
> al dominio obsoleto `taller1-production.up.railway.app` y ya no se usan.

## Exportar desde producción

```bash
cd tesis-dashboard/backend
node scripts/export-production-accounts.mjs   # requiere DIRECTOR_INITIAL_PASSWORD
node scripts/verify-production-accounts.mjs   # requiere las tres variables de rol
```

Los CSV/JSON resultantes **no se versionan** (`.gitignore` cubre `docs/cuentas-demo/*.csv|json|xlsx`)
y solo contienen la columna `password_env` (nombre de la variable), nunca el valor.

> Requiere el endpoint `GET /admin/cuentas-acceso` (admin) desplegado en Railway.
