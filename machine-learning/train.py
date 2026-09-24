"""
Entrenamiento binario V6 (permanencia/deserción): Random Forest + XGBoost/HGB + Stacking.

Reglas del pipeline experimental:
- Clasificación BINARIA: 0 = permanece, 1 = deserta. Salida del modelo = P(deserción).
- La banda Bajo/Medio/Alto se deriva después, en la capa de dominio
  (app/thresholds.py), con umbrales operativos 0.41 / 0.65.
- El split (train/validation/holdout) viene del CSV: no se remezcla.
- La selección del modelo se hace SOLO con validation (F1 de la clase deserción,
  complementado con PR-AUC, ROC-AUC y balanced accuracy). El holdout se evalúa
  una sola vez y nunca decide qué modelo gana.
- Los artefactos sintéticos viven en artifacts/synthetic/; nunca en artifacts/real/.
"""
from __future__ import annotations

import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier, StackingClassifier
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.dataset import (  # noqa: E402
    REAL_MODE,
    SYNTHETIC_MODE,
    DatasetError,
    load_dataset,
    resolve_mode,
)
from app.features import FEATURE_NAMES  # noqa: E402
from app.thresholds import (  # noqa: E402
    CONTRACT_VERSION,
    RISK_THRESHOLDS,
    level_from_probability,
    thresholds_payload,
)

try:
    from xgboost import XGBClassifier

    HAS_XGBOOST = True
except ImportError:  # pragma: no cover - depende del entorno
    from sklearn.ensemble import HistGradientBoostingClassifier as XGBClassifier

    HAS_XGBOOST = False

ROOT = Path(__file__).resolve().parent
LABEL_NAMES = ["permanece", "deserta"]
SCORE_UMBRAL_MEDIO = RISK_THRESHOLDS["medio"]
SCORE_UMBRAL_ALTO = RISK_THRESHOLDS["alto"]


def artifacts_dir(mode: str) -> Path:
    """Artefactos separados por modo: synthetic nunca escribe dentro de real/."""
    if mode == SYNTHETIC_MODE:
        target = ROOT / "artifacts" / "synthetic"
    elif mode == REAL_MODE:
        target = ROOT / "artifacts" / "real"
    else:  # pragma: no cover - resolve_mode ya valida
        raise RuntimeError(f"ML_DATA_MODE inválido: {mode}")
    target.mkdir(parents=True, exist_ok=True)
    return target


def _round(value: float | None, digits: int = 4) -> float | None:
    if value is None or not np.isfinite(value):
        return None
    return round(float(value), digits)


def tune_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> tuple[float, float]:
    """Ajusta el umbral de decisión binario SOLO sobre validation (F1 deserción)."""
    best_threshold, best_f1 = 0.5, -1.0
    for step in range(5, 100):
        threshold = step / 100
        preds = (y_prob >= threshold).astype(int)
        score = f1_score(y_true, preds, zero_division=0)
        if score > best_f1:
            best_f1, best_threshold = float(score), threshold
    return round(best_threshold, 2), round(max(best_f1, 0.0), 4)


def evaluate_binary(
    name: str,
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float,
) -> dict:
    """Métricas binarias completas para un conjunto (validation o holdout)."""
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob, dtype=float)
    y_pred = (y_prob >= threshold).astype(int)

    tn, fp, fn, tp = (confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel().tolist()
                      if len(y_true) else [0, 0, 0, 0])
    tn, fp, fn, tp = int(tn), int(fp), int(fn), int(tp)
    specificity = tn / (tn + fp) if (tn + fp) else None
    sensitivity = tp / (tp + fn) if (tp + fn) else None
    single_class = len(np.unique(y_true)) < 2

    quantiles = np.quantile(y_prob, [0, 0.25, 0.5, 0.75, 1]) if len(y_prob) else [0, 0, 0, 0, 0]

    return {
        "model": name,
        "n_samples": int(len(y_true)),
        "positive_rate_true": _round(float(np.mean(y_true)) if len(y_true) else 0.0),
        "positive_rate_pred": _round(float(np.mean(y_pred)) if len(y_pred) else 0.0),
        "threshold": threshold,
        "accuracy": _round(accuracy_score(y_true, y_pred)) if len(y_true) else None,
        "precision": _round(precision_score(y_true, y_pred, zero_division=0)),
        "recall": _round(recall_score(y_true, y_pred, zero_division=0)),
        "f1_score": _round(f1_score(y_true, y_pred, zero_division=0)),
        "f1_desercion": _round(f1_score(y_true, y_pred, zero_division=0)),
        "balanced_accuracy": _round(balanced_accuracy_score(y_true, y_pred)) if not single_class else None,
        "roc_auc": _round(roc_auc_score(y_true, y_prob)) if not single_class else None,
        "pr_auc": _round(average_precision_score(y_true, y_prob)) if not single_class else None,
        "brier": _round(brier_score_loss(y_true, y_prob)) if len(y_true) else None,
        "confusion_matrix": [[tn, fp], [fn, tp]],
        "tn": tn, "fp": fp, "fn": fn, "tp": tp,
        "specificity": _round(specificity),
        "sensitivity": _round(sensitivity),
        "probability_distribution": {
            "min": _round(float(quantiles[0])),
            "p25": _round(float(quantiles[1])),
            "median": _round(float(quantiles[2])),
            "p75": _round(float(quantiles[3])),
            "max": _round(float(quantiles[4])),
            "mean": _round(float(np.mean(y_prob)) if len(y_prob) else 0.0),
        },
        "class_labels": LABEL_NAMES,
        "target": "target_desercion",
    }


