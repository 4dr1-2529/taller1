# Cambios requeridos en operacionalización

La plataforma 2026 elimina la dependencia operativa de foros, tareas_ratio, tareasEntregadas/tareasTotales y participación artificial. No se inventa una novena variable.

| Dimensión | Indicador | Fuente/unidad |
|---|---|---|
| Rendimiento | promedio_general | Notas 2026; media de promedios por curso, 0–20 |
| Rendimiento | cursos_desaprobados | Cursos evaluados con promedio menor a 11 |
| Rendimiento | asistencia_general | Porcentaje sobre registros no justificados |
| LMS | frecuencia_acceso_lms | Logins de los últimos 28 días / 4 semanas |
| LMS | tiempo_interaccion_lms | Horas observadas entre eventos con brechas ≤ 5 minutos |
| LMS | actividades_realizadas | Actividades completadas en la ventana |
| LMS | recursos_consultados | Materiales distintos consultados en la ventana |
| Riesgo | probabilidad/nivel/alerta | Salida de modelo compatible y criterio de alerta configurado |

El tiempo es una aproximación de actividad observada, no atención ni permanencia exacta. Días activos y último acceso son descriptivos. Disminución de actividad queda fuera del vector mientras no se justifique su cálculo. Ausencia de notas/asistencia bloquea predicción, no implica rendimiento cero.

Revisar instrumento, unidad de análisis, periodos, etiquetas reales, validez y protocolo de entrenamiento antes de trasladar cambios a la tesis. El riesgo de clase alta no equivale automáticamente a probabilidad calibrada de abandono observado: esa interpretación requiere validación empírica de etiquetas y calibración.

Los futuros 200 registros serán sintéticos para pruebas tecnológicas y NO evidencia científica. No se modificaron conclusiones ni resultados científicos históricos.
