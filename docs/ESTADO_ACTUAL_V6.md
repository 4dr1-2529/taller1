# Estado actual del sistema — BLENKIR V6

> **AUDITORÍA TÉCNICA — 2026-09-26.** Este documento describe **únicamente lo verificado ejecutando** en
> esta auditoría (rama `chore/system-audit-v6`, base `main = d3c0b80`). Lo que no pudo comprobarse se marca
> explícitamente como **NO VERIFICABLE DESDE EL ENTORNO** o **NO EJECUTADO**. No contiene resultados de la
> investigación ni datos de estudiantes reales.

> **REVALIDACIÓN — 2026-09-27.** Se corrigieron dos hallazgos de la auditoría original: (1) el estado real
> del Quality Gate de SonarCloud — `main` está en **FAILED por `D Reliability` *y* `D Security`** (no solo
> «C Reliability», que fue el fallo del PR #5) — con el detalle de los 27 issues que lo sostienen; y (2) un
> **falso positivo del barrido de secretos**: el `JWT_SECRET` de 53 caracteres es un placeholder de
> documentación, no un secreto versionado. Las secciones afectadas quedan actualizadas y enlazan su
> evidencia.

> **ADVERTENCIA — MODELO EXPERIMENTAL · DATOS CIENTÍFICO-SINTÉTICOS.** No representan todavía evidencia
> científica obtenida con estudiantes reales de la institución.

---

## 1. Método de verificación

| Regla | Aplicación |
|-------|------------|
| Sin operaciones destructivas | Sin `db:push`, sin `migrate dev`, sin seeds, sin redespliegue ni cambio de variables de entorno |
| Base de datos aislada para pruebas | MariaDB 10.4 (XAMPP) en `127.0.0.1:33316`, BD `blenkir_refactor_test`, esquema con `prisma migrate deploy` |
| Producción | Solo peticiones HTTP de lectura (`/health`, `/metrics`, páginas) |
| Secretos | Nunca impresos; los hallazgos se reportan por fichero, longitud y conteo |

---

## 2. Despliegue verificado (2026-09-26)

| Capa | Plataforma | URL comprobada | Resultado |
|------|------------|----------------|-----------|
| Frontend | Vercel | `https://taller1-frontend.vercel.app` | HTTP 200 |
| Backend | Railway | `https://backend-production-fcb1.up.railway.app/health` y `/api/v1/health` | HTTP 200 (`ok:true`, `tesis-api v2.0.0`) |
| ML | Railway | `https://ml-production-2a96.up.railway.app/health` y `/metrics` | HTTP 200 (coherente con el contrato V6) |

Checks de `main` en GitHub (2026-09-26):

| Check | Estado |
|-------|--------|
| `validate` (CI: type-check, lint, tests backend/frontend/ML, build) | success |
| `Vercel` | success |
| `TALLER1 - backend` (Railway) | success |
| `TALLER1 - ml` (Railway) | success |
| `SonarCloud Code Analysis` | **failure** — Quality Gate de `main`: `D Reliability Rating on New Code` y `D Security Rating on New Code` (ambos exigían ≥ A) |

Evidencia: `docs/evidencias/sonarqube/sonarcloud-estado-20260926.json`.

---

## 3. Modelo predictivo vigente (V6)

| Campo | Valor verificado |
|-------|------------------|
| Arquitectura | **Stacking** (bases Random Forest + XGBoost, meta-estimador Random Forest) |
| `modelVersion` | `BLENKIR_V6_BIN_20260924` |
| `datasetVersion` | `BLENKIR_V6_SYNTH_20260924` |
| `dataMode` | `synthetic_scientific` |
| `contractVersion` | `2026-v3` |
| `experimental` | `true` |
| Variables de entrada | **7**, en orden: `promedio_general`, `cursos_desaprobados`, `asistencia_general`, `frecuencia_acceso_lms`, `tiempo_interaccion_lms`, `actividades_realizadas`, `recursos_consultados` |
| Umbral de decisión | `decision_threshold = 0.41` (nivel medio desde 0.41, alto desde 0.65) |
| Criterio de selección | `selection = validation_f1_desercion` · **`holdout_used_for_selection = false`** |
| F1 de la selección | `best_f1_score = 0.4333` (validación) |
| Holdout (ya evaluado una vez) | accuracy `0.6364`, F1 `0.4286`, ROC-AUC `0.6277` |
| Etiquetas | `permanece` / `deserta` (binario); los niveles de riesgo se derivan de la probabilidad |
| Particiones (por estudiante) | 316 / 68 / 66 (entrenamiento / validación / holdout) · 225 estudiantes y 450 registros |

Endpoints del backend: `POST /predict`, `GET /ml/metrics`. `ML_SERVICE_URL` tiene por defecto
`http://localhost:5000` (solo desarrollo); el valor real vive en las variables de entorno de Railway y es
**NO VERIFICABLE DESDE EL ENTORNO**, por lo que la conectividad efectiva Backend → ML (que exige JWT de
admin/docente) queda registrada como no verificada.

Documentación canónica del modelo: `machine-learning/README.md`, `docs/ml/PIPELINE_ML_V6.md`,
`docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`, `docs/ml/DATA_SEED_V6_METODOLOGIA.md`,
`docs/python-ia/modelo-predictivo.md`.

---

## 4. Las tres poblaciones (no confundir)

| Población | Qué es | Estado |
|-----------|--------|--------|
| **Operativa / demo** | **Población operativa/demo persistida** — única que ve el panel. Semilla importada originalmente como **V5**, ejecutándose sobre el sistema técnico vigente **BLENKIR V6**. Documentada tras la importación definitiva: 275 usuarios (1 director · 24 profesores · 250 estudiantes) | Documentada; **no se consultó la BD productiva** en esta auditoría → recuento no re-verificado. **No** es «dato real institucional» |
| **Dataset V6 de ML** | 225 estudiantes / 450 registros **científico-sintéticos** (`dataMode=synthetic_scientific`) | Vigente; base del modelo `BLENKIR_V6_BIN_20260924` |
| **Datos reales futuros** | Registros que se obtendrán con estudiantes de la institución previa autorización | No existen todavía; el software no los genera ni los certifica |

---

## 5. Recuentos verificados contra el código

| Elemento | Valor | Cómo se verificó |
|----------|-------|------------------|
| Modelos Prisma | **57** (54 activos + 3 con `@@ignore`: `LmsActivity`, `LmsEntregaTarea`, `LmsIndicadorEstudiante`) | `npm run db:count-models` (exit 0) |
| Enums Prisma | 14 | Ídem |
| Handlers de API | **112** = 109 `router.<method>()` + 3 `app.get()` | Lectura de `backend/src/routes/index.ts` |
| Rutas autenticadas | 107 con `authenticate` | Ídem |
| Rutas con RBAC | **82** con `authorize(...)` | Ídem |
| Secciones por rol | admin **20**, docente **15**, estudiante **12** (20 únicas) | `frontend/src/data/role-sections.ts` |
| Scripts de población legacy | `db:seed:demo`, `db:reset:demo`, `db:reset:full`, `db:seed:prod` → `backend/scripts/legacy-population-disabled.mjs` (aborta con `LEGACY…`, exit 1, BD intacta) | Ejecución real |

---

## 6. Pruebas ejecutadas en esta auditoría (2026-09-26)

| Comando | Exit | Resultado | Evidencia |
|---------|------|-----------|-----------|
| `npm run type-check` | 0 | Sin errores de tipos (monorepo) | `plan-pruebas/evidencias-finales/terminal/type-check.log` |
| `npm run lint` | 0 | Sin avisos | `plan-pruebas/evidencias-finales/terminal/lint.log` |
| `npm run test:unit` | 0 | 4/4 | `.../terminal/unit-tests.log` |
| `npm run test --workspace=frontend` | 0 | 40/40 | `.../terminal/frontend-tests.log` |
| `npm run test:backend` | 0 | **81/81** (49 `.mjs` + 32 `.ts`) | `plan-pruebas/pruebas-unitarias/evidencias/backend-tests.log` |
| `npm run ml:test` | 0 | 32/32 | `plan-pruebas/pruebas-unitarias/evidencias/ml-tests.log` |
| `npm run build` | 0 | Build correcto | `.../terminal/build.log` |
| `npm run db:count-models` | 0 | 57 modelos | `.../terminal/prisma-count-models.log` |
| `npm run test:integration` | 0 | **39/39** en BD aislada `33316` | `.../terminal/integration-refactor-2026-20260926.log` |
| `npm run test:smoke` | 1 | **NO DISPONIBLE**: faltan `DIRECTOR/TEACHER/STUDENT_INITIAL_PASSWORD` | `.../terminal/smoke-tests.log` |
| `git diff --check` | 0 | Sin conflictos de espacio en blanco | — |

Total de pruebas automatizadas en verde: **153** (81 backend + 40 frontend + 32 ML; las 4 unitarias están
incluidas en las de backend), **más 39 de integración** ejecutadas contra una BD aislada.

### Matriz de pruebas

**86 casos — 80 aprobados · 6 observados · 0 fallidos** (`plan-pruebas/matriz-pruebas/matriz-casos.md`,
regenerada con `generate_matriz.py`, también en `matriz-casos.xlsx`).

Observados: TC-BE-08, TC-DB-04, TC-SEC-07, TC-CN-02, TC-CN-04, TC-UAT-01.

---

## 7. Calidad y normas

| Norma | Estado | Dónde |
|-------|--------|-------|
| ISO/IEC 25010 | Resumen de las 8 características con estado ✅/🔄/📋/⛔ y evidencia real | `docs/iso-25010/calidad-software.md` |
| ISO/IEC 29119 | Plan enlazado a la matriz real (86 casos) y separación entre pruebas de software y métricas ML | `docs/iso-29119/plan-pruebas.md` |
| ISO 9001 | Solo referencias técnicas obsoletas corregidas | `docs/iso-9001/macroproceso-academico.md` |

### SonarQube / SonarCloud (FASE 15 · revalidado 2026-09-27)

- **Análisis real ejecutado** por CI (no simulado). Tres resultados distintos que **no deben
  confundirse**:

| Ámbito | Head | Resultado | Condiciones incumplidas |
|--------|------|-----------|--------------------------|
| PR #5 (ya fusionado) | `1c4f5ae` | **Quality Gate FAILED** | `C Reliability Rating on New Code` (se exigía ≥ A) |
| `main` tras el squash de PR #5 | `d3c0b80` | **Quality Gate FAILED** (check `SonarCloud Code Analysis` = `failure`) | `D Reliability Rating on New Code` **y** `D Security Rating on New Code` (ambos exigían ≥ A) |
| PR #6 (esta rama) | `0e59217` | **Quality Gate PASSED** | ninguna: 7 issues nuevos, 0 Security Hotspots, 0,0 % cobertura y 0,0 % duplicación en código nuevo |

- **Que el PR #6 pase el Quality Gate NO significa que los problemas de `main` estén corregidos.** El
  PR #6 es documentación/QA/branding y su diff no introduce código funcional: solo enmascara el estado
  real, que sigue siendo **FAILED en `main`**. **No se declaró «Sonar resuelto».**
- **Issues exactos que sostienen los ratings D de `main`** (API pública de SonarCloud, rama `main`,
  `sinceLeakPeriod=true`): **27 issues abiertos de New Code** — 20 `BUG` (14 MAJOR, 6 CRITICAL) y
  7 `VULNERABILITY` (1 CRITICAL, 2 MAJOR, 4 MINOR). Reparto por origen:
  - **1 introducido por el PR #5**: `frontend/src/components/views/LearningView.tsx:157`
    (`typescript:S9011`, MAJOR — botón sin `type`); verificado con `git blame` → la línea pertenece al
    commit `d3c0b80` (el squash del PR #5).
  - **26 preexistentes**: el PR #5 solo tocó **58 ficheros, todos en `frontend/`**; el resto están en
    `backend/scripts` (16), `backend/tests` (6), `backend/prisma` (2),
    `machine-learning/app/thresholds.py` (1) y `scripts/prepare-migration.cjs` (1).
- El periodo de New Code de `main` arranca a principios de junio de 2026 (frontera deducida: issues con
  primera detección ≤ 2026-06-05 **no** son New Code; ≥ 2026-06-09 sí) — **no equivale a «código del
  PR #5»**.
- No hay `SONAR_TOKEN` en este entorno: no se lanzó un análisis nuevo, no se modificó el Quality Gate y
  no se reclasificó ningún issue.
- Evidencia: `docs/evidencias/sonarqube/sonarcloud-estado-20260926.json`,
  `docs/evidencias/sonarqube/sonarcloud-quality-gate-pr5-20260926.json`,
  `docs/evidencias/sonarqube/sonarcloud-main-newcode-issues-20260927.json` (27 issues con regla,
  severidad, fichero, línea, mensaje y origen) y `docs/evidencias/sonarqube/sonarcloud-estado-pr6.json`.
- **Pendiente declarado**: corregir esos 27 issues (26 de ellos previos al PR #5) en una rama
  **`fix/sonar-main-quality-gate`, a crear después de fusionar el PR #6** — fuera del alcance de este PR.

### Docker (FASE 16)

- **NO EJECUTADO**: no hay `docker` ni `docker compose` en este entorno y el CI no construye imágenes.
- Único `Dockerfile`: `machine-learning/Dockerfile`.

---

## 8. Seguridad (FASE 22)

Verificado en código y por ejecución:

| Control | Evidencia |
|---------|-----------|
| JWT de acceso + refresh | `backend/src/middleware/auth.ts`, `backend/src/controllers/auth.controller.ts` |
| Refresh token guardado como hash SHA-256 (no en claro) | `hashToken()` → `crypto.createHash("sha256")`, `backend/src/utils/tokens.ts` |
| bcrypt con 12 rondas | `auth.controller.ts`, `student-registration.service.ts`, `teacher-registration.service.ts` |
| RBAC de tres roles | `authorize(...roles)` en 82 rutas; `teacher-scope`, `estudiante-scope` |
| Helmet, CORS con whitelist, sanitización de cuerpo | `backend/src/index.ts`, `backend/src/middleware/sanitize.ts` |
| Rate limiting global | `backend/src/index.ts` |
| Auditoría | `audit_log` / `GET /admin/audit-logs` |
| Pruebas | 39/39 de integración (login, refresh, logout, cambio de clave) en BD aislada |

Barrido de secretos (**4508** ficheros del árbol de trabajo, de los cuales **943** están versionados por
git; solo ficheros, conteos y si están trackeados — re-ejecutado con clasificación corregida el
2026-09-27): **sin** tokens GitHub, AWS, Sonar, claves PEM ni claves Stripe. Hallazgos:

1. **`JWT_SECRET`: placeholder confirmado — cero secretos reales versionados.** `backend/.env.example`
   (idéntico en `origin/main` y en `chore/system-audit-v6`) contiene
   `JWT_SECRET=<GENERAR_SECRETO_ALEATORIO_DE_AL_MENOS_64_CARACTERES>`: es un **placeholder de
   documentación**, no un secreto; sus 53 caracteres son los del propio texto. El mismo texto se repite en
   tres documentos históricos (`legacy/documentation/README.md`,
   `legacy/documentation/backend/README.md`, `legacy/documentation/docs/DEPLOY.md`). Los dos únicos usos
   restantes **generan el valor en ejecución** (`.github/workflows/ci.yml` y
   `backend/tests/fixtures/definitive-domain-equivalence.mjs`). **Resultado del barrido:
   `jwt_secret_real_versionado = 0`.** El barrido original clasificó ese placeholder como «valor»
   (falso positivo) y la lógica se corrigió; por ello **la rotación del secreto de producción NO puede
   recomendarse como obligatoria basándose en este hallazgo**. El **valor productivo no fue
   inspeccionado** (las variables de entorno de Railway no son legibles desde este entorno).
2. Contraseñas demo históricas (`DEMO_PASSWORD`) documentadas en `legacy/documentation/README.md`,
   `AUDITORIA_FINAL_PROYECTO.md` y `database/blenkir-v3/README.md`: son credenciales de la población demo
   antigua, ya deshabilitada.
3. `DATABASE_URL` en docs: **7 sin password** (`mysql://root@localhost:3306/…`), **1 con password
   placeholder** (`SU_CLAVE`) y **0 con una clave real**.
4. 71 coincidencias del patrón heurístico `password_literal` (pruebas, validadores, scripts y docs). Los
   ficheros de código productivo revisados no contienen una credencial de producción en claro.

Evidencia: `docs/evidencias/seguridad/barrido-secretos-20260926.json`,
`docs/evidencias/seguridad/difusion-secretos-documentados-20260926.json`.

---

## 9. Qué NO quedó verificado

| Tema | Estado |
|------|--------|
| Valor de `ML_SERVICE_URL` en Railway y conectividad Backend → ML | **NO VERIFICABLE DESDE EL ENTORNO** (exige sesión de Railway y JWT) |
| Contenido de la BD productiva (usuarios, matrículas, notas) | **NO VERIFICABLE DESDE EL ENTORNO** (sin credenciales de producción) |
| `npm run test:smoke` (login contra entorno local con credenciales) | **NO DISPONIBLE** — faltan `*_INITIAL_PASSWORD` |
| Pruebas de carga / rendimiento | **NO EJECUTADAS** |
| Build y despliegue de imagen Docker | **NO EJECUTADO** — Docker no instalado |
| Prueba de intrusión y rotación real de secretos | **NO EJECUTADAS** — requieren acceso al proveedor |
| Detalle de incidencias abiertas de SonarCloud | **Obtenido el 2026-09-27** vía API pública: los 27 issues de New Code de `main` con regla, severidad, fichero, línea y origen (`docs/evidencias/sonarqube/sonarcloud-main-newcode-issues-20260927.json`). Queda sin verificar qué líneas se ejecutan en producción |

---

## 10. Documentos canónicos y históricos

**Vigentes (fuente de verdad):**

- `README.md` — presentación, stack, roles, modelo V6 y advertencia.
- `docs/ARQUITECTURA.md` — **documento canónico de arquitectura**.
- `docs/ESTADO_ACTUAL_V6.md` — este archivo.
- `docs/ml/*` y `machine-learning/README.md` — pipeline y resultados del modelo.
- `plan-pruebas/` — plan y matriz vigentes (**86 casos**).
- `docs/DEPLOY.md` — despliegue y verificación de URLs.
- `docs/evidencias/sonarqube/`, `docs/evidencias/seguridad/` — evidencias de esta auditoría.

**Históricos / superados (conservados sin modificar sus resultados):**

- `docs/CIERRE_INTEGRAL_BLENKIR_V5_2026.md`, `docs/DATASET_DEFINITIVO_2026_V5_LOCAL.md`,
  `docs/PENDIENTES_PRE_DATA_SEED_200.md`, `docs/MAIN_RELEASE_READINESS_2026.md`,
  `docs/QA_FINAL_BLENKIR_2026.md`, `plan-pruebas/REPORTE-FINAL-PRUEBAS.md`,
  `plan-pruebas/evidencias-finales/` y `docs/evidencias_finales/`.
- `docs/INFORME_FINAL_V6.md` y `docs/PRESENTACION_V6_ESTADO.md` — ejecución local de su ciclo, con nota de
  actualización.

**Legacy:** `legacy/` (íntegro, **sin modificar**) y `estructura de proyecto/` (referencias a 660
estudiantes, 23 profesores, heurística, Angular o `localhost:5000` conservadas; solo se corrigieron
recuentos y población en la revisión 2026‑09‑27 — ver §11.1). `estado-del-arte-software/` conserva su
literatura con DOI y lleva banner **HISTÓRICO / PARCIALMENTE SUPERADO** (10 variables, multiclase,
`generate_synthetic_data` referenciados como pipeline anterior). Todo está clasificado, **nada fue
borrado**.

---

## 11. Barrido de coherencia de población (2026‑09‑27)

Se barrió el repositorio completo en busca de la población antigua
**660 / 23 profesores / V5 / 9‑features / 51 tablas / 14‑10‑6** y de flujos obsoletos.
Ningún reemplazo global: cada coincidencia restante está clasificada abajo.

### 11.1 Corregido en esta pasada (era CURRENT incorrecto)

| Archivo | Corrección |
|---------|-----------|
| `docs/arquitectura/arquitectura-frontend.md` | Secciones por rol 14/10/6 → **20/15/12** (fuente `frontend/src/data/role-sections.ts`) + nota de KPIs no hardcodeados |
| `docs/machine-learning.md` | Reescrito como **resumen V6** (2026‑v3, Stacking, target binario, 450 snapshots / 225 estudiantes, umbrales 0.41/0.65); tabla de afirmaciones SUPERADAS |
| `README.md`, `docs/ESTADO_ACTUAL_V6.md` | «datos institucionales / población real» → **población operativa/demo persistida** (250/24/1 = 275), semilla importada como V5 sobre BLENKIR V6 |
| `docs/pruebas.md`, `docs/pruebas-funcionales.md`, `docs/postman.md`, `docs/cuentas-demo/README.md` | «Data Seed V5 vigente» → población operativa (procedencia V5); 58 tests → **81**; workflow local seguro (sin `db:seed:demo`/`db:push` en producción); tabla de resultados 2026‑09‑27 |
| `database/mysql/README.md` | Workflow seguro de BD local/aislada; `db:seed:demo`/`db:reset:*` marcados deshabilitados; prohibido `db:push` en producción |
| `database/blenkir-v3/README.md` | Cabecera **LEGACY / NO EJECUTAR PARA BLENKIR V6**; retirada la recomendación de `db:reset:full` y el «seed vigente crea 9 estudiantes»; 660 y 51 tablas conservados **como historia** |
| `backend/prisma/seed.ts` | **Solo comentarios/logs**: «(51 tablas)» → «6 grados · 22 secciones · 16 cursos · RBAC · 7 ML features». Lógica intacta |
| `plan-pruebas/pruebas-caja-negra/login.md` | admin 14 / docente 10 / estudiante 6 → **20 / 15 / 12** |
| `plan-pruebas/pruebas-caja-negra/profesores.md` | `GET /teachers` «23 activos seed» → **24 activos de la población operativa** |
| `plan-pruebas/pruebas-unitarias/frontend.md` | Tabla `ROLE_SECTIONS` → **20/15/12** y referencia a `role-sections.ts` |
| `plan-pruebas/plan-general/{recursos,plan-pruebas,ambiente-pruebas}.md` | «Data Seed definitivo V5» → población operativa (procedencia V5); `db:push` acotado a BD local |
| `estructura de proyecto/ESTRUCTURA_COMPLETA.md` | «52 modelos / 52 tablas» → **57 modelos Prisma (54 + 3 `@@ignore`)**, verificado con `npm run db:count-models`; hallazgo D actualizado |
| `AUDITORIA_FINAL_PROYECTO.md` | Banner **HISTÓRICO** que cubre todo el documento; «vector vigente 9 variables» → vector de esa fase (V6: **7 variables**) |
| `docs/INDICE-ISO.md` | `cuentas-demo` unificado: población operativa actual 1+24+250, procedencia V5, sistema BLENKIR V6 |
| `docs/API.md` | Título «API Blenkir 2026-v2» → **API BLENKIR 2026** + nota: «v2» es el release `2.0.0`, no el dataset ML |
| `estado-del-arte-software/README.md`, `estado-del-arte-software/03-machine-learning/estado-del-arte.md` | Banner **HISTÓRICO / PARCIALMENTE SUPERADO** (literatura DOI intacta); «51+ modelos» → **57 modelos Prisma**; 10 variables / multiclase / `generate_synthetic_data()` / selección por F1 ponderado marcados como pipeline previo a V6 |
| `estructura de proyecto/ESTRUCTURA_COMPLETA.md` (§7.2/§7.3), `python-ia/README.md` (índice), `python-ia/01-arquitectura.md` | Payload «diez variables» → **7 variables V6** (lista actualizada + nota de las 5 retiradas); «selección por F1» → F1 de deserción sobre validation; «heurística si no hay artefacto» → **error honesto**; índice «10 variables» → 7 |

### 11.2 Generadores corregidos o deshabilitados

| Archivo | Estado |
|---------|--------|
| `scripts/evidence/generate-iso-matrix.mjs` | ✅ Corregido: sin 660/23 hardcodeados («KPIs obtenidos de la BD del entorno de prueba», «Listado de profesores del dataset operativo»); filas `ia/` marcadas **HISTÓRICA**; nota de procedencia en la salida. Regenerado y sincronizado en `docs/evidencias/iso/` |
| `scripts/evidence/generate-architecture-diagrams.py` | ✅ Corregido: 57 modelos Prisma, dataset CSV V6 + `features.py`, pipelines RF/XGB/Stacking con target binario (300 árboles/estimators, meta‑RF 150, `cv=3`), ISO 29119 con **86 casos (80/6/0)** y gráfico ISO 25010 por **estados** (VERIFICADO/PARCIAL/BLOQUEADO/PLANIFICADO desde `docs/iso-25010/calidad-software.md`) — sin porcentajes inventados. `py_compile` ✅; diagramas regenerados |
| `scripts/evidence/generate-ml-charts.py` | ⛔ **LEGACY / DESHABILITADO**: reescrito como stub que termina con `exit 1` sin escribir nada (antes intentaba `generate_synthetic_data(2500)` y target multiclase; además no compilaba). No lo invoca `evidence:generate` |
| `python-ia/scripts/generate_diagrams.py` | ⛔ **LEGACY / NO USAR PARA EVIDENCIA V6**: guard al inicio → `exit 1` antes de importar dependencias; imágenes conservadas como históricas |
| `scripts/evidence/config.mjs` | ✅ Comentarios «Data Seed V5» → «población operativa actual» (lógica de credenciales intacta) |

### 11.3 Coincidencias restantes y clasificación (barrido final)

| Término | Ficheros restantes | Clasificación | Razón para conservarlo |
|---------|--------------------|---------------|------------------------|
| `660`, `23 profesores` | `database/blenkir-v3/*` (README, DER, SQL), `legacy/documentation/*`, `legacy/database/blenkir-v3/*` | **LEGACY** | Diseño SQL/población de tesis; carpeta con cabecera «NO EJECUTAR PARA BLENKIR V6» |
| `660`, `23 profesores` | `estructura de proyecto/ESTRUCTURA_COMPLETA.md`, `docs/evidencias_finales/**`, `plan-pruebas/evidencias-finales/**`, `plan-pruebas/**/evidencias/**` (JSON/logs), `docs/tesis/*` | **HISTORICAL** | Informes/evidencia de ejecuciones anteriores; cabeceras «Histórico / no describe el estado actual» |
| `660` | `backend/prisma/demo-data/peruvian-names.ts` (comentario 1–660), `backend/scripts/generate-accounts-canvas.mjs` (etiqueta), `backend/scripts/reset-academic-data.mjs` (comentario ~660) | **LEGACY** | Utilidades del generador de población antiguo; el `seed.ts` activo **no** los importa. Pendientes de limpieza en la rama futura `fix/sonar-main-quality-gate` |
| `660` | `docs/evidencias*/**/flujo-api-completo.svg` (`translate(660.27…`) | **FALSO POSITIVO** | Coordenada SVG, no población |
| `14/10/6`, `14 secciones` | `legacy/documentation/docs/frontend/frontend-arquitectura.md` | **LEGACY** | Copia histórica de la arquitectura anterior |
| `14 secciones` | `docs/iso-25010/calidad-software.md`, `plan-pruebas/matriz-pruebas/*` | **HISTORICAL (correcto)** | «UAT histórico ejecutado con 14 secciones; hoy son 20» |
| `9 features / 9 variables` | `database/blenkir-v3/DER-BLENKIR.md`, `legacy/documentation/**`, `python-ia/*.md` | **HISTORICAL / LEGACY** | Variables de la tesis y del pipeline previo; `python-ia/README.md` marcado HISTÓRICO/PARCIALMENTE SUPERADO |
| `10 variables`, `diez variables`, multiclase como target, `generate_synthetic_data()` como código actual | `estado-del-arte-software/**` (README + cap. 03/04), `estructura de proyecto/ESTRUCTURA_COMPLETA.md` (§7.2 corregida a 7) | **HISTORICAL** (banner añadido) / **corregido** | La literatura con DOI se conserva; las referencias al código anterior quedan bajo el banner HISTÓRICO y §7.2 lista hoy las 7 variables V6 |
| `51 tablas` | `database/blenkir-v3/*`, `legacy/documentation/CHANGELOG.md` | **HISTORICAL** | Esquema SQL de tesis; vigente = 57 modelos Prisma |
| `52 modelos` | `legacy/documentation/*` | **LEGACY** | Recuento de una etapa anterior; vigente = 57 |
| `V5` | `docs/cuentas-demo/README.md`, `docs/pruebas*.md`, `docs/postman.md`, `plan-pruebas/*`, `README.md`, `docs/ESTADO_ACTUAL_V6.md` | **CURRENT con procedencia explícita** | Siempre como «semilla importada originalmente como V5 sobre el sistema vigente BLENKIR V6» |
| `V5` | `docs/CIERRE_INTEGRAL_BLENKIR_V5_2026.md`, `docs/DATASET_DEFINITIVO_2026_V5_LOCAL.md` | **HISTORICAL** | Documentos de cierre de esa etapa (listados en §10) |
| `db:seed:demo`, `db:reset:full`, `db:push` | `README.md`, `docs/DEPLOY.md`, `docs/pruebas*.md`, `database/mysql/README.md`, `plan-pruebas/**`, `docs/INFORME_FINAL_V6.md`, `docs/PRESENTACION_V6_ESTADO.md`, `docs/ml/DATA_SEED_V6_METODOLOGIA.md` | **SUPERSEDED (solo como «deshabilitado/prohibido»)** | Todas las apariciones documentan que el comando aborta (`legacy-population-disabled.mjs`) o que está prohibido en producción |
| `db:seed:demo`, `db:reset:*` | `legacy/documentation/*`, `estado-del-arte-software/*` | **LEGACY / HISTORICAL** | Descripción de la etapa en que existían (el artículo indica además que hoy están deshabilitados) |
| `generate_synthetic_data`, `2500` | `python-ia/*.md`, `python-ia/scripts/generate_diagrams.py`, `legacy/ml-v1/*`, `docs/evidencias*/ia/*`, `plan-pruebas/**/metricas-ml.json` | **LEGACY / HISTORICAL** | Pipeline previo; ambos scripts generadores ahora terminan con `exit 1` |
| `multiclase`, `bajo/medio/alto`, `F1=1.0`, `random_forest` como ganador, `no hay ganador`, `entrenamiento futuro`, `200 registros` | `python-ia/*.md` (con nota «modelo vigente = Stacking V6»), `docs/tesis/*`, `legacy/`, `docs/machine-learning.md` (tabla SUPERADA) | **HISTORICAL / SUPERSEDED** | Corrida antigua documentada como tal; el estado vigente es Stacking V6 binario con métricas publicadas |
| `taller1-production.up.railway.app` | `docs/MAIN_RELEASE_READINESS_2026.md`, `docs/cuentas-demo/README.md` («obsoleto»), `legacy/documentation/*` | **HISTORICAL / LEGACY** | Dominio huérfano descrito como tal (404) o archivo histórico |
| `I.E.P. Huancayo` | `database/postgresql/schema.sql`, `database/dbml/schema.dbml` | **HISTORICAL** | Esquemas de referencia no ejecutados (PostgreSQL/DBML); el frontend no contiene ese hardcode |

**Resultado del barrido:** ninguna coincidencia restante queda clasificada como CURRENT incorrecta.

### 11.4 GitHub (mismo ciclo de auditoría)

- Metadatos del repositorio actualizados (description + 11 topics) vía API; **homepage y visibilidad sin cambios**.
- `docs/GITHUB_BRANCH_AUDIT_V6.md` — 18 ramas clasificadas (1 ACTIVE, 1 MERGED, 0 UNIQUE‑WORK, 15 SUPERSEDED). **No se borró ninguna**.
- `docs/evidencias/github/README.md` — estados de despliegue (Vercel ✅ · TALLER1 backend ✅ · TALLER1 ml ✅) y checks de `main` (`SonarCloud` ❌).
