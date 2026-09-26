# Estado actual del sistema — BLENKIR V6

> **AUDITORÍA TÉCNICA — 2026-09-26.** Este documento describe **únicamente lo verificado ejecutando** en
> esta auditoría (rama `chore/system-audit-v6`, base `main = d3c0b80`). Lo que no pudo comprobarse se marca
> explícitamente como **NO VERIFICABLE DESDE EL ENTORNO** o **NO EJECUTADO**. No contiene resultados de la
> investigación ni datos de estudiantes reales.

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
| `SonarCloud Code Analysis` | **failure** |

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
| **Operativa / demo** | Población real con la que trabaja la aplicación (única visible en el panel). Documentada tras la importación definitiva: 275 usuarios (1 director · 24 profesores · 250 estudiantes) | Documentada; **no se consultó la BD productiva** en esta auditoría → recuento no re-verificado |
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

### SonarQube / SonarCloud (FASE 15)

- **Análisis real ejecutado** por CI en el PR #5 y en `main` (no simulado).
- Resultado: **Quality Gate FAILED** — `C Reliability Rating on New Code` (se requería ≥ A).
- No hay `SONAR_TOKEN` en este entorno, por lo que no se lanzó un análisis nuevo ni se modificó configuración.
- Evidencia: `docs/evidencias/sonarqube/sonarcloud-estado-20260926.json`,
  `docs/evidencias/sonarqube/sonarcloud-quality-gate-pr5-20260926.json`.

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

Barrido de secretos (4431 ficheros, solo ficheros y conteos): **sin** tokens GitHub, AWS, Sonar, claves PEM
ni claves Stripe. Hallazgos:

1. **`backend/.env.example` (trackeado) contiene un `JWT_SECRET` de 53 caracteres**, que se repite en tres
   documentos históricos (`legacy/documentation/README.md`, `legacy/documentation/backend/README.md`,
   `legacy/documentation/docs/DEPLOY.md`). No es posible determinar desde aquí si coincide con el de
   producción (las variables de Railway no son legibles) → **se recomienda rotarlo**.
2. Contraseñas demo históricas (`DEMO_PASSWORD`) documentadas en `legacy/documentation/README.md`,
   `AUDITORIA_FINAL_PROYECTO.md` y `database/blenkir-v3/README.md`: son credenciales de la población demo
   antigua, ya deshabilitada.
3. `DATABASE_URL` hallados en docs = URL local sin contraseña (`mysql://root@localhost:3306/…`).

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
| Detalle de incidencias abiertas de SonarCloud | Solo se leyó el comentario público del Quality Gate del PR #5 |

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

**Legacy:** `legacy/` y `estructura de proyecto/` (incluidas referencias a 660 estudiantes, 23 profesores,
9 variables, heurística, Angular o `localhost:5000`): clasificados, **no modificados**.
