"""Genera gráficos ML reales desde modelos entrenados localmente."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    RocCurveDisplay,
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize

ROOT = Path(__file__).resolve().parents[2]
ML = ROOT / "machine-learning"
MODELS = ML / "models"
OUT_IA = ROOT / "docs" / "evidencias_finales" / "ia"
OUT_MET = ROOT / "docs" / "evidencias_finales" / "metricas"
OUT_LEGACY_IA = ROOT / "docs" / "evidencias" / "ia"

for d in (OUT_IA, OUT_MET, OUT_LEGACY_IA):
    d.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ML))
from train import generate_synthetic_data  # noqa: E402
from app.features import FEATURE_NAMES  # noqa: E402

plt.style.use("seaborn-v0_8-whitegrid")
sns.set_palette("deep")


def save_fig(name: str, dpi=200):
    for folder in (OUT_IA, OUT_MET, OUT_LEGACY_IA):
        dest = folder / name
        plt.savefig(dest, dpi=dpi, bbox_inches="tight", facecolor="white")
    plt.close()
    print(f"  OK {name}")


def main():
    metrics_path = MODELS / "metrics.json"
    if not metrics_path.exists():
        raise FileNotFoundError("Ejecute npm run ml:train primero.")

    with open(metrics_path, encoding="utf-8") as f:
        stored = json.load(f)

    model = joblib.load(MODELS / "best_model.joblib")
    X, y = generate_synthetic_data(2500)
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    y_pred = model.predict(X_test)
    labels = [0, 1, 2]
    class_names = ["Bajo", "Medio", "Alto"]

    cm = confusion_matrix(y_test, y_pred, labels=labels)
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
        ax=ax,
    )
    ax.set_xlabel("Predicho")
    ax.set_ylabel("Real")
    ax.set_title("Matriz de confusión — best_model (datos reales test set)")
    save_fig("matriz-confusion.png")

    # ROC multiclase OvR (si hay probabilidades y clases en test)
    auc_macro = float("nan")
    if hasattr(model, "predict_proba"):
        y_score = model.predict_proba(X_test)
        classes = list(getattr(model, "classes_", labels))
        y_bin = label_binarize(y_test, classes=classes)
        fig, ax = plt.subplots(figsize=(8, 6))
        plotted = False
        for i, cls in enumerate(classes):
            if i >= y_score.shape[1] or i >= y_bin.shape[1]:
                break
            if y_bin[:, i].max() == 0 and y_bin[:, i].min() == 0:
                continue
            cn = class_names[int(cls)] if int(cls) < len(class_names) else str(cls)
            try:
                RocCurveDisplay.from_predictions(y_bin[:, i], y_score[:, i], name=cn, ax=ax)
                plotted = True
            except ValueError:
                pass
        if plotted:
            ax.plot([0, 1], [0, 1], "k--", alpha=0.4)
            ax.set_title("Curvas ROC (One-vs-Rest) — modelo entrenado local")
            save_fig("curva-roc.png")
            try:
                auc_macro = roc_auc_score(y_bin[:, : y_score.shape[1]], y_score, average="macro", multi_class="ovr")
            except Exception:
                auc_macro = float("nan")
        else:
            fig, ax = plt.subplots(figsize=(8, 4))
            ax.text(0.5, 0.5, "ROC no disponible: test set sin variabilidad\nen todas las clases (datos reales del split)",
                    ha="center", va="center", fontsize=11)
            ax.axis("off")
            save_fig("curva-roc.png")

    # Feature importance (RandomForest o meta)
    importances = None
    feat_names = FEATURE_NAMES
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "final_estimator_") and hasattr(model.final_estimator_, "feature_importances_"):
        importances = model.final_estimator_.feature_importances_

    if importances is not None:
        idx = np.argsort(importances)[::-1]
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.barh([feat_names[i] for i in idx[::-1]], importances[idx[::-1]], color="#1f3a5f")
        ax.set_xlabel("Importancia")
        ax.set_title("Feature Importance — modelo ensemble")
        save_fig("feature-importance.png")

    # Métricas comparativas desde metrics.json
    models = ["random_forest", "xgboost", "stacking"]
    metrics_keys = []
    for k in models:
        if k in stored:
            metrics_keys.append(k)
    for k in stored:
        if k not in metrics_keys and isinstance(stored[k], dict) and "f1_score" in stored[k]:
            metrics_keys.append(k)

    metric_names = ["accuracy", "precision", "recall", "f1_score"]
    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(metric_names))
    width = 0.25
    for i, mk in enumerate(metrics_keys[:3]):
        vals = [stored[mk].get(m, 0) for m in metric_names]
        ax.bar(x + i * width, vals, width, label=mk.replace("_", " ").title())
    ax.set_xticks(x + width)
    ax.set_xticklabels(["Accuracy", "Precision", "Recall", "F1-Score"])
    ax.set_ylim(0, 1.05)
    ax.set_title("Métricas comparativas — entrenamiento local real")
    ax.legend()
    save_fig("metricas-comparativas.png")

    # Tabla métricas best model en test
    report = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision_weighted": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "recall_weighted": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "auc_macro_ovr": round(float(auc_macro), 4) if auc_macro == auc_macro else None,
        "best_model_file": stored.get("best_model"),
        "n_test_samples": int(len(y_test)),
        "classification_report": classification_report(
            y_test, y_pred, labels=labels, target_names=class_names, zero_division=0
        ),
    }
    out_json = OUT_MET / "metricas-evaluacion-local.json"
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT_LEGACY_IA / "metricas-evaluacion-local.json").write_text(out_json.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"  OK metricas-evaluacion-local.json")

    # Gráfico individual métricas best model
    fig, ax = plt.subplots(figsize=(8, 5))
    vals = [report["accuracy"], report["precision_weighted"], report["recall_weighted"], report["f1_weighted"]]
    colors = ["#1f3a5f", "#f47c20", "#2d6a4f", "#7b2cbf"]
    bars = ax.bar(["Accuracy", "Precision", "Recall", "F1"], vals, color=colors)
    ax.set_ylim(0, 1.05)
    ax.set_title(f"Best model ({stored.get('best_model')}) — evaluación test local")
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.02, f"{v:.3f}", ha="center")
    if report["auc_macro_ovr"] is not None:
        ax.text(0.02, 0.95, f"AUC macro OvR: {report['auc_macro_ovr']:.3f}", transform=ax.transAxes)
    save_fig("metricas-best-model.png")

    # Imágenes individuales por métrica (informe / sustentación)
    individual = [
        ("metricas-accuracy.png", "Accuracy", report["accuracy"], "#1f3a5f"),
        ("metricas-precision.png", "Precision (weighted)", report["precision_weighted"], "#f47c20"),
        ("metricas-recall.png", "Recall (weighted)", report["recall_weighted"], "#2d6a4f"),
        ("metricas-f1.png", "F1-Score (weighted)", report["f1_weighted"], "#7b2cbf"),
    ]
    if report["auc_macro_ovr"] is not None:
        individual.append(("metricas-auc.png", "AUC macro OvR", report["auc_macro_ovr"], "#0369a1"))

    for fname, title, val, color in individual:
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.bar([title], [val], color=color, width=0.4)
        ax.set_ylim(0, 1.05)
        ax.set_title(f"{title} — best_model (test local)")
        ax.text(0, val + 0.03, f"{val:.4f}", ha="center", fontweight="bold")
        save_fig(fname)

    print("Gráficos ML generados.")


if __name__ == "__main__":
    main()
