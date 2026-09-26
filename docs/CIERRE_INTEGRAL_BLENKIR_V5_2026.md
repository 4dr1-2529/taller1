# Cierre integral Blenkir V5 — 2026-09-24

> **HISTÓRICO / SUPERADO.** Este informe cierra la etapa **V5** (rama `dataset-definitivo-2026`,
> 2026-09-24). Sirve como antecedente y como fuente de las verificaciones que se ejecutaron entonces;
> **no describe el estado vigente del sistema**, que corresponde a la auditoría V6
> ([ESTADO_ACTUAL_V6.md](ESTADO_ACTUAL_V6.md)). Los resultados internos se conservan sin cambios.

Rama: `dataset-definitivo-2026`. Este documento refleja **únicamente verificaciones ejecutadas**;
lo no ejecutado se declara como pendiente, sin estimaciones.

## 1. Entorno verificado

| Componente | URL | Estado |
|---|---|---|
| Backend | `https://backend-production-fcb1.up.railway.app/api/v1` | ✅ `GET /health` → **200** |
| Frontend | `https://taller1-frontend.vercel.app/login` | ✅ **200** (HTML) |
| Base de datos | Railway MySQL (proyecto `TALLER1`, env `production`) | ✅ solo lectura |

## 2. Data Seed V5 — integridad (solo lectura)

Conteos exactos verificados contra la BD:

| Tabla | Conteo | | Tabla | Conteo |
|---|---:|---|---|---:|
| User | 275 | | Enrollment | 3 724 |
| Teacher | 24 | | Grade | 10 209 |
| Student | 250 | | Attendance | 34 950 |
| Matricula | 250 | | AcademicHistory | 725 |
| Course | 328 | | ResumenAsistencia | 750 |
| TutorSeccion | 8 | | CourseResource | 656 |
| AcademicActivity | 328 | | ActivityProgress | 3 354 |

- Matrícula 2026: 225 activas / 15 retiradas / 10 trasladadas.
- Enrollment por tipo: 3 354 curso / 370 tutoría.
- Correlativos: 250 estudiantes, 24 profesores, 250 matrículas. **Huérfanos = 0.**
- `LmsEvent = 4 611` = 4 610 del import + 1 de un login real (esperado).
- **ML sin entrenar:** todas las tablas ML en 0 salvo `MlFeatureDef = 7`.
- `studentsSinCuenta = 0` → las 275 cuentas quedaron creadas.

Resultado: **`DATA_SEED_V5_INTEGRITY_OK`**.

## 3. Smoke por API contra producción

Comando: `railway run --service backend -- node backend/scripts/smoke-tests.mjs`
(las contraseñas se inyectan como variables de entorno; el script no las imprime).

**67 ok · 0 fallos · exit 0**

- Login V5: director, docente y estudiante ✅
- RBAC permitido: 42 endpoints devuelven 200 ✅
- RBAC denegado: 15 combinaciones devuelven 403 ✅
- `GET /predictions` → **0 ítems** (ninguna predicción fabricada) ✅
- `GET /ml/metrics` → estado honesto «modelo pendiente», sin métricas inventadas ✅
- KPIs reales: 250 estudiantes · 24 profesores · 22 salones · 0 alertas abiertas ·
  `avgRisk = null` · nivel alto = 0 ✅

## 4. Suites locales

| Suite | Resultado |
|---|---|
| `prisma validate` / `prisma generate` | ✅ PASS |
| `type-check` (shared, frontend, backend, tools) | ✅ PASS |
| `lint` (eslint) | ✅ PASS |
| Backend (`node --test` + `tsx --test`) | ✅ **49 + 32 = 81/81** |
| Frontend (`tsx --test`) | ✅ **16/16** |
| ML contrato (`python tests/test_predict.py`) | ✅ **7/7** |
| Contrato de formato de predicción | ✅ **4/4** |
| Build shared / backend / frontend | ✅ PASS |
| `git diff --check` | ✅ limpio |
| `test:integration` | ⚠️ **no ejecutable** — exige MySQL aislada en `127.0.0.1:33316/blenkir_refactor_test` y Docker no está instalado. El test aborta a propósito antes de tocar cualquier BD. El CI **no** lo ejecuta. |

## 5. Honestidad de datos y ML

- `attachPredictions` filtra por `storedPrediction`: con `Prediction = 0` devuelve `[]`.
  `globalRiskScore → null`, `healthScore → null`, listados muestran «Sin predicción».
- `avgRisk = null` (nunca 0 como si fuera dato), `byLevel` y `modelComparison` vacíos.
- `MlMetricsSection` renderiza «aún no disponibles»; un test asegura que la UI nunca
  expone comandos ni puertos internos.
- Exportación de reportes: `Riesgo: "Sin predicción"` cuando no hay predicción persistida.
- Sin `Math.random`, `faker` ni datos demo en `frontend/src` ni `backend/src`.

## 6. Secretos y saneamiento

- **3 evidencias** con JWT (caducadas) redactadas a `[REDACTED_JWT]` en
  `docs/evidencias/{qa,backend}/api-respuestas-locales.txt` y
  `docs/evidencias_finales/qa/api-respuestas-locales.txt`.
- Escaneo final: **0** JWT, 0 claves bcrypt, 0 tokens GitHub/Railway/Vercel, 0 llaves privadas.
  Único hallazgo: el placeholder `SU_CLAVE` de `database/mysql/README.md` (no es un secreto).
- **⚠️ HALLAZGO ABIERTO (producción):** `GET /admin/cuentas-acceso` desplegado devuelve un
  campo `password` en claro. El código local ya lo sustituyó por `passwordEnv` (solo nombres de
  variable), pero **requiere un redeploy de Railway** para surtir efecto.
  **Acciones recomendadas:** redeploy del backend y **rotación** del valor expuesto.

## 7. Pendientes declarados

1. **Barrido visual de navegador** (3 roles × 4 viewports, consola y red) — no ejecutado:
   navegador de escritorio desconectado y contraseñas por rol ausentes en el entorno local.
   Sustituido provisionalmente por el smoke por API de la sección 3.
2. **Redeploy del backend** para publicar la corrección de `/admin/cuentas-acceso` y **rotar**
   el valor expuesto (sección 6).
3. **`test:integration`** — pendiente de un entorno con MySQL aislada en el puerto 33316
   (Docker no disponible). No forma parte del CI.
4. **Servicio ML en producción** — requiere dataset autorizado; entrenar con datos sintéticos
   sigue prohibido. Hasta entonces el sistema informa honestamente que no hay modelo.

## 8. Reglas respetadas

Sin importaciones, sin `db:push`, sin seed, sin reset, sin migraciones, sin cambios de schema,
sin modificar ningún usuario o contraseña, sin predicciones ni métricas ML fabricadas,
sin `railway up`, sin `railway ssh`, sin `railway variable list`, sin cambios en Vercel y sin
fusión a `main`. Ninguna contraseña, token o `DATABASE_URL` se imprimió en ningún artefacto.
