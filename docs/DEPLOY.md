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
JWT_SECRET=clave-segura-minimo-32-caracteres
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://taller1-frontend.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:3029
ML_SERVICE_URL=http://localhost:5000
```

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

Solo si la BD **no tiene datos importantes**:

```bash
cd backend
export DATABASE_URL="mysql://...@acela.proxy.rlwy.net:34678/railway"

npx prisma migrate resolve --rolled-back "20250609120000_init"
# Ejecutar scripts/railway-drop-all-tables.sql en MySQL
npx prisma generate
npx prisma migrate deploy
```

O asistente automatizado:

```bash
npm run db:railway:fix-p3009 --workspace=backend
```

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
