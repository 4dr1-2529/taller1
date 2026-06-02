# Migración — Refactor 3 roles + alertas + mensajería

## Pasos recomendados

```bash
cd backend
npx prisma db execute --file prisma/migrate-roles.sql
npx prisma db push --accept-data-loss
npx prisma generate
cd ..
npm run db:seed
npm run db:seed:demo
```

El script `migrate-roles.sql`:

- Reasigna usuarios y mensajes con roles `tutor`, `psicologo`, `apoderado` → `docente`
- Convierte alertas `abierta` → `nueva`
- Elimina permisos de roles obsoletos en `Role` / `RolePermission`

## Si `db push` falla sin el script

Enum `AlertStatus` (`abierta` → `nueva`):

```sql
UPDATE Alert SET status = 'nueva' WHERE status = 'abierta';
```

Enum `UserRole`: los usuarios con roles eliminados deben actualizarse **antes** de reducir el enum.
