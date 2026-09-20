# Machine Learning 2026-v2

Vector ordenado de **7 variables**: promedio_general, cursos_desaprobados, asistencia_general, frecuencia_acceso_lms, tiempo_interaccion_lms, actividades_realizadas, recursos_consultados.

Las mismas validaciones se aplican en carga de datos, contrato FastAPI y cliente backend. Todos los valores son finitos/no negativos; notas 0–20, asistencia 0–100 y recuentos enteros. Las entradas adicionales o ausentes se rechazan. No se inventan valores para registros faltantes.

Se mantienen Random Forest, XGBoost (HistGradientBoosting si no es compatible) y Stacking. No hay ganador declarado. El entrenamiento futuro separa entrenamiento/validación/prueba estratificados; selecciona por F1 ponderado de validación y evalúa en holdout reservado. evaluate.py reutiliza ese holdout, no crea una partición distinta que pueda contener datos usados para entrenar.

DATASET_PATH debe indicar un CSV autorizado con las siete variables y target bajo/medio/alto, codificados 0/1/2. La procedencia, unidad de observación, fechas, etiquetas y posibles fugas requieren revisión científica. El software no certifica por sí solo la validez de las etiquetas. No se ejecutó entrenamiento ni se modificaron conclusiones científicas.

Las métricas y artefactos antiguos están en legacy/ml-v1. No prueban desempeño del nuevo vector. Sin best_model.joblib compatible, features.joblib y metadata coherente, la API no produce predicciones. Los factores actuales describen indicadores por reglas; no son importancia aprendida ni causalidad.

Pruebas: python -m unittest discover -s machine-learning/tests -p test_predict.py desde raíz. Entrenamiento posterior: cd machine-learning; python train.py. No generar datos sintéticos ahora. Los futuros 200 registros serán demostración tecnológica, no evidencia científica.
