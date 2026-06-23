# Despliegue producción — Vercel + Railway + MySQL

Guía para el entorno en la nube del **Tesis Dashboard v2.0**.

---

## URLs en producción

| Servicio | URL |
|----------|-----|
| **Frontend (Vercel)** | https://taller1-frontend.vercel.app |
| **Backend API (Railway)** | https://taller1-production.up.railway.app |
| **API base (v1)** | https://taller1-production.up.railway.app/api/v1 |
| **Health check** | https://taller1-production.up.railway.app/health |
| **Repositorio** | https://github.com/4dr1-2529/taller1 |

MySQL corre como plugin en Railway. El backend usa la URL **interna** `mysql.railway.internal:3306` vía variable `${{MySQL.DATABASE_URL}}`.

---

## Arquitectura desplegada

```
[Vercel — Next.js 16]
  NEXT_PUBLIC_API_URL → Railway /api/v1
        │ JWT Bearer
        ▼
[Railway — Express + Prisma]
  migrate deploy al arrancar (railway-start.mjs)
        │
        ▼
[Railway — MySQL 8]
  seed: db:seed + db:seed:demo (una vez)
```

El servicio **ML (FastAPI :5000)** no está desplegado en Railway por defecto. En producción, `ML_SERVICE_URL` apunta a localhost; las predicciones usan lógica del backend o requieren desplegar ML por separado.

---

## Variables Railway (servicio backend)

En el dashboard de Railway → servicio **backend** → **Variables**:

```env
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=blenkir_tesis_2026_jwt_secret_min_32_chars
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://taller1-frontend.vercel.app
ML_SERVICE_URL=http://localhost:5000
```

| Variable | Notas |
|----------|-------|
| `DATABASE_URL` | Vincular desde el plugin **MySQL** (`${{MySQL.DATABASE_URL}}`) |
| `JWT_SECRET` | **Mínimo 32 caracteres.** Si es más corto, el backend no arranca |
| `PORT` | Lo inyecta Railway automáticamente — no fijar |
| `CORS_ORIGIN` | URL exacta del frontend Vercel. También acepta `*` o `*.vercel.app` |
| `HOST` | Debe ser `0.0.0.0` para escuchar en Railway |

**Alias en español:** el backend acepta `JWT_SECRETO`, `ORIGEN_CORS`, etc., pero use siempre los nombres en inglés en producción.

---

## Variables Vercel (frontend)

En **Settings → Environment Variables** (Production **y** Preview):

```env
NEXT_PUBLIC_API_URL=https://taller1-production.up.railway.app/api/v1
```

**Root Directory del proyecto en Vercel:** `frontend`

El archivo `frontend/vercel.json` ya define el build del monorepo:

```json
{
  "installCommand": "cd .. && npm install --include=dev",
  "buildCommand": "cd .. && npm run build --workspace=@tesis/shared && npm run build --workspace=frontend"
}
```

---

## Railway — build y start

Configuración en `railway.toml` (raíz del monorepo):

| Fase | Comando |
|------|---------|
| Build | `npm install --include=dev && npm run build --workspace=@tesis/shared && npm run prisma:generate --workspace=backend && npm run build --workspace=backend` |
| Start | `npm run start:prod --workspace=backend` |
| Health | `GET /health` (timeout 120 s) |

`start:prod` ejecuta `railway-start.mjs`:

1. Valida `JWT_SECRET` y normaliza alias de entorno
2. `prisma generate`
3. `prisma migrate deploy` (con recuperación automática si P3009)
4. Inicia `node dist/index.js`

---

## Seed de base de datos (una vez)

Tras el primer deploy exitoso, ejecutar en la **consola Railway** del servicio backend (o localmente con `DATABASE_URL` de Railway):

```bash
npm run db:seed --workspace=backend
npm run db:seed:demo --workspace=backend
```

Credenciales resultantes (contraseña **`mbappe29`**):

