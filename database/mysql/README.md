# MySQL (XAMPP)

El proyecto usa **MySQL** vía Prisma. PostgreSQL ya no es obligatorio.

## Pasos

1. Abra **XAMPP Control Panel** e inicie **MySQL** (puerto 3306).  
   En Windows también puede usar: `C:\xampp\mysql_start.bat`
2. Cree la base (phpMyAdmin o script):

```sql
CREATE DATABASE tesis_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. En `backend/.env`:

```env
DATABASE_URL="mysql://root@localhost:3306/tesis_dashboard"
```

Si su usuario `root` tiene contraseña:

```env
DATABASE_URL="mysql://root:SU_CLAVE@localhost:3306/tesis_dashboard"
```

4. Desde la raíz del proyecto (workflow seguro de **BD local/aislada**):

```bash
npm run db:generate        # cliente Prisma
npm run db:migrate         # aplica migraciones (BD nueva o existente)
npm run db:seed            # estructura académica + RBAC (= db:seed:structure)
npm run db:bootstrap       # opcional: admin inicial
```

En una **BD local recién creada** puede usarse `npm run db:push` en lugar de `db:migrate`.
La fuente de demo vigente es Data Seed V6. Valide y previsualice la importación con `db:dataset:validate`
y `db:dataset:dry-run` desde el workspace backend.

> ⛔ **Prohibido** ejecutar `db:push`, `db:migrate`, `db:seed` o cualquier
> `db:reset:*` sobre la BD de **producción**. La población operativa/demo (1 director ·
> 24 profesores · 250 estudiantes = 275 usuarios) es la composición definida por Data Seed V6.
> La fuente del proyecto es el Data Seed V6. Esto no confirma que la base productiva esté sincronizada:
> verifique sus conteos directamente antes de afirmar qué dataset contiene. La BD aislada de pruebas
> (`:33316`) se usa solo para la suite de integración.

El esquema lo genera **Prisma** (`backend/prisma/schema.prisma`). El archivo `database/postgresql/schema.sql` es referencia histórica; para MySQL use `db:push`.
