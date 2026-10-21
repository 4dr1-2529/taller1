# Suite E2E local (Sprint 3 — FASE 5)

30 pruebas Playwright (Edge del sistema, `channel: "msedge"`) organizadas en 7
archivos `e2e/specs/*.e2e.ts`, ejecutadas con `node:test` vía `tsx` — mismas
convenciones que el resto de pruebas del repositorio. **Preparada localmente en
el Sprint 3; no publicada.**

## Reglas de seguridad (inviolables)

1. La suite **solo arranca contra hosts locales**. `config.ts` lanza un error si
   `E2E_BASE_URL` no es `localhost`/`127.0.0.1` — nunca corre contra
   `taller1-frontend.vercel.com` ni `backend-production-fcb1.up.railway.app`.
2. Las cuentas son **ficticias** (fixtures F4) de la BD desechable
   `blenkir_refactor_test`; ninguna credencial institucional real.
3. `seed-accounts.ts` tiene puerta propia: se niega a ejecutarse si
   `DATABASE_URL` no contiene `blenkir_refactor_test` (y bloquea hosts tipo
   railway/production).
4. Las respuestas de error se simulan con `page.route` **en el cliente local**;
   ningún servicio externo recibe tráfico.

## Prerrequisitos

- BD desechable `blenkir_refactor_test` con las fixtures F4:
  ciclo completo (reset → `prisma migrate deploy` →
  `npm run test:integration` → `npm run test:integration:roles`) con
  `DATABASE_URL`/`TEST_DB_URL` apuntando a la BD desechable. Ese ciclo fue el
  usado en el Sprint 3 (evidencia `sprint3-*.log` en el informe).
- Node ≥ 20 (verificado con v25.9.0) y `tsx` disponible en la raíz (workspace).

## Ciclo reproducible

```powershell
# 0) entorno de la BD desechable (ejemplo; NUNCA la BD real ni Railway)
$env:DATABASE_URL = "<descartable blenkir_refactor_test>"
$env:JWT_SECRET = "dev-e2e-local"   # solo para desarrollo local

# 1) fixtures F4 + migraciones + suites (ciclo completo del Sprint 3)
npm run db:migrate:deploy
npm run test:integration
npm run test:integration:roles

# 2) contraseñas/correos conocidos para las 5 cuentas E2E
npm run e2e:seed

# 3) stack local (dos terminales)
npm run dev:api     # backend -> http://localhost:4000 (PORT por defecto)
npm run dev:web     # frontend -> http://localhost:3029

# 4) suite E2E
npm run test:e2e
```

- En `next dev` el frontend resuelve la API a `http://localhost:4000/api/v1`
  por defecto (`frontend/src/lib/api-base.ts`), por lo que **no hay riesgo de
  tocar producción**; si se define `NEXT_PUBLIC_API_URL`, debe ser local.
- **Rate-limit (corregido en Sprint 4 / H-1)**: el backend aplica un
  backstop global de 12000 req/15 min por IP en `/api/v1` más un límite
  estricto de 100/15 min en `auth/login`, `auth/refresh` y
  `auth/change-password` (contadores en memoria por proceso). Una corrida
  única de los 30 tests (~900 peticiones) cabe con holgura: **la suite se
  ejecuta completa sin trocear** (`npm run test:e2e`). El límite anterior de
  300/15 min agotaba cerca del final de una corrida única (429 reales en
  F5.28/F5.29, evidencia `sprint3-e2e-run.log`) y motivó la corrección. El
  procedimiento por chunks queda documentado como respaldo si se ajustan
  los límites:

  ```bash
  # corrida completa (post-Sprint 4)
  npm run test:e2e

  # respaldo histórico por chunks (Sprint 3): reiniciar el backend entre
  # (01–02), (03–05) y (06–07) para usar ventana fresca por chunk.
  ```

  La suite reutiliza sesiones (`storageState` en el directorio temporal, con
  auto-reparación si caduca) para minimizar logins.
- Entre corridas completas repita el paso 1 (el reset evita duplicidad de DNI
  en las pruebas de creación F5.13/F5.14).