def _predict_positive(model, X: np.ndarray) -> np.ndarray:
    proba = model.predict_proba(X)
    classes = list(getattr(model, "classes_", []))
    if 1 in classes:
        return proba[:, classes.index(1)]
    return proba[:, -1]


def _feature_importance(model, feature_names: list[str]) -> tuple[dict[str, float], str]:
    if hasattr(model, "feature_importances_"):
        values = np.asarray(model.feature_importances_, dtype=float)
        if len(values) == len(feature_names):
            source = type(model).__name__
            return {n: round(float(v), 4) for n, v in zip(feature_names, values)}, source
    base = getattr(model, "estimators_", None)
    if base:
        first = base[0][1] if isinstance(base[0], (list, tuple)) else base[0]
        if hasattr(first, "feature_importances_"):
            values = np.asarray(first.feature_importances_, dtype=float)
            if len(values) == len(feature_names):
                return (
                    {n: round(float(v), 4) for n, v in zip(feature_names, values)},
                    f"{type(first).__name__} (base del stacking)",
                )
    return {}, "no disponible"


def train_models() -> dict:
    mode = resolve_mode()
    out_dir = artifacts_dir(mode)

    X, y, meta = load_dataset()
    splits = np.asarray(meta["splits"], dtype=object)
    train_mask = splits == "train"
    val_mask = splits == "validation"
    holdout_mask = splits == "holdout"

    if not train_mask.any() or not val_mask.any() or not holdout_mask.any():
        raise DatasetError("El dataset debe contener los splits train, validation y holdout.")

    X_train, y_train = X[train_mask], y[train_mask]
    X_val, y_val = X[val_mask], y[val_mask]
    X_ho, y_ho = X[holdout_mask], y[holdout_mask]
    n_pos = max(int((y_train == 1).sum()), 1)
    n_neg = max(int((y_train == 0).sum()), 1)
    pos_weight = round(n_neg / n_pos, 3)

    def make_rf() -> RandomForestClassifier:
        return RandomForestClassifier(
            n_estimators=300,
            max_depth=6,
            min_samples_leaf=3,
            max_features="sqrt",
            random_state=42,
            class_weight="balanced",
        )

    def make_hgb() -> HistGradientBoostingClassifier:
        return HistGradientBoostingClassifier(
            max_iter=300, max_depth=4, learning_rate=0.05,
            l2_regularization=1.0, class_weight="balanced", random_state=42,
        )

    models: dict[str, object] = {"random_forest": make_rf()}

    xgb_key = "xgboost"
    if HAS_XGBOOST:
        try:
            models["xgboost"] = XGBClassifier(
                n_estimators=300,
                max_depth=3,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_lambda=2.0,
                scale_pos_weight=pos_weight,
                random_state=42,
                eval_metric="logloss",
            )
        except Exception as exc:  # pragma: no cover
            print(f"XGBoost omitido por incompatibilidad: {exc}")
            xgb_key = "hist_gradient_boosting"
    else:
        xgb_key = "hist_gradient_boosting"
    if xgb_key not in models:
        models[xgb_key] = make_hgb()

    models["stacking"] = StackingClassifier(
        estimators=[("rf", make_rf()), ("hgb", make_hgb())],
        final_estimator=RandomForestClassifier(
            n_estimators=150, max_depth=4, min_samples_leaf=3,
            max_features="sqrt", class_weight="balanced", random_state=42,
        ),
        cv=3,
        passthrough=False,
    )

    print(f"MODE={mode} DATASET={meta['dataset_version']} ROWS={int(meta['n_snapshots'])} "
          f"STUDENTS={int(meta['n_students'])} FEATURES={len(FEATURE_NAMES)}")
    print(f"SPLIT_TRAIN={int(train_mask.sum())} SPLIT_VALIDATION={int(val_mask.sum())} "
          f"SPLIT_HOLDOUT={int(holdout_mask.sum())}")
    print(f"CLASS_DISTRIBUTION={json.dumps(meta['class_distribution'])}")

    # 1) Entrenamiento exclusivamente sobre split=train
    for name, model in models.items():
        model.fit(X_train, y_train)
        print(f"TRAINED={name} samples={int(train_mask.sum())}")

    # 2) Selección SOLO con validation
    validation_results: dict[str, dict] = {}
    thresholds: dict[str, float] = {}
    for name, model in models.items():
        val_prob = _predict_positive(model, X_val)
        threshold, _ = tune_threshold(y_val, val_prob)
        thresholds[name] = threshold
        validation_results[name] = evaluate_binary(name, y_val, val_prob, threshold)

    best_key = max(
        validation_results,
        key=lambda k: (
            validation_results[k]["f1_score"] or 0.0,
            validation_results[k]["pr_auc"] or 0.0,
            validation_results[k]["roc_auc"] or 0.0,
            validation_results[k]["balanced_accuracy"] or 0.0,
        ),
    )
    best_model = models[best_key]
    best_threshold = thresholds[best_key]
    print(f"BEST_MODEL={best_key} SPLIT=validation "
          f"F1={validation_results[best_key]['f1_score']} "
          f"PR_AUC={validation_results[best_key]['pr_auc']} "
          f"ROC_AUC={validation_results[best_key]['roc_auc']} "
          f"THRESHOLD={best_threshold}")

    # 3) Holdout: evaluación única (reporte), nunca para elegir modelo
    holdout_results: dict[str, dict] = {}
    for name, model in models.items():
        ho_prob = _predict_positive(model, X_ho)
        holdout_results[name] = evaluate_binary(name, y_ho, ho_prob, thresholds[name])

    best_holdout = holdout_results[best_key]
    print(f"HOLDOUT_{best_key} ACC={best_holdout['accuracy']} "
          f"PREC={best_holdout['precision']} REC={best_holdout['recall']} "
          f"F1={best_holdout['f1_score']} ROC_AUC={best_holdout['roc_auc']} "
          f"PR_AUC={best_holdout['pr_auc']}")

    # 4) Reparto de probabilidades del mejor modelo (distribución por banda)
    best_val_prob = _predict_positive(best_model, X_val)
    best_ho_prob = _predict_positive(best_model, X_ho)
    all_prob = np.concatenate([best_val_prob, best_ho_prob])
    levels = [level_from_probability(float(p)) for p in all_prob]
    level_distribution = {name: levels.count(name) for name in ("bajo", "medio", "alto")}

    # 5) Importancia de variables (señales asociadas, no causalidad)
    importance, importance_source = _feature_importance(best_model, FEATURE_NAMES)

    # 6) Alerta de posible leakage si las métricas son demasiado perfectas
    leak_signals = [
        f"{split}.{metric}={value}"
        for split, results in (("validation", validation_results), ("holdout", holdout_results))
        for metric in ("accuracy", "roc_auc")
        for value in [results[best_key][metric]]
        if value is not None and value > 0.95
    ]
    leakage_review = bool(leak_signals)
    if leakage_review:
        print(f"LEAKAGE_REVIEW_REQUIRED=true SIGNALS={','.join(leak_signals)}")

    model_version = f"BLENKIR_V6_BIN_{datetime.now(timezone.utc).strftime('%Y%m%d')}"
    trained_at = datetime.now(timezone.utc).isoformat()

    # 7) Artefactos (sintéticos => artifacts/synthetic, nunca artifacts/real)
    joblib.dump(best_model, out_dir / "best_model.joblib")
    joblib.dump(models["random_forest"], out_dir / "random_forest_model.joblib")
    booster_key = "xgboost" if "xgboost" in models else "hist_gradient_boosting"
    joblib.dump(models[booster_key], out_dir / f"{booster_key}_model.joblib")
    joblib.dump(models["stacking"], out_dir / "stacking_model.joblib")
    joblib.dump(FEATURE_NAMES, out_dir / "features.joblib")
    joblib.dump(
        {"X": X_ho, "y": y_ho, "splits": splits, "features": FEATURE_NAMES},
        out_dir / "holdout.joblib",
    )

    payload: dict = {
        "random_forest": validation_results["random_forest"],
        booster_key: validation_results[booster_key],
        "stacking": validation_results["stacking"],
        "best_model": best_key,
        "best_f1_score": validation_results[best_key]["f1_score"],
        // Etiqueta descriptiva del modelo servido (coincide con best_model y con /health).
        "model_used": best_key,
        "model_version": model_version,
        "contract_version": CONTRACT_VERSION,
        "decision_threshold": best_threshold,
        "decision_thresholds": thresholds,
        "risk_thresholds": thresholds_payload(),
        "risk_level_rule": "probabilidad<0.41=bajo; 0.41<=p<0.65=medio; p>=0.65=alto",
        "selection": "validation_f1_desercion",
        "selection_metrics": validation_results[best_key],
        "holdout_used_for_selection": False,
        "validation_results": validation_results,
        "holdout_results": holdout_results,
        "final_metrics": {"split": "holdout", "model": best_key, **best_holdout},
        "level_distribution_validation_holdout": level_distribution,
        "n_samples": int(X.shape[0]),
        "train_size": int(train_mask.sum()),
        "validation_size": int(val_mask.sum()),
        "test_size": int(holdout_mask.sum()),
        "train_students": int(meta["split_students"]["train"]),
        "validation_students": int(meta["split_students"]["validation"]),
        "holdout_students": int(meta["split_students"]["holdout"]),
        "data_source": meta["data_source"],
        "data_mode": meta["data_mode"],
        "dataset_version": meta["dataset_version"],
        "n_features": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "class_labels": LABEL_NAMES,
        "class_distribution": meta["class_distribution"],
        "split_distribution": meta["split_distribution"],
        "target": "target_desercion",
        "target_type": "binario (0=permanece, 1=deserta)",
        "feature_importance": importance,
        "feature_importance_source": importance_source,
        "leakage_review_required": leakage_review,
        "labeling": "Datos científicos sintéticos V6: resultados EXPERIMENTALES, "
                    "no evidencia institucional ni validación científica.",
        "experimental": True,
        "timestamp": trained_at,
    }
    (out_dir / "metrics.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    with (out_dir / "metrics_comparison.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "model", "split", "accuracy", "precision", "recall", "f1_score",
                "balanced_accuracy", "roc_auc", "pr_auc", "brier", "threshold",
                "tn", "fp", "fn", "tp", "specificity", "sensitivity",
            ],
        )
        writer.writeheader()
        for split_name, results in (("validation", validation_results), ("holdout", holdout_results)):
            for model_name, m in results.items():
                writer.writerow({
                    "model": model_name,
                    "split": split_name,
                    "accuracy": m["accuracy"],
                    "precision": m["precision"],
                    "recall": m["recall"],
                    "f1_score": m["f1_score"],
                    "balanced_accuracy": m["balanced_accuracy"],
                    "roc_auc": m["roc_auc"],
                    "pr_auc": m["pr_auc"],
                    "brier": m["brier"],
                    "threshold": m["threshold"],
                    "tn": m["tn"], "fp": m["fp"], "fn": m["fn"], "tp": m["tp"],
                    "specificity": m["specificity"],
                    "sensitivity": m["sensitivity"],
                })

    history = {
        "trained_at": trained_at,
        "best_model": best_key,
        "best_f1_score": validation_results[best_key]["f1_score"],
        "decision_threshold": best_threshold,
        "n_samples": int(X.shape[0]),
        "data_mode": meta["data_mode"],
        "dataset_version": meta["dataset_version"],
        "model_version": model_version,
        "selection": "validation_f1_desercion",
        "holdout_results": holdout_results,
        "validation_results": validation_results,
    }
    (out_dir / "training_history.json").write_text(
        json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    metadata = {
        "data_mode": meta["data_mode"],
        "dataset_version": meta["dataset_version"],
        "n_features": len(FEATURE_NAMES),
        "feature_names": list(FEATURE_NAMES),
        "model_version": model_version,
        "model_selected": best_key,
        "contract_version": CONTRACT_VERSION,
        "trained_at": trained_at,
        "cutoffs": meta.get("cutoffs", []),
        "outcome_date": meta.get("outcome_date"),
        "target": "target_desercion",
        "decision_threshold": best_threshold,
        "risk_thresholds": thresholds_payload(),
        "splits": {k: int(v) for k, v in meta["split_distribution"].items()},
        "split_students": {k: int(v) for k, v in meta["split_students"].items()},
        "n_students": int(meta["n_students"]),
        "n_snapshots": int(meta["n_snapshots"]),
        "experimental": True,
        "labeling": "RESULTADOS EXPERIMENTALES CON DATOS SINTÉTICOS",
    }
    (out_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"ARTIFACTS_DIR={out_dir}")
    print(f"METRICS={out_dir / 'metrics.json'}")
    print("TRAINING_COMPLETED=true")
    return payload


if __name__ == "__main__":
    try:
        train_models()
    except DatasetError as exc:
        print(f"DATASET_ERROR={exc}")
        sys.exit(1)
