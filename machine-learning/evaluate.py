"""
Evaluación de modelos entrenados — métricas sin reentrenar.
Uso: python evaluate.py
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import train_test_split

from train import evaluate_model, generate_synthetic_data

MODELS_DIR = Path(__file__).parent / "models"
REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


def evaluate_saved_models() -> dict:
    X, y = generate_synthetic_data(1200)
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

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
        results[name] = evaluate_model(name, y_test, preds)

    out = REPORTS_DIR / "evaluation_report.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(json.dumps(results, indent=2))
    print(f"Reporte guardado: {out}")
    return results


if __name__ == "__main__":
    evaluate_saved_models()
