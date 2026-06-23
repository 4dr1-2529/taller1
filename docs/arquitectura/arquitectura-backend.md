# Arquitectura — Capa Backend

**Stack:** Node.js 20 · Express 4 · Prisma 6 · MySQL 8 · Railway

---

## 1. Rol en el sistema

Capa **API REST** que centraliza autenticación, reglas de negocio, persistencia y orquestación del servicio ML.

---

## 2. Capas internas

```
HTTP (routes) → Middleware (auth, RBAC) → Controllers → Services → Prisma → MySQL
                                                      ↘ ml-client → FastAPI
```

| Capa | Responsabilidad |
|------|-----------------|
| Rutas | Enrutamiento `/api/v1` |
| Middleware | JWT, authorize, rate limit, helmet |
| Controladores | Request/response HTTP |
| Servicios | Lógica reutilizable |
| Prisma | ORM tipado |
| MySQL | Persistencia 51 tablas |

---

## 3. Integraciones

| Sistema | Protocolo | Uso |
|---------|-----------|-----|
| Frontend Vercel | HTTPS + JWT | Cliente principal |
| MySQL Railway | `DATABASE_URL` | Datos académicos + predicciones |
| ML Service | HTTP POST `/predict` | Inferencia ensemble |

---

## 4. Endpoints críticos

- `POST /auth/login` — autenticación
- `GET /grades`, `POST /predict` — académico + IA
- `GET /dashboard/kpis` — KPIs
- `GET /alerts` — alertas tempranas
- `GET /profesor/*`, `/estudiante/*` — APIs por rol

---

## 5. Despliegue Railway

- Start: `npm run start:prod` → migrate + API
- Health: `/health`
- Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `ML_SERVICE_URL`

---

## 6. Referencias

- [Detalle técnico completo](../backend/backend-arquitectura.md)
- [Arquitectura general](arquitectura-general.md)
