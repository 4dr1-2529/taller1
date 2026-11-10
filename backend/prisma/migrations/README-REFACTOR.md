# Migración — Refactor 3 roles + alertas + mensajería

## Pasos recomendados

```bash
cd backend
npx prisma db execute --file prisma/migrate-roles.sql
npx prisma db push --accept-data-loss
npx prisma generate
cd ..
npm run db:seed
npm run db:dataset:validate
npm run db:dataset:dry-run
```

La única población de demostración vigente se importa con Data Seed V6. La validación y el dry-run
preceden cualquier importación; trabajar siempre contra una base local aislada.

> **HISTÓRICO / YA APLICADO.** Esta migración puntual ya se ejecutó. No usar
> `prisma db push --accept-data-loss` sobre producción: el esquema vigente se aplica con
> `npm run db:migrate:deploy`.

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
