"""ML Service - FastAPI application with proper lifespan management."""
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODELS_DIR = Path(__file__).parent.parent / "models"
model = None
feature_names = None
metrics = None


class PredictInput(BaseModel):
    promedio_general: float
    asistencia_general: float
    actividad_lms_prom: float
    tareas_ratio: float
    estado: str = "activo"


class PredictOutput(BaseModel):
    score: float
    level: str
    probability: float
    factors: list[dict[str, Any]] | None = None
    model_name: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup, cleanup on shutdown."""
    global model, feature_names, metrics
    try:
        model = joblib.load(MODELS_DIR / "stacking_model.joblib")
        feature_names = joblib.load(MODELS_DIR / "features.joblib")
        with open(MODELS_DIR / "metrics.json", encoding="utf-8") as f:
            metrics = json.load(f)
        print("ML models loaded successfully")
    except FileNotFoundError:
        print("ML models not found. Run train.py first.")
    yield
    model = None
    feature_names = None
    metrics = None
    print("ML models unloaded")


app = FastAPI(title="Tesis ML Service", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3029", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def heuristic_predict(data: PredictInput) -> PredictOutput:
    """Fallback heuristic prediction when model is not loaded."""
    score = 0.0
    if data.promedio_general < 11:
        score += 35
    elif data.promedio_general < 13:
        score += 18
    if data.asistencia_general < 75:
        score += 28
    elif data.asistencia_general < 85:
        score += 15
    if data.actividad_lms_prom < 45:
        score += 22
    elif data.actividad_lms_prom < 60:
        score += 12
    if data.tareas_ratio < 0.55:
        score += 25
    elif data.tareas_ratio < 0.80:
        score += 12
    if data.estado == "retirado":
        score += 18
    elif data.estado == "en_riesgo":
        score += 10

    score = min(100, max(0, score))
    level = "alto" if score >= 65 else "medio" if score >= 41 else "bajo"

    factors = []
    if data.promedio_general < 13:
        factors.append({"key": "bajo_promedio", "label": "Promedio general bajo", "contribution": 35 * 0.32})
    if data.asistencia_general < 85:
        factors.append({"key": "baja_asistencia", "label": "Asistencia insuficiente", "contribution": 28 * 0.28})
    if data.actividad_lms_prom < 60:
        factors.append({"key": "baja_actividad_lms", "label": "Baja participación LMS", "contribution": 22 * 0.22})
    if data.tareas_ratio < 0.80:
        factors.append({"key": "tareas_incompletas", "label": "Tareas pendientes", "contribution": 25 * 0.18})

    return PredictOutput(
        score=round(score, 1),
        level=level,
        probability=round(score / 100, 3),
        factors=factors,
        model_name="heuristic-fallback",
    )


@app.post("/predict", response_model=PredictOutput)
def predict(data: PredictInput) -> PredictOutput:
    if model is None or feature_names is None:
        return heuristic_predict(data)

    try:
        features = np.array([[
            data.promedio_general,
            data.asistencia_general,
            data.actividad_lms_prom,
            data.tareas_ratio,
            1.0 if data.estado == "activo" else 0.5 if data.estado == "en_riesgo" else 0.0,
        ]])
        pred = model.predict(features)[0]
        proba = model.predict_proba(features)[0]

        level_map = {0: "bajo", 1: "medio", 2: "alto"}
        level = level_map.get(int(pred), "medio")
        probability = float(max(proba))

        factors = []
        if data.promedio_general < 13:
            factors.append({"key": "bajo_promedio", "label": "Promedio general bajo", "contribution": (14 - data.promedio_general) * 3.2})
        if data.asistencia_general < 85:
            factors.append({"key": "baja_asistencia", "label": "Asistencia insuficiente", "contribution": (85 - data.asistencia_general) * 0.6})
        if data.actividad_lms_prom < 60:
            factors.append({"key": "baja_actividad_lms", "label": "Baja participación LMS", "contribution": (60 - data.actividad_lms_prom) * 0.4})
        if data.tareas_ratio < 0.80:
            factors.append({"key": "tareas_incompletas", "label": "Tareas pendientes", "contribution": (0.80 - data.tareas_ratio) * 50})

        return PredictOutput(
            score=round(float(score), 1),
            level=level,
            probability=round(probability, 3),
            factors=factors,
            model_name="stacking-ensemble",
        )
    except Exception as e:
        print(f"Prediction error: {e}")
        return heuristic_predict(data)


@app.get("/metrics")
def get_metrics() -> dict[str, Any] | None:
    return metrics


@app.get("/health")
def health() -> dict[str, str]:
    status = "healthy" if model is not None else "no-model"
    return {"status": status, "service": "machine-learning"}
