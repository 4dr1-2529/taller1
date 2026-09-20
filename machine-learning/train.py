"""
Entrenamiento ensemble: Random Forest + XGBoost + Stacking.
Compara métricas, guarda JSON/CSV y selecciona el mejor modelo por F1-score.
"""
from __future__ import annotations

import csv
import json
import os
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier, StackingClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split

from app.features import FEATURE_NAMES
from app.dataset import load_dataset

try:
    from xgboost import XGBClassifier

    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import HistGradientBoostingClassifier as XGBClassifier

    HAS_XGBOOST = False

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

LABEL_NAMES = ["bajo", "medio", "alto"]
SCORE_UMBRAL_MEDIO = 41
SCORE_UMBRAL_ALTO = 65


def evaluate_model(
    name: str,
    y_test: np.ndarray,
    preds: np.ndarray,
    y_proba: np.ndarray | None = None,
) -> dict:
    labels = [0, 1, 2]
    result: dict = {
        "accuracy": round(float(accuracy_score(y_test, preds)), 4),
        "precision": round(float(precision_score(y_test, preds, average="weighted", zero_division=0, labels=labels)), 4),
        "recall": round(float(recall_score(y_test, preds, average="weighted", zero_division=0, labels=labels)), 4),
        "f1_score": round(float(f1_score(y_test, preds, average="weighted", zero_division=0, labels=labels)), 4),
        "confusion_matrix": confusion_matrix(y_test, preds, labels=labels).tolist(),
    }

    if y_proba is None or len(np.unique(y_test)) < 2:
        return result

    result["roc_auc_ovr_weighted"] = round(
        float(roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted", labels=labels)),
        4,
    )
    result["roc_auc_ovr_macro"] = round(
        float(roc_auc_score(y_test, y_proba, multi_class="ovr", average="macro", labels=labels)),
        4,
    )

    per_class_auc: dict[str, float] = {}
    roc_curves: dict[str, dict[str, list[float]]] = {}
    for idx, class_name in enumerate(LABEL_NAMES):
        y_bin = (y_test == idx).astype(int)
        if len(np.unique(y_bin)) < 2:
            continue
        per_class_auc[class_name] = round(float(roc_auc_score(y_bin, y_proba[:, idx])), 4)
        fpr, tpr, _ = roc_curve(y_bin, y_proba[:, idx])
        roc_curves[class_name] = {
            "fpr": [round(float(v), 4) for v in fpr],
            "tpr": [round(float(v), 4) for v in tpr],
        }

    result["roc_auc_per_class"] = per_class_auc
    result["roc_curves"] = roc_curves
    return result


def train_models() -> None:
    mode = os.environ.get("ML_DATA_MODE", "real").lower()
    if mode != "real":
        raise RuntimeError("Generación de datos sintéticos pospuesta a Data Seed v2")
    X, y, data_meta = load_dataset()
    X_dev, X_holdout, y_dev, y_holdout = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X_dev, y_dev, test_size=0.25, random_state=42, stratify=y_dev
    )
    # X_test here is the selection/validation split; holdout is never used for selection.

    def make_rf():
        return RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_leaf=1,
            max_features="sqrt",
            random_state=42,
            class_weight="balanced",
        )

    def make_hgb():
        return HistGradientBoostingClassifier(
            max_iter=150, max_depth=6, learning_rate=0.1, random_state=42
        )

    rf_eval = make_rf()
    rf_eval.fit(X_train, y_train)
    rf_metrics = evaluate_model(
        "random_forest", y_test, rf_eval.predict(X_test), rf_eval.predict_proba(X_test)
    )

    # XGBoost (si es compatible con sklearn instalado)
    xgb_metrics = None
    xgb_eval = None
    xgb_key = "xgboost"
    if HAS_XGBOOST:
        try:
            xgb_eval = XGBClassifier(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                eval_metric="mlogloss",
            )
            xgb_eval.fit(X_train, y_train)
            xgb_metrics = evaluate_model(
                "xgboost", y_test, xgb_eval.predict(X_test), xgb_eval.predict_proba(X_test)
            )
        except Exception as exc:
            print(f"XGBoost omitido por incompatibilidad: {exc}")
            xgb_key = "hist_gradient_boosting"

    if xgb_metrics is None:
        xgb_eval = make_hgb()
        xgb_eval.fit(X_train, y_train)
        xgb_metrics = evaluate_model(
            "hist_gradient_boosting",
            y_test,
            xgb_eval.predict(X_test),
            xgb_eval.predict_proba(X_test),
        )
        xgb_key = "hist_gradient_boosting"

    # Stacking: RF + HGB (estable con sklearn 1.6+)
    stacking = StackingClassifier(
        estimators=[("rf", make_rf()), ("hgb", make_hgb())],
        final_estimator=RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_leaf=1,
            max_features="sqrt",
            random_state=42,
        ),
        cv=3,
        passthrough=False,
    )
    stacking.fit(X_train, y_train)
    stack_metrics = evaluate_model(
        "stacking", y_test, stacking.predict(X_test), stacking.predict_proba(X_test)
    )

    results = {
        "random_forest": rf_metrics,
        xgb_key: xgb_metrics,
        "stacking": stack_metrics,
    }

    # Mejor modelo por F1-score
    best_key = max(results.keys(), key=lambda k: results[k]["f1_score"])
    best_f1 = results[best_key]["f1_score"]
    models_map = {"random_forest": rf_eval, xgb_key: xgb_eval, "stacking": stacking}
    best_model = models_map[best_key]

    print(f"\nMejor modelo por F1: {best_key} (F1={best_f1})")

    validation_results = results
    results = {name: evaluate_model(name, y_holdout, m.predict(X_holdout), m.predict_proba(X_holdout)) for name, m in models_map.items()}
    joblib.dump({"X": X_holdout, "y": y_holdout, "features": FEATURE_NAMES}, MODELS_DIR / "holdout.joblib")
    joblib.dump(best_model, MODELS_DIR / "best_model.joblib")
    joblib.dump(stacking, MODELS_DIR / "stacking_model.joblib")
    joblib.dump(rf_eval, MODELS_DIR / "random_forest_model.joblib")
    joblib.dump(xgb_eval, MODELS_DIR / "xgboost_model.joblib")
    joblib.dump(FEATURE_NAMES, MODELS_DIR / "features.joblib")

    payload = {
        **results,
        "best_model": best_key,
        "best_f1_score": best_f1,
        "model_used": "XGBoost" if HAS_XGBOOST else "HistGradientBoosting",
        "n_samples": int(X.shape[0]),
        "train_size": int(X_train.shape[0]),
        "validation_size": int(X_test.shape[0]),
        "test_size": int(X_holdout.shape[0]),
        "selection": "validation_f1_weighted",
        "validation_results": validation_results,
        "data_source": data_meta["data_source"],
        "data_mode": mode,
        "n_features": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "class_labels": LABEL_NAMES,
        "class_distribution": {
            LABEL_NAMES[i]: int(v) for i, v in enumerate(np.bincount(y, minlength=3))
        },
        "labeling": "Etiquetas externas del dataset; justificar su procedencia antes de uso científico",
        "score_thresholds": {"medio": SCORE_UMBRAL_MEDIO, "alto": SCORE_UMBRAL_ALTO},
    }

    with open(MODELS_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    # CSV comparativo
    csv_path = MODELS_DIR / "metrics_comparison.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["model", "accuracy", "precision", "recall", "f1_score", "roc_auc_ovr_weighted"],
        )
        writer.writeheader()
        for model_name, m in results.items():
            writer.writerow({
                "model": model_name,
                "accuracy": m["accuracy"],
                "precision": m["precision"],
                "recall": m["recall"],
                "f1_score": m["f1_score"],
                "roc_auc_ovr_weighted": m.get("roc_auc_ovr_weighted"),
            })

    history = {
        "trained_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "best_model": best_key,
        "best_f1_score": best_f1,
        "n_samples": int(X.shape[0]),
        "results": results,
    }
    with open(MODELS_DIR / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

    print(f"Artefactos en {MODELS_DIR}")
    print("Entrenamiento completado.")


if __name__ == "__main__":
    train_models()