- Opcional: `E2E_BASE_URL` (por defecto `http://localhost:3029`) y las
  variables `E2E_*_PASSWORD` (por defecto los valores locales de
  `e2e/support/config.ts`).

## Cobertura (mapa FASE 5 → pruebas)

| Ítem FASE 5 | Pruebas |
|---|---|
| Inicio de sesión por rol (5 cuentas) | F5.1 |
| Validación de login (vacío, corta, credencial mala) | F5.2–F5.4 |
| Estados de carga (login) | F5.5 |
| Módulos visibles por rol (presentes/ausentes) | F5.6–F5.8 |
| Navegación básica entre secciones | F5.9, F5.10 |
| Cierre de sesión + exigencia de sesión en `/` | F5.11 |
| CRUD permitido: buscar/crear docente, crear estudiante | F5.12–F5.14 |
| Filtros con estado vacío (matrículas) | F5.15 |
| Recursos (Materiales, Actividades, Avisos, Cursos) | F5.16–F5.18 |
| Notas y asistencia por rol | F5.19–F5.21 |
| Predicciones, alertas y reportes por rol | F5.22–F5.26 |
| Estados vacíos (filtro sin resultados) | F5.27 |
| Errores de API (500 y 403 simulados → reintento) | F5.28, F5.29 |
| Validación de formularios (alta de estudiante) | F5.30 |
| Acceso denegado | Ausencia de secciones ajenas (F5.6–F5.8) + matriz HTTP 401/403 de FASE 4 (`roles-login.integration.ts`) |

## Módulos no probados y motivos

| Módulo/flujo | Motivo |
|---|---|
| Registro de nota y asistencia (flujo completo con selectores en cascada grado→sección→curso→bimestre) | Selectores dependientes sin anclas estables en el código; pendiente de calibración al ejecutar. Respaldo HTTP: FASE 3 (integración) y FASE 4 (F4.3) ya cubren la escritura. |
| "Generar estimación" (POST predict desde la UI) | Requiere ML local en vivo (uvicorn) durante la corrida E2E; para mantener la suite hermética no se incluye. Sprint 4 (FASE 4) verificó en copia aislada que el servicio arranca y responde `/health` + `/predict` correctamente; la responsividad/contrato ML está cubierta por las 32 pruebas unitarias. |
| Descarga/generación de archivos en Reportes | Solo se verifica la carga de la vista ("Reportes académicos"); la exportación binaria queda pendiente de calibración. |
| Vista de Configuración | Solo se verifica su visibilidad por rol (F5.6–F5.8); no forma parte de los ítems de FASE 5. |
| `npm run test:smoke` | Bloqueado por variables `*_INITIAL_PASSWORD` no disponibles en este entorno. |
| Ejecución contra Vercel/Railway | Prohibido por diseño (puertas en `config.ts`). |

## Estructura

```
e2e/
  support/config.ts        # puerta de hosts locales + cuentas ficticias
  support/helpers.ts       # navegador Edge, sesiones reutilizables, aserciones
  support/seed-accounts.ts # fija credenciales en la BD desechable (puerta propia)
  specs/01-login.e2e.ts              # F5.1–F5.5
  specs/02-roles-nav.e2e.ts          # F5.6–F5.11
  specs/03-crud.e2e.ts               # F5.12–F5.15
  specs/04-resources.e2e.ts          # F5.16–F5.18
  specs/05-grades-attendance.e2e.ts  # F5.19–F5.21
  specs/06-predictions-alerts.e2e.ts # F5.22–F5.26
  specs/07-states-errors.e2e.ts      # F5.27–F5.30
```

Anclas de selectores tomadas del código fuente (líneas de referencia al 21-oct
2026): login `frontend/src/app/(auth)/login/page.tsx` (`#login-email`,
`#login-password`, `button.login-submit`); menú
`frontend/src/components/AppSidebar.tsx` (`aria-label` por sección,
`aria-current="page"`, `aria-label="Cerrar sesión"`); etiquetas por rol en
`frontend/src/data/section-labels.ts` y `role-sections.ts`; títulos de vistas
en `frontend/src/components/views/*` y `components/student/*`.
