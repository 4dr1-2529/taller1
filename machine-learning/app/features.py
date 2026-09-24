"""Variables alineadas con la tesis: vector de características compartido train/inferencia.

Contrato binario V6:
- El modelo estima P(deserción) = P(target_desercion = 1).
- app/thresholds.py transforma esa probabilidad en banda Bajo/Medio/Alto.
- Los factores son señales descriptivas asociadas, no causalidad ni SHAP.
"""
from __future__ import annotations

from typing import Any

import numpy as np

from app.thresholds import (
    RISK_THRESHOLDS,
    level_from_probability,
    score_from_probability,
)

# Orden fijo: debe coincidir con train.py, dataset.py y features.joblib
FEATURE_NAMES: list[str] = [
    "promedio_general",
    "cursos_desaprobados",
    "asistencia_general",
    "frecuencia_acceso_lms",
    "tiempo_interaccion_lms",
    "actividades_realizadas",
    "recursos_consultados",
]

LEVEL_MAP = {0: "bajo", 1: "medio", 2: "alto"}
LEVEL_TO_SCORE = {0: 25.0, 1: 52.0, 2: 78.0}


def build_feature_vector(data: dict[str, Any]) -> np.ndarray:
    from utils.validators import validate_predict_payload
    validated = validate_predict_payload(data)
    return np.array([[validated[name] for name in FEATURE_NAMES]], dtype=np.float64)


def probability_to_level(probability: float) -> str:
    """P(deserción) -> banda operativa bajo/medio/alto (fuente única: thresholds.py)."""
    return level_from_probability(probability)


def proba_to_score(probability: float) -> float:
    """Compatibilidad dashboards: score 0-100 derivado de P(deserción)."""
    return score_from_probability(probability)


def build_factors(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Señales observadas asociadas al riesgo (descriptivas, no causales)."""
    factors: list[dict[str, Any]] = []
    if float(data.get("promedio_general", 20)) < 13:
        factors.append({
            "key": "bajo_promedio",
            "label": "Promedio general bajo (señal observada)",
            "contribution": round((14 - float(data["promedio_general"])) * 3.2, 1),
        })
    if float(data.get("cursos_desaprobados", 0)) >= 2:
        factors.append({
            "key": "cursos_desaprobados",
            "label": "Cursos desaprobados elevados (señal observada)",
            "contribution": round(float(data["cursos_desaprobados"]) * 8, 1),
        })
    if float(data.get("asistencia_general", 100)) < 85:
        factors.append({
            "key": "baja_asistencia",
            "label": "Asistencia insuficiente (señal observada)",
            "contribution": round((85 - float(data["asistencia_general"])) * 0.6, 1),
        })
    if float(data.get("frecuencia_acceso_lms", 0)) < 1:
        v = float(data["frecuencia_acceso_lms"])
        factors.append({
            "key": "baja_actividad_lms",
            "label": "Baja frecuencia de acceso LMS (señal observada)",
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


__all__ = [
    "FEATURE_NAMES",
    "LEVEL_MAP",
    "LEVEL_TO_SCORE",
    "RISK_THRESHOLDS",
    "auto_recommendation",
    "build_factors",
    "build_feature_vector",
    "level_from_probability",
    "probability_to_level",
    "proba_to_score",
    "score_from_probability",
]
