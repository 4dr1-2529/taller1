# Arquitectura del sistema — Tesis Dashboard v2

## Visión general

Sistema de tres capas para la **identificación del riesgo de deserción estudiantil** (I.E.P. Huancayo, Perú), con fusión de datos académicos y comportamiento LMS.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Backend API    │────▶│  Base de datos  │
│  Next.js :3029  │     │  Express :4000  │     │  SQLite / PG    │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │               ┌─────────────────┐
         └──────────────▶│  ML Service     │
                         │  FastAPI :5000  │
                         │  RF+XGB+Stack   │
                         └─────────────────┘
```

## Carpetas

| Ruta | Rol |
|------|-----|
| `src/` | Frontend Next.js (pages, components, hooks, services) |
| `backend/src/` | API REST, controllers, middleware, validators |
| `backend/prisma/` | ORM y migraciones |
| `ml-service/` | Entrenamiento y predicción ensemble (Python) |
| `database/postgresql/` | Esquema SQL completo (DER producción) |
| `docs/` | Documentación de tesis |

## Roles

- **admin** — configuración y auditoría
- **docente** — cursos y calificaciones
- **tutor** — alertas y seguimiento
- **psicologo** — seguimiento psicológico
- **estudiante** — consulta de su perfil

## Seguridad

- JWT en cabecera `Authorization: Bearer`
- Rate limiting, Helmet, sanitización XSS
- Validación Zod en todas las rutas de escritura
- Prisma parametrizado (anti SQL injection)

## IA

1. **Reglas TypeScript** — fallback offline (`risk-model.ts`)
2. **ML Service** — Random Forest, XGBoost, Stacking con métricas F1, matriz de confusión
