# BLENKIR · Panel de riesgo de deserción estudiantil — 2026

BLENKIR es el sistema de tesis que predice el **riesgo de deserción estudiantil** combinando datos académicos
(notas, asistencia, matrículas) y actividad observada en el LMS. Expone tres roles:
**Director**, **Profesor** y **Estudiante**.

## Stack y despliegue

| Capa | Tecnología | Despliegue verificado (2026-09-26) |
|------|------------|------------------------------------|
| Frontend | Next.js 16 · React 19 · TypeScript | Vercel — https://taller1-frontend.vercel.app |
| API | Express · TypeScript · JWT + refresh | Railway — https://backend-production-fcb1.up.railway.app/api/v1 |
| Datos | Prisma ORM · MySQL (57 modelos: 54 activos + 3 legacy con `@@ignore`) | Railway |
| Modelo ML | FastAPI · Python · scikit-learn + XGBoost | Railway — https://ml-production-2a96.up.railway.app |

Flujo: `Next.js → Express → Prisma/MySQL` y `Express → FastAPI → Stacking V6`.
**El frontend nunca llama al servicio ML directamente.**

## Roles y secciones

| Rol visible | Rol interno | Secciones del menú |
|-------------|-------------|--------------------|
| Director | `admin` | 20 |
| Profesor | `docente` | 15 |
| Estudiante | `estudiante` | 12 |

Fuente única (la única autorizada): [`frontend/src/data/role-sections.ts`](frontend/src/data/role-sections.ts).
No existe un cuarto rol.

## Modelo ML vigente (V6)

- Algoritmo: **Stacking** (meta-estimador Random Forest sobre RF + XGBoost).
- `modelVersion`: `BLENKIR_V6_BIN_20260924`
- `datasetVersion`: `BLENKIR_V6_SYNTH_20260924`
- `dataMode`: `synthetic_scientific`
- `contractVersion`: `2026-v3`
- `experimental`: `true`
- Selección del modelo **únicamente por validación** (`selection=validation_f1_desercion`,
  `holdout_used_for_selection=false`). El holdout se reserva para la evaluación final.

### Las 7 variables (en este orden)

1. `promedio_general`
2. `cursos_desaprobados`
3. `asistencia_general`
4. `frecuencia_acceso_lms`
5. `tiempo_interaccion_lms`
6. `actividades_realizadas`
7. `recursos_consultados`

### Umbrales de riesgo

| Nivel | Regla sobre la probabilidad `p` |
|-------|---------------------------------|
| Bajo | `p < 0.41` |
| Medio | `0.41 <= p < 0.65` |
| Alto | `p >= 0.65` |

> **ADVERTENCIA — MODELO EXPERIMENTAL · DATOS CIENTÍFICO-SINTÉTICOS.**
> **No representan todavía evidencia científica obtenida con estudiantes reales de la institución.**
> Los umbrales son operativos/experimentales y no están validados científicamente.

### Tres poblaciones distintas (no confundirlas)

1. **Población operativa/demo**: los registros académicos reales que usa la aplicación en producción
   (notas, asistencia, matrículas, actividad LMS). Es la única que el panel muestra como datos institucionales.
2. **Dataset científico-sintético V6 de ML** (`BLENKIR_V6_SYNTH_20260924`, 225 estudiantes sintéticos /
   450 registros): solo alimenta el entrenamiento, la validación y el holdout del modelo. Nunca se presenta
   como prevalencia real de la institución.
3. **Datos reales futuros autorizados**: conjunto aún no obtenido; su captura requiere autorización expresa
   y es la condición para hablar de evidencia científica con estudiantes reales.

Un resultado sintético **no** demuestra la prevalencia real del riesgo en la institución.

## Desarrollo local

```bash
npm ci
npm run build --workspace=@tesis/shared
npm run db:generate
npm run type-check
npm run lint
npm run test --workspace=frontend
npm run test:backend
npm run ml:test
npm run build
```

- Frontend (dev): `npm run dev:web` → http://localhost:3029
- API (dev): `npm run dev:api` → http://localhost:4000
- ML (dev): `npm run dev:ml` → http://localhost:5000
- Prisma: `npm run db:generate`, `npm run db:migrate`, `npm run db:count-models`
- QA: `npm run test:unit`, `npm run test:smoke` (requiere backend y MySQL locales activos),
  `npm run qa:pipeline`
- Variables de entorno: copie `.env.example`; **nunca** suba secretos a Git.

## Datos y seguridad

- Los scripts de población legacy (`db:seed:demo`, `db:reset:demo`, `db:reset:full`, `db:seed:prod`)
  están **deshabilitados**: responden `LEGACY: población y reparaciones antiguas deshabilitadas` y no tocan la BD.
- Sobre producción **no** se ejecutan `db:seed`, `db:push`, migraciones de reset ni limpiezas.
- El Excel antiguo es legacy y no define la arquitectura.
- Cuentas documentadas: [docs/BLENKIR_LOGIN_ACCOUNTS_2026.md](docs/BLENKIR_LOGIN_ACCOUNTS_2026.md).

## Documentación vigente

| Documento | Contenido |
|-----------|-----------|
| [docs/ESTADO_ACTUAL_V6.md](docs/ESTADO_ACTUAL_V6.md) | Estado verificado del sistema (fuente de verdad operativa) |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Arquitectura canónica (7 variables, permisos) |
| [docs/API.md](docs/API.md) | Contratos de la API |
| [docs/roles-permisos.md](docs/roles-permisos.md) | Roles y permisos |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Despliegue Vercel / Railway / ML |
| [docs/machine-learning.md](docs/machine-learning.md) | Pipeline ML |
| [docs/ml/](docs/ml/) | Metodología y resultados experimentales V6 |
| [plan-pruebas/README.md](plan-pruebas/README.md) | Plan y matriz de pruebas (86 casos ISO/IEC 29119) |

Los documentos históricos (`docs/CIERRE_INTEGRAL_BLENKIR_V5_2026.md`, `docs/DATASET_DEFINITIVO_2026_V5_LOCAL.md`,
`AUDITORIA_FINAL_PROYECTO.md`, `legacy/`) conservan sus resultados originales y están marcados como
**HISTÓRICOS / SUPERADOS**: describen etapas anteriores, no el estado vigente V6.
