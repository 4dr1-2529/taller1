"""ML Service — predicción binaria de riesgo de deserción (Data Seed V6).

Contrato de salida (versión 2026-v3):
    probabilidadDesercion / probabilidad_desercion : P(target_desercion = 1)
    nivelRiesgo                                    : bajo | medio | alto (umbrales 0.41 / 0.65)
    modelo, modelVersion, datasetVersion, dataMode, contractVersion
    factors                                        : señales observadas (no causalidad)

El servicio no recibe ni devuelve el target conocido.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
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
    auto_recommendation,
    build_factors,
    build_feature_vector,
    probability_to_level,
    proba_to_score,
)
from app.thresholds import CONTRACT_VERSION, RISK_THRESHOLDS, thresholds_payload

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils.validators import ValidationError, validate_predict_payload  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
SYNTHETIC_DIR = ROOT / "artifacts" / "synthetic"
REAL_DIR = ROOT / "artifacts" / "real"

model = None
feature_names: list[str] | None = None
metrics: dict[str, Any] | None = None
model_meta: dict[str, Any] = {}
best_model_name = "unavailable"


def current_data_mode() -> str:
    # Por defecto se sirve el artefacto experimental V6 (etiquetado en metadata.json).
    mode = os.environ.get("ML_DATA_MODE", "synthetic_scientific").strip().lower()
    return mode if mode in ("synthetic_scientific", "real") else "synthetic_scientific"


def artifacts_dir(mode: str | None = None) -> Path:
    return SYNTHETIC_DIR if (mode or current_data_mode()) == "synthetic_scientific" else REAL_DIR


def _candidate_dirs(mode: str) -> list[Path]:
    ordered = [artifacts_dir(mode)]
    if mode == "real":
        ordered.append(MODELS_DIR)  # compatibilidad con artefactos legados en modo real
    return [path for path in ordered if path.exists()]


def _load_artifacts() -> tuple[Any, list[str], dict[str, Any], dict[str, Any], str]:
    mode = current_data_mode()
    errors: list[str] = []
    for directory in _candidate_dirs(mode):
        try:
            metadata_path = directory / "metadata.json"
            metrics_path = directory / "metrics.json"
            if not metadata_path.exists():
                errors.append(f"{directory.name}: metadata.json ausente")
                continue
            meta = json.loads(metadata_path.read_text(encoding="utf-8"))
            if str(meta.get("data_mode")) != mode:
                errors.append(
                    f"{directory.name}: data_mode={meta.get('data_mode')} "
                    f"distinto de ML_DATA_MODE={mode}"
                )
                continue
            names = list(joblib.load(directory / "features.joblib"))
            if names != FEATURE_NAMES:
                errors.append(f"{directory.name}: vector de features incompatible")
                continue
            candidate = joblib.load(directory / "best_model.joblib")
            classes = list(getattr(candidate, "classes_", []))
            if not classes or set(classes) - {0, 1}:
                errors.append(f"{directory.name}: clases {classes} no binarias")
                continue
            if getattr(candidate, "n_features_in_", len(names)) != len(FEATURE_NAMES):
                errors.append(f"{directory.name}: n_features incompatible")
                continue
            # metrics.json se lee solo al arrancar: uvicorn --reload observa
            # únicamente *.py, por lo que un cambio en este archivo no lo recarga.
            loaded_metrics = (
                json.loads(metrics_path.read_text(encoding="utf-8"))
                if metrics_path.exists() else {}
            )
            name = str(loaded_metrics.get("best_model") or meta.get("model_selected") or directory.name)
            return candidate, names, meta, loaded_metrics, name
        except Exception as exc:  # pragma: no cover - artefactos corruptos
            errors.append(f"{directory.name}: {exc}")
    raise FileNotFoundError("; ".join(errors) or "sin artefactos")


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
    # Contrato v3 (binario)
    probabilidadDesercion: float
    nivelRiesgo: str
    modelo: str
    modelVersion: str
    datasetVersion: str
    dataMode: str
    contractVersion: str
    factors: list[dict[str, Any]]
    # Compatibilidad con clientes existentes (backend / frontend / reportes)
    score: float
    level: str
    probability: float
    probability_abandono: float
    recommendation: str
    model_name: str
    predicted_at: str
    input_data: dict[str, Any]
    prediction_source: str = "ml_model"
    risk_thresholds: dict[str, Any] | None = None
    decision_threshold: float | None = None
    # Formato tesis (español)
    probabilidad_desercion: float | None = None
    probabilidad_abandono: float | None = None
    score_predictivo: float | None = None
    nivel_riesgo: str | None = None
    factores_riesgo: list[dict[str, Any]] | None = None
    recomendacion: str | None = None
    modelo_usado: str | None = None
    fecha_prediccion: str | None = None
    fecha: str | None = None


def _with_thesis_fields(out: PredictOutput) -> PredictOutput:
    nivel = {"bajo": "Bajo", "medio": "Medio", "alto": "Alto"}.get(out.nivelRiesgo, out.nivelRiesgo)
    out.probabilidad_desercion = out.probabilidadDesercion
    out.probabilidad_abandono = out.probability_abandono
    out.score_predictivo = out.score
    out.nivel_riesgo = nivel
    out.factores_riesgo = out.factors
    out.recomendacion = out.recommendation
    out.modelo_usado = out.modelo
    out.fecha_prediccion = out.predicted_at
    out.fecha = out.predicted_at
    return out


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, feature_names, metrics, model_meta, best_model_name
    try:
        loaded, names, meta, loaded_metrics, name = await asyncio.to_thread(_load_artifacts)
        model, feature_names, model_meta, metrics, best_model_name = loaded, names, meta, loaded_metrics, name
        print(
            f"Modelo cargado: {meta.get('model_version')} ({name}) "
            f"data_mode={meta.get('data_mode')} dataset={meta.get('dataset_version')}"
        )
    except (FileNotFoundError, ValueError) as exc:
        model = None
        print(f"Modelo no disponible: {exc}. Ejecute: python train.py")
    yield
    model = None
    feature_names = None
    metrics = None
    model_meta = {}


app = FastAPI(title="Tesis ML Service", version="3.0.0", lifespan=lifespan)
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
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    payload = validated
    now = datetime.now(timezone.utc).isoformat()

    if model is None:
        raise HTTPException(status_code=503, detail="Modelo binario V6 no disponible")

    try:
        features = build_feature_vector(payload)
        proba = np.asarray(model.predict_proba(features)[0], dtype=float)
        classes = [int(c) for c in getattr(model, "classes_", [])]
        if 1 in classes:
            p_desercion = float(proba[classes.index(1)])
        else:
            p_desercion = float(proba[-1])
        p_desercion = float(min(max(p_desercion, 0.0), 1.0))

        level = probability_to_level(p_desercion)
        score = proba_to_score(p_desercion)
        factors = build_factors(payload)
        model_version = str(model_meta.get("model_version", "unknown"))
        dataset_version = str(model_meta.get("dataset_version", "unknown"))
        data_mode = str(model_meta.get("data_mode", current_data_mode()))
        contract = str(model_meta.get("contract_version", CONTRACT_VERSION))
        decision_threshold = model_meta.get("decision_threshold")

        return _with_thesis_fields(
            PredictOutput(
                probabilidadDesercion=round(p_desercion, 4),
                nivelRiesgo=level,
                modelo=best_model_name,
                modelVersion=model_version,
                datasetVersion=dataset_version,
                dataMode=data_mode,
                contractVersion=contract,
                factors=factors,
                score=round(score, 1),
                level=level,
                probability=round(p_desercion, 4),
                probability_abandono=round(p_desercion, 4),
                recommendation=auto_recommendation(level, factors),
                model_name=best_model_name,
                predicted_at=now,
                input_data=payload,
                prediction_source="ml_model",
                risk_thresholds=thresholds_payload(),
                decision_threshold=float(decision_threshold) if decision_threshold is not None else None,
            )
        )
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Prediction error: {exc}")
        raise HTTPException(
            status_code=503,
            detail="Error interno de predicción. No se genera riesgo ficticio.",
        ) from exc


@app.get("/metrics")
def get_metrics() -> dict[str, Any] | None:
    return metrics


@app.get("/health")
def health() -> dict[str, Any]:
    mode = current_data_mode()
    meta = model_meta or {}
    return {
        "status": "healthy" if model is not None else "no-model",
        "service": "machine-learning",
        "modelLoaded": model is not None,
        "model_loaded": model is not None,
        "modelName": best_model_name,
        "model": best_model_name,
        "modelVersion": str(meta.get("model_version", "unknown")),
        "model_version": str(meta.get("model_version", "unknown")),
        "datasetVersion": str(meta.get("dataset_version", "unknown")),
        "dataset_version": str(meta.get("dataset_version", "unknown")),
        "dataMode": str(meta.get("data_mode", mode)),
        "data_mode": str(meta.get("data_mode", mode)),
        "contractVersion": str(meta.get("contract_version", CONTRACT_VERSION)),
        "contract_version": str(meta.get("contract_version", CONTRACT_VERSION)),
        "nFeatures": len(feature_names or FEATURE_NAMES),
        "n_features": len(feature_names or FEATURE_NAMES),
        "features": ",".join(feature_names or FEATURE_NAMES),
        "riskThresholds": thresholds_payload(),
        "risk_thresholds": {k: v for k, v in RISK_THRESHOLDS.items()},
        "experimental": str(meta.get("data_mode", mode)) == "synthetic_scientific",
    }
