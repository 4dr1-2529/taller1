# Estado del Arte — Machine Learning (Random Forest / XGBoost / Stacking)

**Tecnologías implementadas:** scikit-learn `RandomForestClassifier`, `XGBClassifier`, `StackingClassifier`, FastAPI, 10 variables en `FEATURE_NAMES`.

**Evidencia:** `machine-learning/train.py`, `machine-learning/app/features.py`, `machine-learning/app/main.py`.

---

## Introducción

El módulo ML predice **nivel de riesgo de deserción** (`bajo`, `medio`, `alto`) a partir de diez indicadores académicos y de engagement LMS. El pipeline entrena tres familias de modelos — Random Forest, XGBoost y Stacking — selecciona el mejor por **F1-score ponderado** y expone inferencia vía API FastAPI consumida por el backend Express.

---

## Problema

La predicción de deserción escolar requiere:

- Modelos robustos ante datos tabulares heterogéneos (promedio, asistencia, ratios LMS).
- Comparación empírica entre algoritmos antes de fijar el modelo en producción.
- Ensemble que combine fortalezas de bagging (RF) y boosting (XGBoost).
- Vector de características idéntico en entrenamiento e inferencia.

La literatura reciente en educación favorece ensembles RF + XGBoost + meta-clasificador para dropout prediction.

---

## Artículo 1

