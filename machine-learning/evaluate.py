"""
Evaluación de modelos entrenados — métricas sin reentrenar.
Uso: python evaluate.py
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np

from train import evaluate_model
from app.features import FEATURE_NAMES

MODELS_DIR = Path(__file__).parent / "models"
REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


def evaluate_saved_models() -> dict:
    if list(joblib.load(MODELS_DIR / "features.joblib")) != FEATURE_NAMES:
        raise ValueError("Modelo incompatible")
    holdout = joblib.load(MODELS_DIR / "holdout.joblib")
    if holdout["features"] != FEATURE_NAMES:
        raise ValueError("Holdout incompatible")
    X_test, y_test = holdout["X"], holdout["y"]

    results: dict = {}
    for name, path in [
        ("random_forest", "random_forest_model.joblib"),
        ("xgboost", "xgboost_model.joblib"),
        ("stacking", "stacking_model.joblib"),
        ("best_model", "best_model.joblib"),
    ]:
        p = MODELS_DIR / path
        if not p.exists():
            continue
        model = joblib.load(p)
        preds = model.predict(X_test)
        proba = model.predict_proba(X_test) if hasattr(model, "predict_proba") else None
        results[name] = evaluate_model(name, y_test, preds, proba)

    out = REPORTS_DIR / "evaluation_report.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(json.dumps(results, indent=2))
    print(f"Reporte guardado: {out}")
    return results


if __name__ == "__main__":
    evaluate_saved_models()
