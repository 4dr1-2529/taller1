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

4. Desde la raíz del proyecto:

```bash
npm run db:push
npm run db:seed
npm run db:seed:demo   # LEGACY: población demo antigua. NO usar en producción (V5 ya importado)
npm run db:bootstrap   # opcional si no usó seed:demo
```

> El **Data Seed definitivo V5** (275 usuarios) ya está importado en producción. Los comandos
> anteriores son solo para levantar una **BD local nueva**; ejecutar `db:push`/`db:seed` sobre
> la BD de producción está prohibido.

El esquema lo genera **Prisma** (`backend/prisma/schema.prisma`). El archivo `database/postgresql/schema.sql` es referencia histórica; para MySQL use `db:push`.
