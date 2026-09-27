# Auditoría de ramas — GitHub (2026‑09‑27)

Repositorio: `4dr1-2529/taller1` · rama base: **`main` = `d3c0b80`**

> **NO se borró ninguna rama en este paso.** Este documento solo clasifica y recomienda.
> Método: `GET /repos/.../branches`, `GET /repos/.../pulls` y `GET /repos/.../compare/main...{branch}`
> (API con token), contrastado localmente con `git rev-list --left-right --count`,
> `git diff origin/main {branch}` y `git cherry` (patch‑id) para distinguir trabajo único de
> contenido ya presente en `main`.

## Totales

| Clasificación | Cantidad | Ramas |
|---------------|----------|-------|
| **ACTIVE** | 1 | `chore/system-audit-v6` (PR #6 abierto) |
| **MERGED** | 1 | `feat/ui-ux-refresh-v6` (PR #5 fusionado por squash) |
| **UNIQUE‑WORK** | 0 | — |
| **SUPERSEDED** | 15 | ver tabla (contenidos ya cubiertos por `main`) |
| `main` (base) | 1 | `main` = `d3c0b80` |
| **Total** | **18** | |

## Detalle

| Branch | SHA | ahead | behind | Clasificación | Acción recomendada |
|--------|-----|-------|--------|---------------|--------------------|
| `main` | `d3c0b80` | — | — | BASE | No tocar |
| `chore/system-audit-v6` | `f4555ce` | 6 | 0 | **ACTIVE** (PR #6 abierto, `mergeable=clean`) | **NO BORRAR**; esperar squash merge de PR #6 |
| `feat/ui-ux-refresh-v6` | `1c4f5ae` | 3 | 1 | **MERGED** (PR #5, squash 2026‑09‑26) | Verificado: `git diff origin/main` = **0 ficheros** → sin trabajo único; candidata a borrado tras el merge de PR #6 |
| `audit/full-functional-review` | `e797e98` | 0 | 23 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `dataset-definitivo-2026` | `172e591` | 0 | 6 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `fix/final-hardening-pre-seed` | `c3ec595` | 0 | 31 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `fix/role-ux-forms-filters` | `bc04e46` | 0 | 30 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `hardening-blenkir-roles` | `98d2a5b` | 0 | 35 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `preseed-integration` | `d4a0b30` | 0 | 12 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `preseed-legacy-lms-fix` | `b4bd4ae` | 0 | 11 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `refactor-blenkir-codex` | `769c4d3` | 0 | 37 | SUPERSEDED | Candidata a borrado (0 commits propios) |
| `preseed-cleanup-v2` | `8c59dc5` | 1 | 14 | SUPERSEDED | `git cherry` = patch ya presente en `main`; sin trabajo único |
| `preseed-config-fix` | `4c89e5b` | 1 | 14 | SUPERSEDED | `git cherry` = patch ya presente en `main`; sin trabajo único |
| `fix/ui-production-messages` | `4659121` | 1 | 35 | SUPERSEDED | Su commit (mensajes ML en `MlMetricsSection.tsx`) **ya está aplicado en `main`** (verificado leyendo `origin/main`) |
| `railway/code-change-EKUH4C` | `1e2ae80` | 1 | 92 | SUPERSEDED (PR **#1 abierto**) | Cambio (BOM en migración) ya cubierto por `main`; **cerrar PR #1** antes de considerar borrado |
| `railway/code-change-IsTXx9` | `ecdf84c` | 1 | 92 | SUPERSEDED (PR **#2 abierto**) | Ídem; **cerrar PR #2** |
| `railway/code-change-qOhx5-` | `58294bb` | 1 | 51 | SUPERSEDED (PR **#4 abierto**) | Cambio (`backendRoot`/`prismaExecOrThrow` en `railway-start.mjs`) ya en `main`; **cerrar PR #4** |
| `railway/fix-deploy-eb38dc` | `63c988a` | 1 | 51 | SUPERSEDED (PR **#3 abierto**) | Ídem; **cerrar PR #3** |

## Pull requests

| PR | Estado | Head | Base | Nota |
|----|--------|------|------|------|
| #5 | **merged** (squash, 2026‑09‑26) | `feat/ui-ux-refresh-v6` (`1c4f5ae`) | `main` | SonarCloud del head: **FAILED** (`C Reliability`) |
| #6 | **open** | `chore/system-audit-v6` (`f4555ce`) | `main` | checks ✅ (SonarCloud success, validate ×2, Vercel Preview); `mergeable=clean` |
| #1 | open | `railway/code-change-EKUH4C` | `main` | Stale (junio 2026) → cerrar |
| #2 | open | `railway/code-change-IsTXx9` | `main` | Stale → cerrar |
| #3 | open | `railway/fix-deploy-eb38dc` | `main` | Stale → cerrar |
| #4 | open | `railway/code-change-qOhx5-` | `main` | Stale → cerrar |

## Regla de este paso

1. **No se elimina ninguna rama** (ni remota ni local) en la auditoría V6.
2. El borrado —si se decide— se hará **después** del squash merge de PR #6, rama por rama,
   empezando por las `SUPERSEDED` con `ahead = 0` y cerrando antes los PR #1–#4.
3. `chore/system-audit-v6` está **prohibido** borrarla mientras PR #6 siga abierto.
