"""ML Service — predicción de riesgo de deserción (ensemble learning)."""
from __future__ import annotations

import asyncio
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

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
best_model_name = "unavailable"


class PredictInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    promedio_general: float = Field(..., ge=0, le=20)
    cursos_desaprobados: int = Field(..., ge=0)
    asistencia_general: float = Field(..., ge=0, le=100)
    frecuencia_acceso_lms: float = Field(..., ge=0)
    tiempo_interaccion_lms: float = Field(..., ge=0)
    actividades_realizadas: int = Field(..., ge=0)
    recursos_consultados: int = Field(..., ge=0)


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
    fecha: str | None = None
    prediction_source: str = "ml_model"


def _with_thesis_fields(out: PredictOutput) -> PredictOutput:
    nivel = {"bajo": "Bajo", "medio": "Medio", "alto": "Alto"}.get(out.level, out.level)
    out.probabilidad_abandono = out.probability_abandono
    out.score_predictivo = out.score
    out.nivel_riesgo = nivel
    out.factores_riesgo = out.factors
    out.recomendacion = out.recommendation
    out.modelo_usado = out.model_name
    out.fecha_prediccion = out.predicted_at
    out.fecha = out.predicted_at
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
        if list(feature_names) != FEATURE_NAMES or getattr(model, "n_features_in_", 0) != len(FEATURE_NAMES) or list(getattr(model, "classes_", [])) != [0, 1, 2]:
            model = None
            raise ValueError("Artifact incompatible with the 2026 feature contract")
        metrics_path = MODELS_DIR / "metrics.json"
        metrics = await asyncio.to_thread(
            lambda p=metrics_path: json.loads(p.read_text(encoding="utf-8"))
        )
        best_model_name = str(metrics.get("best_model", "stacking"))
        print(f"Modelo cargado: {load_path.name} ({best_model_name})")
    except (FileNotFoundError, ValueError):
        model = None
        print("Modelos no encontrados. Ejecute: python train.py")
    yield
    model = None
    feature_names = None
    metrics = None


app = FastAPI(title="Tesis ML Service", version="2.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.environ.get("ML_CORS_ORIGINS", "http://localhost:3029,http://localhost:4000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict", response_model=PredictOutput)
def predict(data: PredictInput) -> PredictOutput:
    raw = data.model_dump()
    try:
        validated = validate_predict_payload(raw)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    payload = validated
    now = datetime.now(timezone.utc).isoformat()

    if model is None:
        raise HTTPException(status_code=503, detail="Modelo 2026 validado no disponible")

    try:
        features = build_feature_vector(payload)
        pred = int(model.predict(features)[0])
        proba = model.predict_proba(features)[0]
        level = LEVEL_MAP.get(pred, "medio")
        probability = float(proba[pred]) if pred < len(proba) else float(max(proba))
        # Probabilidad de abandono ≈ clase alto (índice 2)
        probability_abandono = float(proba[2])
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
                prediction_source="ml_model",
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=503, detail="Error interno de predicción. No se genera riesgo ficticio.")


@app.get("/metrics")
def get_metrics() -> dict[str, Any] | None:
    return metrics


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "healthy" if model is not None else "no-model",
        "service": "machine-learning",
        "features": ",".join(feature_names or FEATURE_NAMES),
        "modelLoaded": str(model is not None).lower(),
        "modelName": best_model_name,
        "dataMode": os.environ.get("ML_DATA_MODE", "real"),
        "modelVersion": str((metrics or {}).get("model_version", "unknown")),
    }
