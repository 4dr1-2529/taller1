# Estado del Arte del Software — Tesis Dashboard v2.0

Documentación técnica basada **únicamente** en tecnologías implementadas en el repositorio `tesis-dashboard`. Cada capítulo justifica científicamente una decisión de stack mediante artículos recientes con DOI y su vínculo con código fuente verificable.

## Stack documentado

| Capítulo | Tecnologías | Evidencia en código |
|----------|-------------|---------------------|
| [01-frontend](./01-frontend/estado-del-arte.md) | Next.js 16, React 19, Recharts, Tailwind 4, Zod | `frontend/package.json`, `frontend/src/app/(shell)/page.tsx` |
| [02-backend](./02-backend/estado-del-arte.md) | Express 4, APIs REST, Prisma 6 | `backend/src/index.ts`, `backend/src/routes/index.ts` |
| [03-machine-learning](./03-machine-learning/estado-del-arte.md) | Random Forest, XGBoost, Stacking | `machine-learning/train.py`, `machine-learning/app/features.py` |
| [04-dashboard](./04-dashboard/estado-del-arte.md) | Dashboard por rol, KPIs, alertas | `frontend/src/components/dashboard/`, `ROLE_SECTIONS` |
| [05-base-datos](./05-base-datos/estado-del-arte.md) | MySQL, Prisma ORM, 51+ modelos | `backend/prisma/schema.prisma` |
| [06-seguridad](./06-seguridad/estado-del-arte.md) | JWT, RBAC, bcrypt, Helmet, rate-limit | `backend/src/middleware/auth.ts` |
| [07-arquitectura](./07-arquitectura/estado-del-arte.md) | Monorepo frontend + backend + ML | `frontend/`, `backend/`, `machine-learning/` |

## Arquitectura implementada

```
┌─────────────────┐     REST/JWT      ┌─────────────────┐     HTTP      ┌──────────────────┐
│  Next.js :3029  │ ◄──────────────► │ Express :4000   │ ◄───────────► │ FastAPI ML :5000 │
│  ROLE_SECTIONS  │                   │ 87 rutas + RBAC │               │ RF+XGB+Stacking  │
└─────────────────┘                   └────────┬────────┘               └──────────────────┘
                                               │ Prisma
                                               ▼
                                        ┌─────────────────┐
                                        │   MySQL (XAMPP) │
                                        └─────────────────┘
```

## Formato de cada capítulo

1. Introducción  
2. Problema  
3. Seis o más artículos científicos (DOI + aporte + comparación + aplicación al proyecto)  
4. Conclusión  

**Proyecto:** I.E.P. BLENKIR — Sistema de predicción de riesgo de deserción estudiantil.
