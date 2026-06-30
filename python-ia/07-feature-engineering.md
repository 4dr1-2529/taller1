# Feature Engineering

## Archivo central

`machine-learning/app/features.py`

## Vector de características

`build_feature_vector(data)` → `np.ndarray` shape `(1, 10)` dtype `float64`.

Orden fijo en `FEATURE_NAMES` (debe coincidir con `train.py` y `features.joblib`).

## Transformaciones implementadas

### 1. Normalización de estado (`normalize_estado`)

| Entrada | Salida numérica |
|---------|-----------------|
| `"activo"`, `"active"` | 1.0 |
| `"en_riesgo"`, `"riesgo"` | 0.5 |
| `"retirado"` u otro | 0.0 |
| int/float ≥2 | 0.0 |
| int/float ≥1 | 0.5 |
| int/float <1 | 1.0 |

### 2. Defaults en inferencia

Si falta un campo en el dict API:

| Feature | Default |
|---------|---------|
| `promedio_general` | 12 |
| `cursos_desaprobados` | 0 |
| `asistencia_general` | 80 |
| `frecuencia_acceso_lms` | `actividad_lms_prom` o 55 |
| `tiempo_plataforma` | 4 |
| `tareas_ratio` | 0.75 |
| `participacion_actividades` | `frecuencia_acceso_lms` |
| `uso_foros` | 0.5 |
| `disminucion_actividad` | 0 |
| `estado` | `"activo"` → 1.0 |

### 3. Score desde probabilidades (`proba_to_score`)

```python
weights = [15.0, 50.0, 90.0]  # bajo, medio, alto
score = dot(proba[:3], weights)  # clip 0-100
```

### 4. Factores explicables (`build_factors`)

Reglas heurísticas post-predicción (no del modelo ML):

| Condición | Factor |
|-----------|--------|
| promedio < 13 | `bajo_promedio` |
| cursos_desaprobados ≥ 2 | `cursos_desaprobados` |
| asistencia < 85 | `baja_asistencia` |
| frecuencia LMS < 60 | `baja_actividad_lms` |
| tareas_ratio < 0.8 | `tareas_incompletas` |
| disminucion > 15 | `caida_actividad` |
| uso_foros < 0.35 | `bajo_foro` |

Retorna **top 5** por `contribution` descendente.

### 5. Recomendación automática (`auto_recommendation`)

Texto según `level` (`alto`/`medio`/`bajo`) y factor principal.

## Origen de datos en producción

`backend/src/services/ml-client.ts` → `buildMlPayload()`:

- `promedio_general` ← `metrics.promedioGeneral`
- `asistencia_general` ← `metrics.asistenciaGeneral`
- `frecuencia_acceso_lms` ← media de `actividadSemanalPct`
- `tareas_ratio` ← entregadas / totales
- `cursos_desaprobados` ← count notas < 11
- `tiempo_plataforma` ← última fila `LmsActividad.horasPlataforma`
- `uso_foros` ← `min(1, conexiones/20)`
- `disminucion_actividad` ← delta primera vs última semana actividad

## Diagrama de variables

![Variables](./diagramas/08-variables.png)

## Entrenamiento sintético

`generate_synthetic_data()` en `train.py` construye features por **perfil estratificado** (ver `09-variables.md`). El score `compute_risk_score()` documenta la lógica de riesgo con pesos actualizados.
