"""Validación de entradas para predicción y entrenamiento."""
from __future__ import annotations

from typing import Any


class ValidationError(ValueError):
    pass


def validate_predict_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Valida rangos y tipos; devuelve payload normalizado."""
    errors: list[str] = []

    def num(key: str, default: float, lo: float, hi: float) -> float:
        raw = data.get(key, default)
        try:
            v = float(raw)
        except (TypeError, ValueError):
            errors.append(f"{key} debe ser numérico")
            return default
        if v < lo or v > hi:
            errors.append(f"{key} debe estar entre {lo} y {hi}")
        return max(lo, min(hi, v))

    promedio = num("promedio_general", 12, 0, 20)
    asistencia = num("asistencia_general", 80, 0, 100)
    tiempo = num("tiempo_plataforma", 4, 0, 24)
    tareas = num("tareas_ratio", 0.75, 0, 1)
    cursos_des = num("cursos_desaprobados", 0, 0, 12)
    lms = data.get("frecuencia_acceso_lms", data.get("actividad_lms_prom", 55))
    try:
        frecuencia = float(lms)
        if frecuencia < 0 or frecuencia > 100:
            errors.append("frecuencia_acceso_lms entre 0 y 100")
    except (TypeError, ValueError):
        errors.append("frecuencia_acceso_lms inválida")
        frecuencia = 55.0

    participacion = float(data.get("participacion_actividades", frecuencia))
    uso_foros = num("uso_foros", 0.5, 0, 1)
    disminucion = num("disminucion_actividad", 0, 0, 100)

    estado = str(data.get("estado_estudiante", data.get("estado", "activo"))).lower().replace(" ", "_")
    if estado not in ("activo", "en_riesgo", "retirado"):
        errors.append("estado_estudiante debe ser activo, en_riesgo o retirado")

    if errors:
        raise ValidationError("; ".join(errors))

    return {
        "promedio_general": promedio,
        "asistencia_general": asistencia,
        "frecuencia_acceso_lms": frecuencia,
        "tiempo_plataforma": tiempo,
        "tareas_ratio": tareas,
        "cursos_desaprobados": cursos_des,
        "participacion_actividades": participacion,
        "uso_foros": uso_foros,
        "disminucion_actividad": disminucion,
        "estado": estado,
    }
