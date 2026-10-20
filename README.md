# BLENKIR · Panel de riesgo de deserción estudiantil

BLENKIR es un sistema web de la tesis que **predice el riesgo de deserción estudiantil** combinando datos
académicos (notas, asistencia, matrículas) y actividad observada en el LMS. Expone tres roles —
**Director**, **Profesor** y **Estudiante** — cada uno con su propio panel.

## Problema y propósito

La deserción estudiantil suele detectarse tarde, cuando el daño ya es difícil de revertir. BLENKIR busca
**señalar tempranamente** a los estudiantes con mayor riesgo para que directivos y docentes puedan actuar
a tiempo, a partir de indicadores que ya se registran en el sistema académico y el LMS.

> **Modelo experimental con datos científico-sintéticos.** El modelo vigente (V6) está entrenado con datos
> sintéticos (`synthetic_scientific`) y aún **no** representa evidencia científica obtenida con estudiantes
> reales de la institución. Los resultados no deben presentarse como prevalencia real del riesgo.

## Enlaces oficiales

| Recurso | Enlace |
|---------|--------|
| Repositorio | https://github.com/4dr1-2529/taller1 |
| Frontend (Vercel) | https://taller1-frontend.vercel.app |
| API (Railway) | https://backend-production-fcb1.up.railway.app/api/v1 |
| Servicio ML (Railway) | https://ml-production-2a96.up.railway.app |
| Calidad de código (SonarCloud) | https://sonarcloud.io/dashboard?id=4dr1-2529_taller1 |

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 · React 19 · TypeScript |
| API | Express · TypeScript · JWT con refresh token |
| Datos | Prisma ORM · MySQL 8 |
| Modelo ML | FastAPI · Python · scikit-learn + XGBoost |

## Arquitectura

```
Next.js (Vercel) → Express (Railway) → Prisma / MySQL
                          └────→ FastAPI (Railway) → Modelo Stacking V6
```

**El frontend nunca llama al servicio ML directamente**: toda predicción pasa por la API, que aplica
autenticación, autorización por rol y validación antes de consultar el modelo. Si el modelo no está
disponible, la API responde `503` sin generar riesgos ficticios.

### Modelo ML vigente (V6)

- Algoritmo: **Stacking** (meta-estimador Random Forest sobre Random Forest + HistGradientBoosting).
- 7 variables predictoras: `promedio_general`, `cursos_desaprobados`, `asistencia_general`,
  `frecuencia_acceso_lms`, `tiempo_interaccion_lms`, `actividades_realizadas`, `recursos_consultados`.
- Umbrales operativos: bajo `p < 0.41`, medio `0.41 ≤ p < 0.65`, alto `p ≥ 0.65`.
- El modelo se sirve solo si coincide exactamente el contrato de 7 variables; no se imputan valores faltantes.

### Roles

| Rol visible | Rol interno | Secciones del menú |
|-------------|-------------|--------------------|
| Director | `admin` | 20 |
| Profesor | `docente` | 15 |
| Estudiante | `estudiante` | 12 |

La autorización se verifica siempre en el backend; no existe un cuarto rol.

## Estructura del repositorio

```
backend/            API Express + esquema Prisma y migraciones (MySQL)
frontend/           Aplicación Next.js (SPA con vistas por rol)
machine-learning/   Pipeline FastAPI: entrenamiento, inferencia y tests del modelo
packages/shared/    Tipos y utilidades compartidas
docs/               Documentación técnica del sistema
plan-pruebas/       Plan y evidencias de pruebas
database/           Esquemas y utilidades SQL
legacy/             Material histórico, fuera del sistema vigente
```

## Desarrollo local

**Requisitos:** Node.js 20+, Python 3.9+ con pip, MySQL 8 (o `docker compose up mysql`).

```bash
npm ci
npm run build --workspace=@tesis/shared
npm run db:generate
pip install -r machine-learning/requirements.txt
```

1. Copie `.env.example` y configure las variables (nunca suba secretos a Git).
2. Levante los servicios con `npm run dev` (o por separado: `npm run dev:web` → :3029,
   `npm run dev:api` → :4000, `npm run dev:ml` → :5000).

Verificaciones: `npm run type-check`, `npm run lint`, `npm run test` (unitarios, backend y ML),
`npm run build`.

## Datos de demostración

La aplicación trabaja sobre una **población operativa de demostración** sembrada en la base de datos
(275 usuarios: 1 director, 24 profesores y 250 estudiantes), generada de forma sintética. Es distinta del
**dataset de entrenamiento del modelo** (225 estudiantes sintéticos) y de los **datos institucionales
reales**, que aún no se han capturado. Al presentar resultados hay que distinguir siempre estas tres
poblaciones: un dato sintético **no** demuestra la prevalencia real del riesgo en la institución.

Los scripts de población antigua (`db:seed:demo`, `db:reset:full`, `db:seed:prod`, entre otros) están
**deshabilitados** y responden con error `LEGACY`; sobre producción no se ejecutan semillas ni
migraciones de reset.

## Estado y limitaciones verificadas (2026-10-20)

- Frontend, API y servicio ML desplegados y respondiendo correctamente.
- SonarCloud activo sobre `main`, con Quality Gate en estado **OK**.
- El modelo es **experimental** (`experimental: true`), entrenado solo con datos sintéticos y **sin
  validación científica con estudiantes reales**: es la limitación principal del proyecto.
- No se han ejecutado pruebas de carga, pentest ni verificación del contenido de la base de datos
  productiva.

## Documentación técnica

La documentación extensa — arquitectura, contratos de API, metodología e indicadores del modelo, pruebas,
capturas y trazabilidad — se mantiene en [`docs/`](docs/):

| Documento | Contenido |
|-----------|-----------|
| [docs/ESTADO_ACTUAL_V6.md](docs/ESTADO_ACTUAL_V6.md) | Estado verificado del sistema |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Arquitectura canónica y permisos |
| [docs/API.md](docs/API.md) | Contratos de la API |
| [docs/machine-learning.md](docs/machine-learning.md) | Pipeline del modelo |
| [docs/BLENKIR_LOGIN_ACCOUNTS_2026.md](docs/BLENKIR_LOGIN_ACCOUNTS_2026.md) | Cuentas de acceso (sin contraseñas) |
| [plan-pruebas/README.md](plan-pruebas/README.md) | Plan y matriz de pruebas |

Los documentos históricos (`legacy/`, `AUDITORIA_FINAL_PROYECTO.md` y los cierres de V5) están marcados
como **HISTÓRICOS / SUPERADOS**: describen etapas anteriores, no el estado vigente.
