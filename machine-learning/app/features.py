"""Variables alineadas con la tesis — vector de características compartido train/inferencia."""
from __future__ import annotations

from typing import Any

import numpy as np

# Orden fijo: debe coincidir con train.py y features.joblib
FEATURE_NAMES: list[str] = [
    "promedio_general", "cursos_desaprobados", "asistencia_general",
    "frecuencia_acceso_lms", "tiempo_interaccion_lms",
    "actividades_realizadas", "recursos_consultados",
]
LEVEL_MAP = {0: "bajo", 1: "medio", 2: "alto"}
LEVEL_TO_SCORE = {0: 25.0, 1: 52.0, 2: 78.0}

def build_feature_vector(data: dict[str, Any]) -> np.ndarray:
    from utils.validators import validate_predict_payload
    validated = validate_predict_payload(data)
    return np.array([[validated[name] for name in FEATURE_NAMES]], dtype=np.float64)


def proba_to_score(proba: np.ndarray) -> float:
    """Convierte probabilidades [bajo, medio, alto] a puntaje 0–100."""
    weights = np.array([15.0, 50.0, 90.0])
    if len(proba) >= 3:
        return float(np.clip(np.dot(proba[:3], weights[: len(proba)]), 0, 100))
    return float(LEVEL_TO_SCORE.get(int(np.argmax(proba)), 50))


def build_factors(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Factores explicables para la respuesta /persistencia."""
    factors: list[dict[str, Any]] = []
    if float(data.get("promedio_general", 20)) < 13:
        factors.append({
            "key": "bajo_promedio",
            "label": "Promedio general bajo",
            "contribution": round((14 - float(data["promedio_general"])) * 3.2, 1),
        })
    if float(data.get("cursos_desaprobados", 0)) >= 2:
        factors.append({
            "key": "cursos_desaprobados",
            "label": "Cursos desaprobados elevados",
            "contribution": round(float(data["cursos_desaprobados"]) * 8, 1),
        })
    if float(data.get("asistencia_general", 100)) < 85:
        factors.append({
            "key": "baja_asistencia",
            "label": "Asistencia insuficiente",
            "contribution": round((85 - float(data["asistencia_general"])) * 0.6, 1),
        })
    if float(data["frecuencia_acceso_lms"]) < 1:
        v = float(data["frecuencia_acceso_lms"])
        factors.append({
            "key": "baja_actividad_lms",
            "label": "Baja frecuencia de acceso LMS",
            "contribution": round((1 - v), 1),
        })
    factors.sort(key=lambda x: x["contribution"], reverse=True)
    return factors[:5]


def auto_recommendation(level: str, factors: list[dict[str, Any]]) -> str:
    top = factors[0]["label"] if factors else "seguimiento general"
    if level == "alto":
        return f"Intervención urgente: {top}. Convocar tutoría, familia y plan de recuperación en 7 días."
    if level == "medio":
        return f"Seguimiento preventivo: {top}. Revisar avances quincenalmente en LMS y asistencia."
    return "Riesgo bajo. Mantener monitoreo rutinario y refuerzo positivo."
