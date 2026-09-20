"""Strict seven-feature contract; no fabricated defaults."""
import math

class ValidationError(ValueError):
    pass

def validate_predict_payload(data):
    from app.features import FEATURE_NAMES
    if set(data) != set(FEATURE_NAMES):
        raise ValidationError("Se requieren exactamente las siete variables del contrato 2026")
    result = {}
    for name in FEATURE_NAMES:
        value = data[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
            raise ValidationError(f"Valor inválido: {name}")
        if name == "promedio_general" and value > 20 or name == "asistencia_general" and value > 100:
            raise ValidationError(f"Fuera de rango: {name}")
        if name in ("cursos_desaprobados", "actividades_realizadas", "recursos_consultados") and int(value) != value:
            raise ValidationError(f"Se requiere entero: {name}")
        result[name] = float(value)
    return result
