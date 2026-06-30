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
    roc_auc_score,
    roc_curve,
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

LABEL_NAMES = ["bajo", "medio", "alto"]
SCORE_UMBRAL_MEDIO = 41
SCORE_UMBRAL_ALTO = 65


def compute_risk_score(
    promedio: np.ndarray,
    cursos_desaprobados: np.ndarray,
    asistencia: np.ndarray,
    frecuencia_lms: np.ndarray,
    tiempo_plataforma: np.ndarray,
    tareas_ratio: np.ndarray,
    participacion: np.ndarray,
    uso_foros: np.ndarray,
    disminucion: np.ndarray,
    estado: np.ndarray,
) -> np.ndarray:
    """Score de riesgo 0–100 — pesos calibrados para tres clases en datos sintéticos."""
    score = (
        (14 - promedio) * 3.0 * 0.40
        + cursos_desaprobados * 9 * 0.22
        + (85 - asistencia) * 0.45 * 0.30
        + (65 - frecuencia_lms) * 0.35 * 0.22
        + (6 - tiempo_plataforma) * 2.5 * 0.14
        + (0.85 - tareas_ratio) * 42 * 0.18
        + (70 - participacion) * 0.25 * 0.14
        + (0.5 - uso_foros) * 18 * 0.10
        + disminucion * 0.35 * 0.10
        + (1 - estado) * 28
    )
    return np.clip(score, 0, 100)


def score_to_labels(score: np.ndarray) -> np.ndarray:
    return np.where(
        score >= SCORE_UMBRAL_ALTO,
        2,
        np.where(score >= SCORE_UMBRAL_MEDIO, 1, 0),
    )


def _generate_profile_block(
    n: int,
    *,
    promedio_rng: tuple[float, float],
    asistencia_rng: tuple[float, float],
    frecuencia_rng: tuple[float, float],
    tareas_rng: tuple[float, float],
    cursos_lambda: float,
    disminucion_rng: tuple[float, float],
    estado_probs: tuple[float, float, float],
) -> tuple[np.ndarray, ...]:
    promedio = np.random.uniform(*promedio_rng, n)
    cursos_desaprobados = np.random.poisson(cursos_lambda, n).astype(float)
    asistencia = np.random.uniform(*asistencia_rng, n)
    frecuencia_lms = np.random.uniform(*frecuencia_rng, n)
    tiempo_plataforma = np.random.uniform(0.5, 12, n)
    tareas_ratio = np.random.uniform(*tareas_rng, n)
    participacion = np.random.uniform(20, 95, n)
    uso_foros = np.random.uniform(0, 1, n)
    disminucion = np.random.uniform(*disminucion_rng, n)
    estado = np.random.choice([1.0, 0.5, 0.0], n, p=estado_probs)
    return (
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
    )


def generate_synthetic_data(n_samples: int = 2500) -> tuple[np.ndarray, np.ndarray]:
    """Dataset sintético estratificado por perfil académico (bajo / medio / alto riesgo)."""
    np.random.seed(42)
    n_low = n_samples // 3
    n_med = n_samples // 3
    n_high = n_samples - n_low - n_med

    blocks = [
        _generate_profile_block(
            n_low,
            promedio_rng=(14.0, 18.0),
            asistencia_rng=(88.0, 100.0),
            frecuencia_rng=(70.0, 98.0),
            tareas_rng=(0.80, 1.0),
            cursos_lambda=0.4,
            disminucion_rng=(0.0, 12.0),
            estado_probs=(0.92, 0.07, 0.01),
        ),
        _generate_profile_block(
            n_med,
            promedio_rng=(11.0, 14.0),
            asistencia_rng=(72.0, 88.0),
            frecuencia_rng=(45.0, 70.0),
            tareas_rng=(0.55, 0.82),
            cursos_lambda=1.2,
            disminucion_rng=(8.0, 25.0),
            estado_probs=(0.55, 0.35, 0.10),
        ),
        _generate_profile_block(
            n_high,
            promedio_rng=(6.0, 11.0),
            asistencia_rng=(50.0, 75.0),
            frecuencia_rng=(15.0, 48.0),
            tareas_rng=(0.15, 0.55),
            cursos_lambda=2.8,
            disminucion_rng=(18.0, 40.0),
            estado_probs=(0.15, 0.35, 0.50),
        ),
    ]

    arrays = [np.concatenate(parts) for parts in zip(*blocks)]
    (
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
    ) = arrays

    perm = np.random.permutation(n_samples)
    arrays = [arr[perm] for arr in arrays]
    (
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
    ) = arrays

    labels = np.concatenate([
        np.zeros(n_low, dtype=int),
        np.ones(n_med, dtype=int),
        np.full(n_high, 2, dtype=int),
    ])[perm]

    X = np.column_stack(arrays)
    noise = np.random.normal(0, 0.015, X.shape)
    return X + noise, labels


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
        "class_labels": LABEL_NAMES,
        "class_distribution": {
            LABEL_NAMES[i]: int(v) for i, v in enumerate(np.bincount(y, minlength=3))
        },
        "labeling": "estratificado por perfil académico (bajo/medio/alto)",
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
