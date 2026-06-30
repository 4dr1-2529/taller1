# Pruebas caja negra — Predicción

**Vistas:** `PredictionView`, `ProfessorPredictionView`, `StudentPredictionView`

---

## Flujo Director (`PredictionView.tsx`)

1. **Precondición:** `filters.seccionId` seleccionado — si no, muestra `FILTER_HINTS.selectSeccion`
2. Selector estudiante (`visibleStudents` del filtro)
3. Gauge `RiskGauge` — motor local `computePrediction()` (`risk-engine.ts`)
4. Botón **"Ejecutar predicción en servidor"** → `api.predict(studentId)` → `POST /predict`
5. Resultado: `nivel_riesgo`, `probabilidad_abandono`, `factores_riesgo`, `recomendacion`
6. `MlMetricsSection` → `GET /ml/metrics`

---

## Casos

| ID | Rol | API | Evidencia |
|----|-----|-----|-----------|
| TC-CN-07 | admin | POST /predict | prediccion-resultado-riesgo.png |
| TC-PRED-02 | docente | POST /profesor/predicciones | prediccion-vista-profesor.png |
| TC-PRED-03 | estudiante | GET /estudiante/prediccion | alumno-mi-riesgo.png |
| TC-IA-08 | ML directo | POST :5000/predict | smoke 3 perfiles |
| TC-INT-03 | integrado | predict + studentId real | smoke-tests.mjs |

---

## Formato respuesta (tesis)

`probabilidad_abandono`, `nivel_riesgo`, `score_predictivo` — validado `prediction-format.test.mjs` + smoke L126.
