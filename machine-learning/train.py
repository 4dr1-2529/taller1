"""ML Training Script - Real XGBoost + Random Forest + Stacking Ensemble."""
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import HistGradientBoostingClassifier as XGBClassifier
    HAS_XGBOOST = False

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


def generate_synthetic_data(n_samples: int = 2000) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Generate realistic synthetic student data for training."""
    np.random.seed(42)

    promedio = np.random.uniform(6, 18, n_samples)
    asistencia = np.random.uniform(50, 100, n_samples)
    lms_actividad = np.random.uniform(20, 95, n_samples)
    tareas_ratio = np.random.uniform(0.2, 1.0, n_samples)
    estado = np.random.choice([1.0, 0.5, 0.0], n_samples, p=[0.7, 0.2, 0.1])

    score = (
        (14 - promedio) * 3.2 * 0.32 +
        (85 - asistencia) * 0.6 * 0.28 +
        (60 - lms_actividad) * 0.4 * 0.22 +
        (0.80 - tareas_ratio) * 50 * 0.18 +
        (1 - estado) * 15
    )
    score = np.clip(score, 0, 100)

    labels = np.where(score >= 65, 2, np.where(score >= 41, 1, 0))

    X = np.column_stack([promedio, asistencia, lms_actividad, tareas_ratio, estado])
    feature_names = ["promedio_general", "asistencia_general", "actividad_lms_prom", "tareas_ratio", "estado"]

    noise = np.random.normal(0, 0.02, X.shape)
    X = X + noise

    return X, labels, feature_names


def train_models():
    """Train RF, XGBoost, and Stacking ensemble."""
    print("Generating synthetic data...")
    X, y, feature_names = generate_synthetic_data(2000)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
    print(f"Class distribution: {np.bincount(y_train)}")

    rf = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42, class_weight="balanced")
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)

    model_name = "XGBoost" if HAS_XGBOOST else "HistGradientBoosting"
    print(f"Training {model_name}...")
    xgb_params = {
        "n_estimators": 150,
        "max_depth": 6,
        "learning_rate": 0.1,
        "random_state": 42,
    }
    if HAS_XGBOOST:
        xgb_params.update({"eval_metric": "mlogloss"})
    else:
        xgb_params = {"max_iter": 150, "max_depth": 6, "learning_rate": 0.1, "random_state": 42}

    xgb = XGBClassifier(**xgb_params)
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)

    print("Training Stacking Ensemble...")
    stacking = StackingClassifier(
        estimators=[("rf", rf), ("xgb", xgb)],
        final_estimator=RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
        cv=5,
    )
    stacking.fit(X_train, y_train)
    stack_pred = stacking.predict(X_test)

    results = {}
    for name, preds in [("random_forest", rf_pred), (model_name.lower().replace("histgradient", "xg"), xgb_pred), ("stacking", stack_pred)]:
        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, average="weighted", zero_division=0)
        rec = recall_score(y_test, preds, average="weighted", zero_division=0)
        f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
        cm = confusion_matrix(y_test, preds).tolist()
        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm,
        }
        print(f"\n{name.upper()}:")
        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1-Score:  {f1:.4f}")

    joblib.dump(stacking, MODELS_DIR / "stacking_model.joblib")
    joblib.dump(feature_names, MODELS_DIR / "features.joblib")

    results["model_used"] = model_name if HAS_XGBOOST else "HistGradientBoosting (XGBoost not installed)"
    results["n_samples"] = 2000
    results["n_features"] = len(feature_names)
    results["features"] = feature_names

    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nModels saved to {MODELS_DIR}")
    print("Training complete!")


if __name__ == "__main__":
    train_models()
