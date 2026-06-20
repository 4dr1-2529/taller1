# Despliegue producción — Vercel + Railway + MySQL

## URLs del proyecto

| Servicio | URL |
|----------|-----|
| Frontend | https://taller1-frontend.vercel.app |
| Backend | `https://TU-SERVICIO.up.railway.app` (configurar en Vercel) |
| MySQL TCP proxy | `acela.proxy.rlwy.net:34678` |
| MySQL interno (Railway) | `mysql.railway.internal:3306` |

---

## Variables Railway (backend)

```env
DATABASE_URL=mysql://USER:PASSWORD@acela.proxy.rlwy.net:34678/railway
JWT_SECRET=blenkir_tesis_2026_jwt_secret_min_32_chars
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://taller1-frontend.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:3029
ML_SERVICE_URL=http://localhost:5000
```

**Nombres exactos (inglés).** No use `JWT_SECRETO`, `ENTORNO_NODO=producción` ni `ORIGEN_CORS` — el backend acepta esos alias, pero lo correcto es `JWT_SECRET`, `NODE_ENV=production` y `CORS_ORIGIN`. `JWT_SECRET` debe tener **mínimo 32 caracteres**.

`PORT` lo inyecta Railway automáticamente.

Vincule `DATABASE_URL` desde el plugin **MySQL** al servicio backend.

---

## Variables Vercel (frontend)

```env
NEXT_PUBLIC_API_URL=https://TU-BACKEND.up.railway.app/api/v1
```

Definir en **Production** y **Preview**.

---

## Railway — comandos

```bash
# Build (automático vía railway.toml)
npm install --include=dev
npm run build --workspace=@tesis/shared
npm run build --workspace=backend

# Start producción
npm run start:prod --workspace=backend
```

### Error P3009 (migración fallida)

**Causa común:** el archivo `migration.sql` tenía BOM UTF-8 (generado en Windows), incompatible con MySQL.

**Corrección aplicada en repo:** migración regenerada sin BOM + `updated_at` con defaults MySQL.

Si la BD **no tiene datos importantes**, ejecutar desde tu PC con `DATABASE_URL` de Railway:

```bash
cd backend
export DATABASE_URL="mysql://...@acela.proxy.rlwy.net:34678/railway"

npx prisma migrate resolve --rolled-back "20250609120000_init"
npx prisma db execute --file scripts/railway-drop-all-tables.sql --schema prisma/schema.prisma
npx prisma generate
npx prisma migrate deploy
```

O asistente:

```bash
npm run db:railway:fix-p3009 --workspace=backend
```

Luego **redeploy** el servicio backend en Railway.

### Seed (una vez)

```bash
npm run db:seed --workspace=backend
npm run db:seed:demo --workspace=backend
ADMIN_EMAIL=director@blenkir.edu.pe ADMIN_PASSWORD=TuClave npm run db:bootstrap --workspace=backend
```

---

## Vercel — comandos

- **Root Directory:** `frontend`
- **Build:** `cd .. && npm install --include=dev && npm run build --workspace=@tesis/shared && npm run build --workspace=frontend`

```bash
cd frontend
vercel --prod
```

---

## Builds locales

```bash
npm run build --workspace=@tesis/shared
npm run build --workspace=backend
npm run build --workspace=frontend
```

---

## Checklist

- [ ] MySQL Railway activo
- [ ] P3009 resuelto (`migrate deploy` OK)
- [ ] `/health` responde en Railway
- [ ] `NEXT_PUBLIC_API_URL` en Vercel
- [ ] `CORS_ORIGIN` incluye `https://taller1-frontend.vercel.app`
- [ ] Login probado en producción
