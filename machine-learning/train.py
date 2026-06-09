"""
Entrenamiento ensemble: Random Forest + XGBoost + Stacking.
Compara métricas, guarda JSON/CSV y selecciona el mejor modelo por F1-score.
"""
from __future__ import annotations

import csv
import json
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
)
from sklearn.model_selection import train_test_split

from app.features import FEATURE_NAMES

try:
    from xgboost import XGBClassifier

    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import HistGradientBoostingClassifier as XGBClassifier

    HAS_XGBOOST = False

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


def generate_synthetic_data(n_samples: int = 2500) -> tuple[np.ndarray, np.ndarray]:
    """Dataset sintético con variables de la tesis."""
    np.random.seed(42)
    promedio = np.random.uniform(6, 18, n_samples)
    cursos_desaprobados = np.random.poisson(1.2, n_samples).astype(float)
    asistencia = np.random.uniform(50, 100, n_samples)
    frecuencia_lms = np.random.uniform(15, 98, n_samples)
    tiempo_plataforma = np.random.uniform(0.5, 12, n_samples)
    tareas_ratio = np.random.uniform(0.15, 1.0, n_samples)
    participacion = np.random.uniform(20, 95, n_samples)
    uso_foros = np.random.uniform(0, 1, n_samples)
    disminucion = np.random.uniform(0, 40, n_samples)
    estado = np.random.choice([1.0, 0.5, 0.0], n_samples, p=[0.72, 0.18, 0.10])

    score = (
        (14 - promedio) * 3.0 * 0.22
        + cursos_desaprobados * 9 * 0.12
        + (85 - asistencia) * 0.45 * 0.18
        + (65 - frecuencia_lms) * 0.35 * 0.14
        + (6 - tiempo_plataforma) * 2.5 * 0.08
        + (0.85 - tareas_ratio) * 42 * 0.12
        + (70 - participacion) * 0.25 * 0.08
        + (0.5 - uso_foros) * 18 * 0.06
        + disminucion * 0.35 * 0.06
        + (1 - estado) * 14
    )
    score = np.clip(score, 0, 100)
    labels = np.where(score >= 65, 2, np.where(score >= 41, 1, 0))

    X = np.column_stack([
        promedio,
        cursos_desaprobados,
        asistencia,
        frecuencia_lms,
        tiempo_plataforma,
        tareas_ratio,
        participacion,
        uso_foros,
        disminucion,
        estado,
    ])
    noise = np.random.normal(0, 0.015, X.shape)
    return X + noise, labels


def evaluate_model(name: str, y_test: np.ndarray, preds: np.ndarray) -> dict:
    labels = [0, 1, 2]
    return {
        "accuracy": round(float(accuracy_score(y_test, preds)), 4),
        "precision": round(float(precision_score(y_test, preds, average="weighted", zero_division=0, labels=labels)), 4),
        "recall": round(float(recall_score(y_test, preds, average="weighted", zero_division=0, labels=labels)), 4),
        "f1_score": round(float(f1_score(y_test, preds, average="weighted", zero_division=0, labels=labels)), 4),
        "confusion_matrix": confusion_matrix(y_test, preds, labels=labels).tolist(),
    }


def train_models() -> None:
    print("Generando datos sintéticos (variables tesis)...")
    X, y = generate_synthetic_data(2500)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

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
    rf_metrics = evaluate_model("random_forest", y_test, rf_eval.predict(X_test))

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
            xgb_metrics = evaluate_model("xgboost", y_test, xgb_eval.predict(X_test))
        except Exception as exc:
            print(f"XGBoost omitido por incompatibilidad: {exc}")
            xgb_key = "hist_gradient_boosting"

    if xgb_metrics is None:
        xgb_eval = make_hgb()
        xgb_eval.fit(X_train, y_train)
        xgb_metrics = evaluate_model("hist_gradient_boosting", y_test, xgb_eval.predict(X_test))
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
    stack_metrics = evaluate_model("stacking", y_test, stacking.predict(X_test))

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
        "n_features": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "class_labels": ["bajo", "medio", "alto"],
    }

    with open(MODELS_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    # CSV comparativo
    csv_path = MODELS_DIR / "metrics_comparison.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["model", "accuracy", "precision", "recall", "f1_score"],
        )
        writer.writeheader()
        for model_name, m in results.items():
            writer.writerow({
                "model": model_name,
                "accuracy": m["accuracy"],
                "precision": m["precision"],
                "recall": m["recall"],
                "f1_score": m["f1_score"],
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
