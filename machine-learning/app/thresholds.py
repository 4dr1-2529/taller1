"""Fuente única de umbrales operativos de riesgo (V6).

Regla contractual:
    probabilidad < 0.41 -> bajo
    0.41 <= probabilidad < 0.65 -> medio
    probabilidad >= 0.65 -> alto

Estos umbrales son OPERATIVOS/EXPERIMENTALES para el escenario experimental
con datos sintéticos. No son umbrales científicamente validados por Blenkir.

Python (ML service) es la única implementación del cálculo. El backend y el
frontend únicamente consumen el `nivelRiesgo` devuelto por el servicio ML.
"""
from __future__ import annotations

CONTRACT_VERSION = "2026-v3"

# Banda de probabilidad de deserción P(target=1).
RISK_THRESHOLDS: dict[str, float] = {"medio": 0.41, "alto": 0.65}

THRESHOLD_NOTE = (
    "Umbrales operativos/experimentales (Data Seed V6 sintético), no validados "
    "científicamente; se conservan como base operativa documentada."
)

LEVELS: tuple[str, str, str] = ("bajo", "medio", "alto")


def level_from_probability(probability: float) -> str:
    """Deriva el nivel operativo a partir de P(deserción) ∈ [0, 1]."""
    p = float(probability)
    if not (p == p):  # NaN
        raise ValueError("Probabilidad no finita")
    if p < 0 or p > 1:
        raise ValueError(f"Probabilidad fuera de rango [0,1]: {p}")
    if p >= RISK_THRESHOLDS["alto"]:
        return "alto"
    if p >= RISK_THRESHOLDS["medio"]:
        return "medio"
    return "bajo"


def score_from_probability(probability: float) -> float:
    """Score 0-100 derivado de la probabilidad de deserción (compat dashboards)."""
    return round(float(probability) * 100.0, 1)


def thresholds_payload() -> dict[str, object]:
    return {
        "medio": RISK_THRESHOLDS["medio"],
        "alto": RISK_THRESHOLDS["alto"],
        "rule": "bajo < 0.41 <= medio < 0.65 <= alto",
        "note": THRESHOLD_NOTE,
    }
