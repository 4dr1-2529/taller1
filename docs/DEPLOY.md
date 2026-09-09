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

MySQL corre como servicio/plugin en Railway. Si el servicio se llama `MySQL`, Railway expone `MYSQL_URL`; Prisma necesita `DATABASE_URL`. Configure la referencia entre servicios así:

```env
DATABASE_URL=${{MySQL.MYSQL_URL}}
```

El namespace `MySQL` depende del nombre real del servicio en el proyecto Railway. Si el servicio tiene otro nombre, reemplace `MySQL` por ese nombre exacto.

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
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=<GENERAR_SECRETO_ALEATORIO_DE_AL_MENOS_64_CARACTERES>
NODE_ENV=production
HOST=0.0.0.0
CORS_ORIGIN=https://taller1-frontend.vercel.app
ML_SERVICE_URL=<URL_PUBLICA_DEL_SERVICIO_FASTAPI>
```

| Variable | Notas |
|----------|-------|
| `DATABASE_URL` | Referencia a `MYSQL_URL` del servicio MySQL: `${{MySQL.MYSQL_URL}}`; ajuste `MySQL` al nombre real del servicio |
| `JWT_SECRET` | Genere un secreto aleatorio de al menos 64 caracteres |
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

## Railway — configuración manual recomendada (Railpack)

Para un servicio nuevo, configure desde Railway Dashboard con **Railpack**. No dependa de que `railway.toml` sea detectado automáticamente:

| Fase | Comando |
|------|---------|
| Root Directory | `/` |
| Build | `npm install --include=dev && npm run build --workspace=@tesis/shared && npm run prisma:generate --workspace=backend && npm run build --workspace=backend` |
| Start | `npm run start:prod --workspace=backend` |
| Health | `/health` |

`start:prod` ejecuta `railway-start.mjs`:

1. Valida `JWT_SECRET` y normaliza alias de entorno
2. `prisma generate`
3. `prisma migrate deploy`; si aparece P3009, detiene el despliegue sin borrar tablas
4. Inicia `node dist/index.js`

La reparación de P3009 es manual. No se ejecuta `DROP` automáticamente.

## Railway — servicio ML independiente

Configure un segundo servicio con:

| Fase | Configuración |
|------|---------------|
| Root Directory | `/machine-learning` |
| Build | Railpack detecta `machine-learning/Dockerfile` |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-5000}` |
| Variable | `ML_DATA_MODE=demo` mientras no exista dataset/modelo científico real |

El backend debe usar `ML_SERVICE_URL` con la URL real asignada por Railway. No se inventa una URL en esta documentación.

---

## Seed de base de datos (una vez)

Tras el primer deploy exitoso, ejecutar en la **consola Railway** del servicio backend (o localmente con `DATABASE_URL` de Railway):

```bash
npm run db:seed --workspace=backend
npm run db:seed:demo --workspace=backend
```

Credenciales resultantes (contraseña en variable **`DEMO_PASSWORD`** en Railway):

| Rol | Email |
|-----|-------|
| Director | `director.demo@blenkir.edu.pe` |
| Profesor tutor | `profesor1.demo@blenkir.edu.pe` |
| Estudiante | `alumno01.demo@blenkir.edu.pe` |

Defina `DEMO_PASSWORD` antes de `db:seed:demo`. La demo vigente contiene 9 estudiantes, 3 profesores y 1 director; las exportaciones de cuentas no se versionan.

Datos demo: **9 estudiantes**, **3 profesores**, **3 secciones**, notas, asistencia, LMS, predicciones y alertas mínimas.

El script de seed inicial no borra datos y está destinado a una BD Railway nueva. No ejecute resets destructivos en producción. Las reparaciones de una BD existente deben evaluarse y ejecutarse manualmente.

---

## Solución de problemas

### Error P3009 — migración fallida

**Causa habitual:** migración inicial con BOM UTF-8 (Windows) o BD en estado inconsistente.

**Comportamiento vigente:** `prisma migrate deploy` detiene el arranque ante P3009. No se borran tablas automáticamente.

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

1. Ejecute el seed de una BD nueva (sección anterior).
2. Use los correos demo documentados arriba, no archivos exportados.
3. Si las cuentas existen pero fallan: `RUN_REPAIR=1` en Railway y redeploy.

### Login 500 — JWT / sesión

- Verifique `JWT_SECRET` de al menos 64 caracteres
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
- [ ] `DATABASE_URL=${{MySQL.MYSQL_URL}}` o namespace equivalente
- [ ] `JWT_SECRET` de al menos 64 caracteres
- [ ] `CORS_ORIGIN` = URL Vercel de producción
- [ ] `NEXT_PUBLIC_API_URL` en Vercel (Production + Preview)
- [ ] `/health` responde 200
- [ ] Seed ejecutado en BD nueva (`migrate deploy` + `db:seed` + `db:seed:demo`)
- [ ] Login Director, Profesor y Estudiante sin F5 ni 401 en consola
- [ ] Dashboard carga KPIs correctos por rol

---

Ver también: [README.md](../README.md) · [CHANGELOG.md](../CHANGELOG.md) · [docs/pruebas.md](pruebas.md)