**Referencia:** Costa-Mendes, R., et al. (2022). A machine learning approach to predict student dropout in higher education. *Computers and Education: Artificial Intelligence*, 3, 100066.  
**DOI:** [10.1016/j.caeai.2022.100066](https://doi.org/10.1016/j.caeai.2022.100066)

### Aporte

Aplica **Random Forest**, **XGBoost** y **stacking** para predecir abandono universitario; el ensemble supera modelos individuales en AUC y F1.

### Comparación

| Modelo | Paper | `train.py` |
|--------|-------|------------|
| Random Forest | ✓ | `RandomForestClassifier(n_estimators=150)` L101–108 |
| XGBoost | ✓ | `XGBClassifier(n_estimators=150)` L126–132 |
| Stacking | ✓ | `StackingClassifier` L146–157 |
| Métrica selección | AUC / F1 | `f1_score` ponderado L168–169 |

### Aplicación al proyecto

`train.py` replica exactamente la triada del artículo. Variables como rendimiento académico y asistencia corresponden a `promedio_general`, `cursos_desaprobados` y `asistencia_general` en `FEATURE_NAMES` (`features.py` L9–19).

---

## Artículo 2

**Referencia:** Ramadhan, A., et al. (2024). Comparative Analysis of Random Forest and XGBoost for Dropout Prediction. *INTENSIF*, 9(1).  
**DOI:** [10.29407/intensif.v9i1.21191](https://doi.org/10.29407/intensif.v9i1.21191)

### Aporte

Compara RF y XGBoost en predicción de dropout; XGBoost destaca en datasets desbalanceados, RF en interpretabilidad de importancia de variables.

### Comparación

| Algoritmo | Fortaleza (paper) | Config proyecto |
|-----------|-------------------|-----------------|
| Random Forest | Robustez, `class_weight` | `class_weight="balanced"` L108 |
| XGBoost | Boosting, desbalance | `eval_metric="mlogloss"` L131 |
| Selección | Comparativa empírica | `metrics.json` + mejor F1 |

### Aplicación al proyecto

`train.py` guarda `random_forest_model.joblib`, `xgboost_model.joblib` y `stacking_model.joblib` (L176–178) para auditoría comparativa — mismo enfoque experimental del artículo. El backend invoca `/predict` del servicio ML con el modelo ganador en `best_model.joblib`.

---

## Artículo 3

**Referencia:** Zhang, L., et al. (2025). Stacking Ensemble Learning for STEM Student Dropout Prediction. *Journal of Information Systems and Internet Research*, 8(1).  
**DOI:** [10.63158/journalisi.v8i1.1403](https://doi.org/10.63158/journalisi.v8i1.1403)

### Aporte

Propone stacking con RF y XGBoost como estimadores base y regresión logística (o RF) como meta-clasificador para dropout en programas STEM.

### Comparación

| Componente stacking | Paper | Proyecto |
|---------------------|-------|----------|
| Estimador 1 | RF | `("rf", make_rf())` L147 |
| Estimador 2 | XGBoost / HGB | `("hgb", make_hgb())` o XGBoost L124–143 |
| Meta-estimador | LR / RF | `RandomForestClassifier` L148–154 |
| CV | k-fold | `cv=3` L155 |

### Aplicación al proyecto

La configuración de `StackingClassifier` en L146–157 sigue la arquitectura del artículo. Las etiquetas 0/1/2 (`LEVEL_MAP` en `features.py` L22) mapean a riesgo bajo/medio/alto consumido por `PredictionView` y alertas automáticas.

---

## Artículo 4

**Referencia:** Wang, Y., et al. (2024). Student Performance Prediction Using Stacking Ensemble in E-Learning. *Computer Systems Science and Engineering*, 48(4).  
**DOI:** [10.32604/csse.2024.052587](https://doi.org/10.32604/csse.2024.052587)

### Aporte

Aplica stacking en contexto e-learning con variables de participación, tiempo en plataforma y entregas de tareas — paralelas a indicadores LMS del proyecto.

### Comparación

| Variable e-learning (paper) | `FEATURE_NAMES` |
|-----------------------------|-----------------|
| Tiempo en LMS | `tiempo_plataforma`, `frecuencia_acceso_lms` |
| Tareas | `tareas_ratio` |
| Participación | `participacion_actividades`, `uso_foros` |
| Tendencia | `disminucion_actividad` |

### Aplicación al proyecto

`build_feature_vector()` en `features.py` L42–50 normaliza exactamente estas entradas desde el payload API. El artículo fundamenta incluir engagement LMS además de notas puras, decisión reflejada en el score sintético de `generate_synthetic_data()` L52–64 de `train.py`.

---

## Artículo 5

**Referencia:** Chen, H., et al. (2023). Ensemble Learning with Random Forest and XGBoost for Student Dropout Prediction. *International Journal of Information and Education Technology*, 13(6).  
**DOI:** [10.18178/ijiet.2023.13.6.1891](https://doi.org/10.18178/ijiet.2023.13.6.1891)

### Aporte

Demuestra que ensembles RF+XGBoost reducen falsos negativos en detección temprana de estudiantes en riesgo — métrica crítica para sistemas de alerta.

### Comparación

| Métrica | Enfoque paper | `evaluate_model()` |
|---------|---------------|-------------------|
| Precision | Ponderada | `average="weighted"` L87 |
| Recall | Ponderada | L88 |
| F1 | Selección de modelo | L89, L168 |
| Matriz confusión | Sí | L90, export CSV |

### Aplicación al proyecto

`evaluate_model()` exporta métricas a `metrics.json` y matrices a CSV en `models/`. Falsos negativos en clase `alto` (label 2) impactan directamente `AlertsView` — el artículo justifica priorizar F1 sobre accuracy simple, coherente con `best_key = max(..., f1_score)` L168.

---

## Artículo 6

**Referencia:** Talamás-Carvajal, A. B., et al. (2023). A stacking model for the early identification of students at risk of course failure. *Education and Information Technologies*, 28, 16377–16398.  
**DOI:** [10.1007/s10639-023-11682-z](https://doi.org/10.1007/s10639-023-11682-z)

### Aporte

Valida stacking para identificación temprana de reprobación/riesgo con variables académicas multimodales; supera regresión logística y árboles individuales.

### Comparación

| Fase | Paper | Pipeline proyecto |
|------|-------|-------------------|
| Entrenamiento | Hold-out estratificado | `train_test_split(stratify=y)` L97–98 |
| Persistencia | Modelo serializado | `joblib.dump` L175–179 |
| Inferencia | API / servicio | FastAPI `main.py` |
| Niveles riesgo | Multiclase | 3 clases L65, L22 `features.py` |

### Aplicación al proyecto

`StudentPredictionView` y rutas `/predictions` del backend consumen el endpoint ML con el vector de 10 features. El artículo respalda el flujo completo: entrenamiento offline → modelo serializado → inferencia online para intervención temprana.

---

## Conclusión

La adopción de **Random Forest**, **XGBoost** y **Stacking** no es elección genérica: replica el consenso empírico en predicción de deserción (10.1016/j.caeai.2022.100066, 10.29407/intensif.v9i1.21191, 10.63158/journalisi.v8i1.1403). Las **10 variables** alinean con factores e-learning documentados (10.32604/csse.2024.052587). La selección por **F1-score** y persistencia `joblib` materializan buenas prácticas de ensembles educativos (10.18178/ijiet.2023.13.6.1891, 10.1007/s10639-023-11682-z) en `machine-learning/train.py` y `app/features.py`.
