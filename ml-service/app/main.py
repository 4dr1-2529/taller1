from pathlib import Path
import json
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="ML Service — Riesgo de deserción",
    description="Ensemble: Random Forest + XGBoost + Stacking",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
_model = None
_scaler = None
_features = None
_metrics = None


def load_artifacts():
    global _model, _scaler, _features, _metrics
    model_path = MODELS_DIR / "stacking_model.joblib"
    if model_path.exists():
        _model = joblib.load(model_path)
        _scaler = joblib.load(MODELS_DIR / "scaler.joblib")
        _features = joblib.load(MODELS_DIR / "features.joblib")
    metrics_path = MODELS_DIR / "metrics.json"
    if metrics_path.exists():
        _metrics = json.loads(metrics_path.read_text(encoding="utf-8"))


@app.on_event("startup")
def startup():
    load_artifacts()


class PredictRequest(BaseModel):
    promedio_general: float = Field(ge=0, le=20)
    asistencia_general: float = Field(ge=0, le=100)
    actividad_lms_prom: float = Field(ge=0, le=100)
    tareas_ratio: float = Field(ge=0, le=1)
    estado: int = Field(ge=0, le=2)


@app.get("/health")
def health():
    return {"ok": True, "model_loaded": _model is not None}


@app.get("/metrics")
def metrics():
    if not _metrics:
        return {"ok": False, "message": "Ejecute train.py primero"}
    return {"ok": True, "models": _metrics}


@app.post("/predict")
def predict(req: PredictRequest):
    X = np.array(
        [
            [
                req.promedio_general,
                req.asistencia_general,
                req.actividad_lms_prom,
                req.tareas_ratio,
                req.estado,
            ]
        ]
    )

    if _model is not None and _scaler is not None:
        proba = float(_model.predict_proba(X)[0][1])
        pred = int(_model.predict(X)[0])
    else:
        risk = (
            (20 - req.promedio_general) * 2
            + (100 - req.asistencia_general) * 0.35
            + (100 - req.actividad_lms_prom) * 0.3
            + (1 - req.tareas_ratio) * 25
            + req.estado * 10
        )
        proba = min(1.0, max(0.0, risk / 100))
        pred = 1 if proba > 0.5 else 0

    score = round(proba * 100, 1)
    level = "alto" if score >= 65 else "medio" if score >= 41 else "bajo"

    factors = [
        {
            "key": "bajo_promedio",
            "label": "Promedio general",
            "contribution": round(max(0, (14 - req.promedio_general) * 4), 1),
        },
        {
            "key": "baja_asistencia",
            "label": "Asistencia",
            "contribution": round(max(0, (90 - req.asistencia_general) * 0.5), 1),
        },
        {
            "key": "baja_actividad_lms",
            "label": "Actividad LMS",
            "contribution": round(max(0, (70 - req.actividad_lms_prom) * 0.45), 1),
        },
        {
            "key": "tareas_incompletas",
            "label": "Tareas",
            "contribution": round(max(0, (1 - req.tareas_ratio) * 35), 1),
        },
    ]
    factors.sort(key=lambda x: x["contribution"], reverse=True)

    return {
        "score": score,
        "level": level,
        "probability": round(proba, 4),
        "desercion_predicha": bool(pred),
        "model_name": "stacking-rf-xgb" if _model else "heuristic-fallback",
        "factors": factors,
    }


@app.get("/models/compare")
def compare_models():
    return metrics()
