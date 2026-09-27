# Estado del Arte del Software — Tesis Dashboard v2.0

> **HISTÓRICO / PARCIALMENTE SUPERADO (revisado 2026‑09‑27).** Estos capítulos justifican con
> literatura (DOI) decisiones de stack que siguen vigentes, pero **varias referencias de código
> describen el pipeline previo a V6**: 10 variables en `FEATURE_NAMES` (hoy **7**), target
> multiclase `bajo/medio/alto` (hoy **binario** `permanece`/`deserta`, con bandas derivadas del umbral),
> «51+ modelos» (hoy **57 modelos Prisma**: 54 activos + 3 `@@ignore`), `generate_synthetic_data()`
> (ya no existe; el dataset se lee del CSV V6) y selección por F1 ponderado (hoy F1 de deserción
> sobre **validation**). Estado vigente: `docs/ml/PIPELINE_ML_V6.md`, `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`
> y `machine-learning/README.md`. Las DOIs y la argumentación científica se conservan **sin modificar**.

Documentación técnica basada **únicamente** en tecnologías implementadas en el repositorio `tesis-dashboard`. Cada capítulo justifica científicamente una decisión de stack mediante artículos recientes con DOI y su vínculo con código fuente verificable.

## Stack documentado

| Capítulo | Tecnologías | Evidencia en código |
|----------|-------------|---------------------|
| [01-frontend](./01-frontend/estado-del-arte.md) | Next.js 16, React 19, Recharts, Tailwind 4, Zod | `frontend/package.json`, `frontend/src/app/(shell)/page.tsx` |
| [02-backend](./02-backend/estado-del-arte.md) | Express 4, APIs REST, Prisma 6 | `backend/src/index.ts`, `backend/src/routes/index.ts` |
| [03-machine-learning](./03-machine-learning/estado-del-arte.md) | Random Forest, XGBoost, Stacking | `machine-learning/train.py`, `machine-learning/app/features.py` |
| [04-dashboard](./04-dashboard/estado-del-arte.md) | Dashboard por rol, KPIs, alertas | `frontend/src/components/dashboard/`, `ROLE_SECTIONS` |
| [05-base-datos](./05-base-datos/estado-del-arte.md) | MySQL, Prisma ORM, **57 modelos Prisma** (54 + 3 `@@ignore`) | `backend/prisma/schema.prisma` |
| [06-seguridad](./06-seguridad/estado-del-arte.md) | JWT, RBAC, bcrypt, Helmet, rate-limit | `backend/src/middleware/auth.ts` |
| [07-arquitectura](./07-arquitectura/estado-del-arte.md) | Monorepo frontend + backend + ML | `frontend/`, `backend/`, `machine-learning/` |

## Arquitectura implementada

```
┌─────────────────┐     REST/JWT      ┌─────────────────┐     HTTP      ┌──────────────────┐
│  Next.js :3029  │ ◄──────────────► │ Express :4000   │ ◄───────────► │ FastAPI ML :5000 │
│  ROLE_SECTIONS  │                   │ 109 rutas + RBAC │               │ RF+XGB+Stacking  │
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

## Biblioteca de artículos (PDF + Word)

Papers científicos y fichas de estado del arte por artículo:

**[docs/ARTICULOS Y ESTADO DEL ARTE/](../docs/ARTICULOS%20Y%20ESTADO%20DEL%20ARTE/README.md)** — artículos 17–23, referencias ML y variable de doble entrada.
