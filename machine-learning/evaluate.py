"""Evaluación de los modelos guardados sobre el holdout — sin reentrenar.

Uso: ML_DATA_MODE=synthetic_scientific python evaluate.py
Las métricas se calculan con el umbral decidido en validation (no en holdout).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.features import FEATURE_NAMES  # noqa: E402
from train import _predict_positive, artifacts_dir, evaluate_binary  # noqa: E402
from app.dataset import resolve_mode  # noqa: E402

ROOT = Path(__file__).resolve().parent
REPORTS_DIR = ROOT / "reports"


def evaluate_saved_models() -> dict:
    mode = resolve_mode()
    directory = artifacts_dir(mode)

    if list(joblib.load(directory / "features.joblib")) != FEATURE_NAMES:
        raise ValueError("Modelo incompatible con el contrato de siete features")

    holdout = joblib.load(directory / "holdout.joblib")
    if holdout["features"] != FEATURE_NAMES:
        raise ValueError("Holdout incompatible")
    X_holdout, y_holdout = holdout["X"], holdout["y"]

    metrics = json.loads((directory / "metrics.json").read_text(encoding="utf-8"))
    thresholds = metrics.get("decision_thresholds", {})
    default_threshold = float(metrics.get("decision_threshold", 0.5))

    results: dict[str, dict] = {}
    for name, filename in [
        ("random_forest", "random_forest_model.joblib"),
        ("xgboost", "xgboost_model.joblib"),
        ("hist_gradient_boosting", "hist_gradient_boosting_model.joblib"),
        ("stacking", "stacking_model.joblib"),
        ("best_model", "best_model.joblib"),
    ]:
        path = directory / filename
        if not path.exists():
            continue
        model = joblib.load(path)
        key = "best_model" if name == "best_model" else name
        threshold = float(thresholds.get(name, default_threshold))
        results[key] = evaluate_binary(
            key, y_holdout, _predict_positive(model, X_holdout), threshold
        )

    REPORTS_DIR.mkdir(exist_ok=True)
    out = REPORTS_DIR / f"evaluation_report_{mode}.json"
    out.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(results, indent=2))
    print(f"Reporte guardado: {out}")
    return results


if __name__ == "__main__":
    evaluate_saved_models()
