# Despliegue — Vercel + Railway + MySQL

## Arquitectura

| Componente | Plataforma | Stack |
|------------|------------|--------|
| Frontend | Vercel | Next.js 16 |
| Backend | Railway | Node 20 + Express |
| Base de datos | Railway | MySQL 8 + Prisma (`provider = mysql`) |

---

## Variables de entorno

### Railway (backend)

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/railway
JWT_SECRET=clave-segura-minimo-32-caracteres
CORS_ORIGIN=https://tu-app.vercel.app,https://tu-app-git-main.vercel.app
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
ML_SERVICE_URL=http://localhost:5000
```

`DATABASE_URL` la provee el plugin **MySQL** de Railway. Si falla SSL, pruebe añadir `?sslaccept=strict`.

### Vercel (frontend)

```env
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api/v1
```

Definir en **Production** y **Preview**. Sin esta variable el build pasa, pero las llamadas API fallan en runtime.

---

## Railway — Backend

### Configuración del servicio

- **Root Directory:** raíz del repo (`tesis-dashboard`)
- **Build:** ver `railway.toml`
- **Start:** `npm run start:prod --workspace=backend`

### Comandos manuales

```bash
# Build local
npm install --include=dev
npm run build --workspace=@tesis/shared
npm run build --workspace=backend

# Migraciones (producción — NO usar migrate dev)
npm run prisma:migrate:deploy --workspace=backend

# Arranque producción
npm run start:prod --workspace=backend
```

### Error P3009 (migración fallida)

Si la BD **no tiene datos importantes**:

```bash
cd backend
export DATABASE_URL="mysql://..."

# 1. Marcar migración fallida como revertida
npx prisma migrate resolve --rolled-back "20250609120000_init"

# 2. Borrar tablas parciales (SQL incluido)
# Conectar a MySQL Railway y ejecutar:
#   scripts/railway-drop-all-tables.sql

# 3. Aplicar migraciones
npx prisma migrate deploy
```

O usar el asistente:

```bash
npm run db:railway:fix-p3009 --workspace=backend
```

### Seed (una vez, tras migración OK)

```bash
npm run db:seed --workspace=backend
npm run db:seed:demo --workspace=backend
ADMIN_EMAIL=director@blenkir.edu.pe ADMIN_PASSWORD=TuClaveSegura npm run db:bootstrap --workspace=backend
```

---

## Vercel — Frontend

### Configuración

- **Root Directory:** `frontend`
- **Framework:** Next.js
- **Build Command:** (automático vía `frontend/vercel.json`)
  ```bash
  cd .. && npm install && npm run build --workspace=@tesis/shared && npm run build --workspace=frontend
  ```
- **Output:** `.next` (default Next.js)

### Deploy

```bash
cd frontend
vercel --prod
```

O conectar GitHub → push a `main`.

---

## Checklist

- [ ] MySQL creado en Railway
- [ ] `DATABASE_URL` vinculada al backend
- [ ] Migración `20250609120000_init` aplicada (`prisma migrate deploy`)
- [ ] `/health` responde OK en Railway
- [ ] `NEXT_PUBLIC_API_URL` en Vercel apunta a `/api/v1`
- [ ] `CORS_ORIGIN` incluye dominio Vercel
- [ ] Login probado en producción
- [ ] `.env` no subido a Git

---

## Builds locales

```bash
npm run build --workspace=@tesis/shared
npm run build --workspace=backend
npm run build --workspace=frontend
```
