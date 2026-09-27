# Evidencias — GitHub

Control de versiones y repositorio.

## Qué guardar aquí

| Tipo | Ejemplo |
|------|---------|
| Vista repositorio main | `github-repo-main.png` |
| Historial commits recientes | `github-commits.png` |
| Estructura monorepo | `github-tree-docs-iso.png` |
| Pull request (si aplica) | `github-pr-merge.png` |
| Releases / tags | `releases-v2.0.md` |

## Repositorio

https://github.com/4dr1-2529/taller1

Estado verificado por API el **2026‑09‑27**:

| Elemento | Valor |
|----------|-------|
| `main` | `d3c0b80` (`feat: refresh BLENKIR UI UX`) |
| Homepage | `https://taller1-frontend.vercel.app` (conservado) |
| Description | `BLENKIR — sistema predictivo de riesgo de deserción estudiantil con Next.js, Express, Prisma/MySQL y Ensemble Learning.` (antes `null`) |
| Topics | `nextjs`, `react`, `typescript`, `express`, `prisma`, `mysql`, `fastapi`, `machine-learning`, `ensemble-learning`, `education`, `dropout-prediction` (antes vacíos) |
| Visibilidad | pública (sin cambios) |
| PR #5 | **merged** (squash, 2026‑09‑26) — head `1c4f5ae`; su SonarCloud fue **FAILED** (`C Reliability`) |
| PR #6 | **open** — rama `chore/system-audit-v6` head `f4555ce`; checks ✅ SonarCloud `success`, `validate` ×2 `success`, Vercel Preview `success`; `mergeable=clean`; **sin merge** |
| Ramas | 18 en total → 1 ACTIVE, 1 MERGED, 0 UNIQUE‑WORK, 15 SUPERSEDED → [`docs/GITHUB_BRANCH_AUDIT_V6.md`](../../../GITHUB_BRANCH_AUDIT_V6.md). **No se borró ninguna** |

### Estados de despliegue (commit de `main`)

| Contexto | Estado | Nota |
|----------|--------|------|
| `Vercel` | ✅ `success` | "Deployment has completed" (producción 2026‑09‑26 y previews) |
| `TALLER1 - backend` | ✅ `success` | "No deployment needed — watched paths not modified" |
| `TALLER1 - ml` | ✅ `success` | `ml-production-2a96.up.railway.app` |

Checks de `main`: `validate` ✅ y **`SonarCloud Code Analysis` ❌ `failure`**
(`D Reliability Rating on New Code` + `D Security Rating on New Code`).

> Se inspeccionaron **solo los estados públicos de GitHub**: **no** se leyeron ni modificaron
> variables privadas de Vercel/Railway, y **no** se forzó ningún redeploy.
> Tras el merge de PR #6 deberá verificarse de nuevo: Vercel production, `GET /health` del backend
> y `GET /health` del servicio ML.

## Referencia

[README principal](../../../README.md)