| Rol | Email |
|-----|-------|
| Director | `director@blenkir.edu.pe` |
| Profesor tutor | `pro50000001@blenkir.edu.pe` |
| Estudiante | `mateo.quispe0001@blenkir.edu.pe` |

Contraseña: **`mbappe29`**. Listado completo en `docs/cuentas-demo/` (660 alumnos + 23 docentes).

Datos demo: **660 estudiantes**, **23 profesores** (8 tutores + polidocencia), **22 secciones**, notas bimestres I–II, predicciones y alertas.

### Reseed o reparación en Railway (sin consola)

Variables temporales en Railway → redeploy → quitar variable:

| Variable | Efecto |
|----------|--------|
| `RUN_DEMO_SEED=1` | Reseed completo (estructura + demo) |
| `RUN_REPAIR=1` | Reparar emails/contraseñas + notas I–II faltantes |

Actualizar CSV desde producción (local, con API desplegada):

```bash
npm run export:accounts:web
```

---

## Solución de problemas

### Error P3009 — migración fallida

**Causa habitual:** migración inicial con BOM UTF-8 (Windows) o BD en estado inconsistente.

**En repo:** migración corregida + auto-recovery en arranque.

Si persiste y la BD **no tiene datos importantes**:

```bash
npm run db:railway:fix-p3009 --workspace=backend
```

O manualmente (con `DATABASE_URL` de Railway):

```bash
cd backend
npx prisma migrate resolve --rolled-back "20250609120000_init"
npx prisma db execute --file scripts/railway-drop-all-tables.sql --schema prisma/schema.prisma
npx prisma generate
npx prisma migrate deploy
```

Luego **redeploy** del backend.

### Login 401 — usuarios inexistentes o email incorrecto

1. Ejecute el seed (sección anterior) o `RUN_DEMO_SEED=1` en Railway.
2. Use los correos de `docs/cuentas-demo/*.csv` (columna `email_login`), no emails legacy.
3. Si las cuentas existen pero fallan: `RUN_REPAIR=1` en Railway y redeploy.

### Login 500 — JWT / sesión

- Verifique `JWT_SECRET` ≥ 32 caracteres
- El refresh token se guarda hasheado (SHA-256); requiere migraciones aplicadas

### CORS bloqueado

- `CORS_ORIGIN` debe incluir `https://taller1-frontend.vercel.app`
- Tras cambiar CORS, redeploy del backend

### Pantalla trabada / 401 en consola al entrar

Corregido en frontend v2.0.1: el cliente espera a que el rol esté confirmado (`useAuthReady`) antes de llamar APIs de Director, Profesor o Estudiante. Redeploy de Vercel tras actualizar.

### `/health` no responde

1. Revise logs de Railway (migrate deploy, JWT_SECRET)
2. Confirme plugin MySQL activo y `DATABASE_URL` vinculada
3. Espere hasta 120 s (healthcheck timeout)

---

## Vercel — deploy manual

```bash
cd frontend
vercel --prod
```

---

## Builds locales (verificar antes de push)

```bash
npm run build --workspace=@tesis/shared
npm run build --workspace=backend
npm run build --workspace=frontend
npm run type-check
```

---

## Checklist de producción

- [ ] Plugin MySQL activo en Railway
- [ ] `DATABASE_URL` vinculada al backend
- [ ] `JWT_SECRET` ≥ 32 caracteres
- [ ] `CORS_ORIGIN` = URL Vercel de producción
- [ ] `NEXT_PUBLIC_API_URL` en Vercel (Production + Preview)
- [ ] `/health` responde 200
- [ ] Seed ejecutado (`db:seed` + `db:seed:demo`)
- [ ] Login Director, Profesor y Estudiante sin F5 ni 401 en consola
- [ ] Dashboard carga KPIs correctos por rol

---

Ver también: [README.md](../README.md) · [CHANGELOG.md](../CHANGELOG.md) · [docs/pruebas.md](pruebas.md)
