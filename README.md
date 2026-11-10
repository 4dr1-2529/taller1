# BLENKIR — Sistema de alerta temprana de riesgo de deserción

BLENKIR es un sistema web de tesis para explorar señales académicas y actividad observada en un LMS, y
presentar alertas de riesgo a directivos y docentes. Incluye paneles para **Director**, **Profesor** y
**Estudiante**, una API y un servicio experimental de Machine Learning (ML).

> **Alcance científico:** la población operativa V6 y el dataset experimental V6 son sintéticos. El
> modelo demuestra el funcionamiento técnico del flujo; no representa evidencia clínica, causal ni
> institucional sobre estudiantes reales. Sus métricas no deben describirse como prevalencia real ni como
> prueba de eficacia en una institución.

## Navegación

- [Arquitectura y responsabilidades](#arquitectura-y-responsabilidades)
- [Datos V6: fuentes, ubicaciones y conteos](#datos-v6-fuentes-ubicaciones-y-conteos)
- [Modelo y resultados experimentales](#modelo-y-resultados-experimentales)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Preparar y ejecutar localmente](#preparar-y-ejecutar-localmente)
- [Pruebas, cobertura y estado auditado](#pruebas-cobertura-y-estado-auditado)
- [Documentación para elaborar el informe](#documentación-para-elaborar-el-informe)

## Enlaces del proyecto

| Recurso | Enlace |
|---|---|
| Repositorio | [4dr1-2529/taller1](https://github.com/4dr1-2529/taller1) |
| Frontend configurado | [Vercel](https://taller1-frontend.vercel.app) |
| API configurada | [Railway](https://backend-production-fcb1.up.railway.app/api/v1) |
| Servicio ML configurado | [Railway](https://ml-production-2a96.up.railway.app) |
| Tablero de calidad | [SonarCloud](https://sonarcloud.io/dashboard?id=4dr1-2529_taller1) |

Los enlaces identifican los recursos configurados; la última auditoría descrita en este README fue local y
no certifica que los despliegues o la base de datos remota sigan disponibles.

## Arquitectura y responsabilidades

```text
Navegador
   │ HTTPS / API autenticada
   ▼
Frontend Next.js + React + TypeScript (:3029)
   │ REST /api/v1
   ▼
Backend Express + TypeScript (:4000) ───────► Prisma ───────► MySQL 8
   │ cliente ML autenticado/validado
   ▼
Servicio FastAPI + Python (:5000) ─────────► Stacking V6 experimental
```

El **frontend** presenta dashboards y vistas según el rol, recopila acciones del usuario y consume la API;
no accede directamente a MySQL ni llama directamente al servicio ML. La **API** centraliza autenticación,
autorización, validación, reglas de negocio, persistencia y trazabilidad. El **servicio ML** valida el
contrato de siete variables y devuelve la predicción y metadatos del modelo. Si el modelo compatible no
está disponible, el sistema informa el error (503); no crea un riesgo ficticio.

| Rol | Alcance principal |
|---|---|
| Director (`admin`) | Supervisión y gestión global de la institución, usuarios, actividad, predicciones y alertas. |
| Profesor (`docente`) | Trabajo con estudiantes y cursos asignados, notas, asistencia, actividades y alertas de su alcance. |
| Estudiante (`estudiante`) | Consulta de información y actividad propias, cursos, asistencia, notas y predicciones propias. |

La autorización se aplica en el backend además de ocultar/mostrar secciones en la interfaz. El código define
20 secciones únicas: 20 para director, 15 para profesor y 12 para estudiante. Las bajas normales son lógicas;
la matrícula y el registro académico aplican reglas transaccionales del año lectivo 2026.

### Tecnologías

| Área | Tecnologías y responsabilidad |
|---|---|
| Web | Next.js 16, React 19, TypeScript; vistas, formularios, dashboards y experiencia por rol. |
| API | Node.js 20+, Express, TypeScript, JWT/refresh tokens, validación y servicios de dominio. |
| Persistencia | Prisma ORM y MySQL 8; esquema, migraciones, catálogos y datos de operación. |
| ML | Python, FastAPI, scikit-learn, XGBoost/HistGradientBoosting; entrenamiento, evaluación e inferencia. |
| Código compartido | `packages/shared`; tipos/utilidades usados por los workspaces web y API. |

## Datos V6: fuentes, ubicaciones y conteos

Hay **dos fuentes V6 distintas**. Para preparar el informe, identificá cuál estás describiendo y citá el
archivo que corresponde; sus filas no son intercambiables.

| Fuente | Archivo vigente | Qué representa | Conteo/identificador |
|---|---|---|---|
| Data Seed V6 operativo | [`backend/prisma/data/definitive-2026/BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx`](backend/prisma/data/definitive-2026/BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx) | Población sintética que se puede importar en una BD local para probar la aplicación: usuarios, matrícula, notas, asistencia, cursos y eventos LMS. | 275 cuentas: 250 estudiantes, 24 docentes y 1 director. `BLENKIR_DATA_SEED_V6_250`, versión `6.0-synthetic-scientific-twin`. SHA-256 del archivo: `0bb7dd701ddc1dd9d14386d7b908ba7238e733e67b522e649da2cab74fcd0a0c`. |
| Dataset experimental ML V6 | [`machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv`](machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv) | Observaciones temporales y etiqueta objetivo usadas en los splits de entrenamiento, validación y holdout. | 450 filas de 225 estudiantes, dos cortes por estudiante; `BLENKIR_V6_SYNTH_20260924`. |
| Artefactos y métricas del experimento | [`machine-learning/artifacts/synthetic/`](machine-learning/artifacts/synthetic/) | Modelo serializado, metadatos, métricas, comparación de modelos y previsualización de predicciones del flujo de ML. | Modelo servido: Stacking; `BLENKIR_V6_BIN_20260924`; contrato `2026-v3`. |

El libro XLSX contiene hojas de referencia de ML, pero **el CSV anterior es la fuente de entrenamiento**.
El importador operativo lee las hojas de datos del XLSX y sus catálogos; no importa las hojas `ML_V6_*` como
población. La documentación del importador incluye inventario y huella SHA-256. Para la población persistida
en una base, consultá el estado de esa base: el conteo de archivos fuente no demuestra que producción esté
sincronizada.

La fuente operativa se valida y se puede simular en memoria, sin conexión a MySQL ni escrituras:

```bash
npm run db:dataset:validate --workspace=backend
npm run db:dataset:dry-run --workspace=backend
```

Se espera `DEFINITIVE_DATASET_VALID=true`, identificador/versión V6 y los conteos descritos en
[`docs/DATASET_DEFINITIVO_2026_V6_LOCAL.md`](docs/DATASET_DEFINITIVO_2026_V6_LOCAL.md). La importación con
`--execute` requiere una BD local preparada, variables y guardas explícitas; **no ejecutar contra producción**
como parte de una verificación ordinaria. No hay seed automático de población al iniciar o desplegar.

## Modelo y resultados experimentales

La versión activa es un **Stacking**: meta-estimador Random Forest con Random Forest y
HistGradientBoosting como estimadores base (XGBoost se evalúa como candidato cuando el entorno es compatible).
Usa, en orden fijo, siete variables: `promedio_general`, `cursos_desaprobados`, `asistencia_general`,
`frecuencia_acceso_lms`, `tiempo_interaccion_lms`, `actividades_realizadas` y `recursos_consultados`.

La selección de modelo/umbral se realiza con validation; el holdout se evalúa una sola vez y no se utiliza
para seleccionar. Resultados del artefacto V6 documentado:

| Evaluación | Modelo seleccionado/servido | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC | Brier |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Validation (68 observaciones) | Stacking; umbral 0.41 | 0.5000 | 0.2826 | 0.9286 | 0.4333 | 0.5913 | 0.2486 | 0.2378 |
| Holdout final (66 observaciones) | Stacking; umbral 0.41 | 0.6364 | 0.3214 | 0.6429 | 0.4286 | 0.6277 | 0.3081 | 0.2011 |

Bandas operativas: **bajo** `p < 0.41`, **medio** `0.41 ≤ p < 0.65`, **alto** `p ≥ 0.65`. En holdout,
Random Forest obtuvo F1 0.4898, superior al F1 0.4286 del Stacking; no se cambió el ganador usando el
holdout porque eso contaminaría la selección. Con 66 observaciones (14 positivas), la comparación no es
concluyente estadísticamente. La precisión baja y falsos positivos son limitaciones relevantes; umbrales y
factores son operativos/experimentales, no validados científicamente. Los “factores” son señales descriptivas,
no SHAP ni causalidad.

Resultados completos y procedencia en [`docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`](docs/ml/RESULTADOS_EXPERIMENTALES_V6.md);
metodología de generación en [`docs/ml/DATA_SEED_V6_METODOLOGIA.md`](docs/ml/DATA_SEED_V6_METODOLOGIA.md);
contrato y pipeline en [`docs/ml/PIPELINE_ML_V6.md`](docs/ml/PIPELINE_ML_V6.md). La fuente reproducible de
las métricas tabulares es `machine-learning/artifacts/synthetic/metrics.json`.

## Estructura del repositorio

```text
backend/
  prisma/                 Esquema, migraciones, seed estructural y XLSX Data Seed V6
  scripts/                Validador, dry-run/importador y utilidades de la API/ML
  src/                    Rutas, controladores, servicios, middleware y validadores
  tests/                  Pruebas backend
frontend/
  src/app/                Rutas y composición Next.js
  src/components/         Shell, dashboards y vistas de cada rol
  src/services/, hooks/   Acceso a API y lógica de interfaz
  tests/                  Pruebas frontend
machine-learning/
  app/                    API FastAPI, features, contrato, umbrales e inferencia
  data/synthetic-scientific-v6/ CSV experimental ML V6
  artifacts/synthetic/    Modelo, metadatos y métricas experimentales generadas
  tests/, train.py        Pruebas y pipeline de entrenamiento
packages/shared/          Código y tipos compartidos entre workspaces
docs/                     Estado, arquitectura, dataset, metodología y resultados auditados
plan-pruebas/, e2e/       Matriz/evidencias y pruebas end-to-end
database/                 Recursos SQL auxiliares
legacy/                   Material histórico; no es fuente operativa vigente
```

Los datos históricos de `legacy/` no se cargan en el flujo vigente. La única población operativa de
demostración es Data Seed V6; el dataset de ML V6 es una fuente de experimento separada.

## Preparar y ejecutar localmente

Requisitos: Node.js 20 o superior, Python 3.9 o superior, `pip` y MySQL 8 (por ejemplo, servicio `mysql` de
`docker-compose.yml`). Configure las variables a partir de [`.env.example`](.env.example); mantenga tokens,
contraseñas y `.env.local` fuera de Git.

```bash
npm ci
npm run build --workspace=@tesis/shared
npm run db:generate
pip install -r machine-learning/requirements.txt
npm run dev
```

`npm run dev` inicia frontend en `:3029`, backend en `:4000` y ML en `:5000`. Para iniciar cada uno por
separado: `npm run dev:web`, `npm run dev:api` o `npm run dev:ml`. Configure las URLs de la API y ML y las
credenciales locales según `.env.example` antes de intentar operaciones que requieren MySQL.

Comandos habituales:

```bash
npm run type-check
npm run lint
npm run test
npm run coverage
npm run build
npm run ml:train       # vuelve a entrenar y regenera artifacts/synthetic
npm run ml:evaluate    # evalúa el holdout guardado sin crear otra partición
npm run ml:test
```

No commitees resultados reentrenados sin registrar el entorno/versión y revisar el cambio de métricas y
artefactos. El modelo experimental serializado no es una autorización para usarlo en decisiones reales.

## Pruebas, cobertura y estado auditado

**Última medición local documentada: 2026-11-10.** Pasaron backend **603/603**, frontend **558/558** y ML
**104/104** pruebas; también `type-check`, `lint` y `build`. SonarQube local midió **90.0% de cobertura
global**, 93.6% de líneas, 77.3% de condiciones y 0.7% de duplicación. El Quality Gate de esa ejecución
estaba OK para código nuevo (89.9% de cobertura de código nuevo, umbral 80%); **la cobertura global no era
100%**. Son mediciones fechadas, no una afirmación de estado continuo ni una cobertura 100% de frontend y
backend.

La auditoría de cobertura, archivos pendientes y comandos de validación está en
[`docs/auditoria-cobertura-local-2026-11-10.md`](docs/auditoria-cobertura-local-2026-11-10.md). El estado de
producto y sus límites está en [`docs/ESTADO_ACTUAL_V6.md`](docs/ESTADO_ACTUAL_V6.md). La importación,
despliegues y base productiva no se verifican al correr las pruebas locales.

## Documentación para elaborar el informe

Usá estos documentos como fuentes de evidencia y conservá separados los hechos de código, los resultados
experimentales y las limitaciones:

| Si el informe trata sobre… | Fuente recomendada |
|---|---|
| Estado vigente, alcance de V6 y qué se verificó | [`docs/ESTADO_ACTUAL_V6.md`](docs/ESTADO_ACTUAL_V6.md) |
| Fuente XLSX, huella, hojas, validación y conteos de importación local | [`docs/DATASET_DEFINITIVO_2026_V6_LOCAL.md`](docs/DATASET_DEFINITIVO_2026_V6_LOCAL.md) |
| Tamaño, diseño, splits y métricas del dataset experimental | [`docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`](docs/ml/RESULTADOS_EXPERIMENTALES_V6.md) |
| Generación, variables y cautelas del dataset sintético | [`docs/ml/DATA_SEED_V6_METODOLOGIA.md`](docs/ml/DATA_SEED_V6_METODOLOGIA.md) |
| Entrenamiento, umbral, contrato API/ML y artefactos | [`docs/ml/PIPELINE_ML_V6.md`](docs/ml/PIPELINE_ML_V6.md) y [`machine-learning/README.md`](machine-learning/README.md) |
| Arquitectura, reglas de negocio y permisos | [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) |
| Rutas, autenticación y contratos de API | [`docs/API.md`](docs/API.md) |
| Resultados y pendientes de cobertura | [`docs/auditoria-cobertura-local-2026-11-10.md`](docs/auditoria-cobertura-local-2026-11-10.md) |
| Casos, matriz y evidencia de QA | [`plan-pruebas/README.md`](plan-pruebas/README.md) |

Al citar resultados, indicá siempre versión del dataset/modelo, tamaño de muestra, split, fecha de la medición
y si el resultado es local. No mezcles las 275 cuentas de la aplicación con las 450 observaciones de ML; no
atribuyas resultados sintéticos a estudiantes reales ni presentes una prueba local como verificación de
producción.
