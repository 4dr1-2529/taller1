"""ML Service — predicción de riesgo de deserción (ensemble learning)."""
from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.features import (
    FEATURE_NAMES,
    LEVEL_MAP,
    auto_recommendation,
    build_factors,
    build_feature_vector,
    proba_to_score,
)

import sys
from pathlib import Path as _Path

sys.path.insert(0, str(_Path(__file__).parent.parent))
from utils.validators import ValidationError, validate_predict_payload

MODELS_DIR = Path(__file__).parent.parent / "models"
model = None
feature_names: list[str] | None = None
metrics: dict[str, Any] | None = None
best_model_name = "stacking-ensemble"


class PredictInput(BaseModel):
    """Variables alineadas con la tesis (snake_case)."""
    promedio_general: float = Field(..., ge=0, le=20)
    asistencia_general: float = Field(..., ge=0, le=100)
    # Compatibilidad con cliente anterior
    actividad_lms_prom: float | None = None
    frecuencia_acceso_lms: float | None = None
    tiempo_plataforma: float = Field(4, ge=0, le=24)
    tareas_ratio: float = Field(..., ge=0, le=1)
    cursos_desaprobados: float = Field(0, ge=0, le=12)
    participacion_actividades: float | None = None
    uso_foros: float = Field(0.5, ge=0, le=1)
    disminucion_actividad: float = Field(0, ge=0, le=100)
    estado: str = "activo"


class PredictOutput(BaseModel):
    score: float
    level: str
    probability: float
    probability_abandono: float
    factors: list[dict[str, Any]]
    recommendation: str
    model_name: str
    predicted_at: str
    input_data: dict[str, Any]
    # Formato tesis (español)
    probabilidad_abandono: float | None = None
    score_predictivo: float | None = None
    nivel_riesgo: str | None = None
    factores_riesgo: list[dict[str, Any]] | None = None
    recomendacion: str | None = None
    modelo_usado: str | None = None
    fecha_prediccion: str | None = None


def _with_thesis_fields(out: PredictOutput) -> PredictOutput:
    nivel = {"bajo": "Bajo", "medio": "Medio", "alto": "Alto"}.get(out.level, out.level)
    out.probabilidad_abandono = out.probability_abandono
    out.score_predictivo = out.score
    out.nivel_riesgo = nivel
    out.factores_riesgo = out.factors
    out.recomendacion = out.recommendation
    out.modelo_usado = out.model_name
    out.fecha_prediccion = out.predicted_at
    return out


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, feature_names, metrics, best_model_name
    try:
        best_path = MODELS_DIR / "best_model.joblib"
        stack_path = MODELS_DIR / "stacking_model.joblib"
        load_path = best_path if best_path.exists() else stack_path
        model = joblib.load(load_path)
        feature_names = joblib.load(MODELS_DIR / "features.joblib")
        with open(MODELS_DIR / "metrics.json", encoding="utf-8") as f:
            metrics = json.load(f)
        best_model_name = str(metrics.get("best_model", "stacking"))
        print(f"Modelo cargado: {load_path.name} ({best_model_name})")
    except FileNotFoundError:
        print("Modelos no encontrados. Ejecute: python train.py")
    yield
    model = None
    feature_names = None
    metrics = None


app = FastAPI(title="Tesis ML Service", version="2.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3029", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _normalize_input(data: PredictInput) -> dict[str, Any]:
    lms = data.frecuencia_acceso_lms if data.frecuencia_acceso_lms is not None else data.actividad_lms_prom
    if lms is None:
        lms = 55.0
    participacion = data.participacion_actividades if data.participacion_actividades is not None else lms
    return {
        "promedio_general": data.promedio_general,
        "cursos_desaprobados": data.cursos_desaprobados,
        "asistencia_general": data.asistencia_general,
        "frecuencia_acceso_lms": lms,
        "tiempo_plataforma": data.tiempo_plataforma,
        "tareas_ratio": data.tareas_ratio,
        "participacion_actividades": participacion,
        "uso_foros": data.uso_foros,
        "disminucion_actividad": data.disminucion_actividad,
        "estado": data.estado,
    }


def heuristic_predict(data: dict[str, Any]) -> PredictOutput:
    """Respaldo cuando no hay modelo entrenado."""
    score = 0.0
    if data["promedio_general"] < 11:
        score += 32
    elif data["promedio_general"] < 13:
        score += 16
    if data["cursos_desaprobados"] >= 2:
        score += 18
    if data["asistencia_general"] < 75:
        score += 26
    elif data["asistencia_general"] < 85:
        score += 12
    if data["frecuencia_acceso_lms"] < 45:
        score += 20
    if data["tareas_ratio"] < 0.55:
        score += 22
    if data["disminucion_actividad"] > 20:
        score += 14
    if data["estado"] in ("retirado", 0, 0.0):
        score += 16
    elif data["estado"] in ("en_riesgo", "en riesgo", 0.5):
        score += 8

    score = min(100, max(0, score))
    level = "alto" if score >= 65 else "medio" if score >= 41 else "bajo"
    factors = build_factors(data)
    now = datetime.now(timezone.utc).isoformat()
    return _with_thesis_fields(
        PredictOutput(
            score=round(score, 1),
            level=level,
            probability=round(score / 100, 3),
            probability_abandono=round(score / 100, 3),
            factors=factors,
            recommendation=auto_recommendation(level, factors),
            model_name="heuristic-fallback",
            predicted_at=now,
            input_data=data,
        )
    )


@app.post("/predict", response_model=PredictOutput)
def predict(data: PredictInput) -> PredictOutput:
    raw = data.model_dump()
    try:
        validated = validate_predict_payload(raw)
    except ValidationError as e:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail=str(e)) from e
    payload = validated
    now = datetime.now(timezone.utc).isoformat()

    if model is None:
        return heuristic_predict(payload)

    try:
        features = build_feature_vector(payload)
        pred = int(model.predict(features)[0])
        proba = model.predict_proba(features)[0]
        level = LEVEL_MAP.get(pred, "medio")
        probability = float(proba[pred]) if pred < len(proba) else float(max(proba))
        # Probabilidad de abandono ≈ clase alto (índice 2)
        probability_abandono = float(proba[2]) if len(proba) > 2 else probability
        score = proba_to_score(proba)
        factors = build_factors(payload)

        return _with_thesis_fields(
            PredictOutput(
                score=round(score, 1),
                level=level,
                probability=round(probability, 3),
                probability_abandono=round(probability_abandono, 3),
                factors=factors,
                recommendation=auto_recommendation(level, factors),
                model_name=best_model_name,
                predicted_at=now,
                input_data=payload,
            )
        )
    except Exception as e:
        print(f"Prediction error: {e}")
        return heuristic_predict(payload)


@app.get("/metrics")
def get_metrics() -> dict[str, Any] | None:
    return metrics


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "healthy" if model is not None else "no-model",
        "service": "machine-learning",
        "features": ",".join(feature_names or FEATURE_NAMES),
    }
