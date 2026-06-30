# Preprocesamiento

## Entrenamiento (`train.py`)

| Paso | Implementación |
|------|----------------|
| Generación | `generate_synthetic_data(n_samples=2500)` |
| Semilla | `np.random.seed(42)` |
| Ruido | `N(0, 0.015)` añadido a matriz `X` |
| Split | `train_test_split(test_size=0.2, random_state=42, stratify=y)` |
| Escalado | **No implementado** — sin `StandardScaler` ni `MinMaxScaler` |
| Imputación | **No aplica** — datos sintéticos completos |

## Inferencia API

### Capa 1 — Pydantic (`app/main.py` → `PredictInput`)

| Campo | Validación |
|-------|------------|
| `promedio_general` | ge=0, le=20 |
| `asistencia_general` | ge=0, le=100 |
| `tiempo_plataforma` | ge=0, le=24, default 4 |
| `tareas_ratio` | ge=0, le=1 |
| `cursos_desaprobados` | ge=0, le=12, default 0 |
| `uso_foros` | ge=0, le=1, default 0.5 |
| `disminucion_actividad` | ge=0, le=100, default 0 |

### Capa 2 — `validate_predict_payload()` (`utils/validators.py`)

- Convierte a `float`, recorta a rangos `[lo, hi]`.
- Resuelve alias `actividad_lms_prom` ↔ `frecuencia_acceso_lms`.
- `participacion_actividades` default = frecuencia LMS si es null.
- `estado` normalizado: solo `activo`, `en_riesgo`, `retirado`.
- Errores → `ValidationError` → HTTP 422.

### Capa 3 — `_normalize_input()` (`main.py` L122–138)

Unifica campos opcionales antes de `build_feature_vector`.

### Capa 4 — `normalize_estado()` (`features.py`)

Codificación numérica del estado estudiantil.

## Backend Express (pre-ML)

`predict.controller.ts`:

- Obtiene métricas reales de Prisma si hay `studentId`.
- Calcula `cursosDesaprobados`, `disminucionActividad`, `usoForos`.
- Envía payload ya estructurado a FastAPI.

## Lo que NO está en el código

- Normalización z-score de features en train/inferencia
- SMOTE u oversampling de clases minoritarias
- PCA o selección de features automática
- Pipeline sklearn `ColumnTransformer`

El preprocesamiento del proyecto es **validación de rangos + encoding de estado + defaults**, no transformación estadística de escalas.
