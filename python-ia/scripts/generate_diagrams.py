"""
Genera diagramas del módulo IA a partir de artefactos reales del proyecto.
Uso (desde raíz del monorepo):
  python python-ia/scripts/generate_diagrams.py
Requiere: matplotlib, joblib, sklearn — mismas deps que machine-learning/
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
ML = ROOT / "machine-learning"
MODELS = ML / "models"
OUT = Path(__file__).resolve().parents[1] / "diagramas"
OUT.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ML))
from train import generate_synthetic_data  # noqa: E402

PALETTE = {
    "bg": "#0f172a",
    "card": "#1e293b",
    "accent": "#3b82f6",
    "accent2": "#10b981",
    "accent3": "#f59e0b",
    "accent4": "#ef4444",
    "text": "#f1f5f9",
    "muted": "#94a3b8",
    "grid": "#334155",
}

CLASS_LABELS = ["bajo", "medio", "alto"]
CLASS_COLORS = ["#10b981", "#f59e0b", "#ef4444"]


def _style_ax(ax, title: str) -> None:
    ax.set_facecolor(PALETTE["card"])
    ax.figure.patch.set_facecolor(PALETTE["bg"])
    ax.set_title(title, color=PALETTE["text"], fontsize=13, fontweight="bold", pad=12)
    ax.tick_params(colors=PALETTE["muted"])
    for spine in ax.spines.values():
        spine.set_color(PALETTE["grid"])


def load_metrics() -> dict:
    path = MODELS / "metrics.json"
    if not path.exists():
        raise FileNotFoundError(f"Ejecute primero: cd machine-learning && python train.py ({path})")
    return json.loads(path.read_text(encoding="utf-8"))


def diagram_arquitectura() -> None:
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7)
    ax.axis("off")
    fig.patch.set_facecolor(PALETTE["bg"])

    boxes = [
        (0.5, 4.5, 2.8, 1.4, "Next.js :3029", "PredictionView\nStudentPredictionView"),
        (0.5, 2.3, 2.8, 1.4, "Express :4000", "POST /predict\nml-client.ts"),
        (0.5, 0.3, 2.8, 1.4, "MySQL + Prisma", "Student, Grade\nLmsActividad, Prediction"),
        (5.5, 3.2, 3.2, 2.2, "FastAPI :5000", "POST /predict\nGET /metrics /health"),
        (9.5, 3.8, 3.8, 1.6, "Modelos joblib", "best_model.joblib\nRF / XGB / Stacking"),
        (9.5, 1.6, 3.8, 1.6, "train.py", "generate_synthetic_data\nStackingClassifier"),
    ]
    for x, y, w, h, title, body in boxes:
        rect = FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.04",
            facecolor=PALETTE["card"], edgecolor=PALETTE["accent"], linewidth=1.5,
        )
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h - 0.35, title, ha="center", va="top",
                fontsize=11, fontweight="bold", color=PALETTE["accent2"])
        ax.text(x + w / 2, y + h / 2 - 0.15, body, ha="center", va="center",
                fontsize=9, color=PALETTE["text"])

    arrows = [
        ((3.3, 5.2), (5.5, 4.5), "REST + JWT"),
        ((3.3, 3.0), (5.5, 4.0), "buildMlPayload()"),
        ((6.9, 3.2), (6.9, 1.9), "Prisma read"),
        ((8.7, 4.3), (9.5, 4.6), "HTTP JSON"),
        ((11.4, 3.8), (11.4, 3.2), "joblib.load"),
    ]
    for start, end, label in arrows:
        ax.annotate(
            "", xy=end, xytext=start,
            arrowprops=dict(arrowstyle="->", color=PALETTE["muted"], lw=1.5),
        )
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        ax.text(mx, my + 0.15, label, ha="center", fontsize=8, color=PALETTE["muted"])

    ax.text(7, 6.6, "Arquitectura ML — Tesis Dashboard v2.0",
            ha="center", fontsize=15, fontweight="bold", color=PALETTE["text"])
    fig.savefig(OUT / "01-arquitectura.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_pipeline() -> None:
    steps = [
        "Datos sintéticos\nn=2500, seed=42",
        "train_test_split\n80/20 stratify",
        "Entrenar RF\n150 árboles",
        "Entrenar XGBoost\n150 estimadores",
        "Stacking\nRF+HGB → meta-RF",
        "evaluate_model()\nF1 ponderado",
        "joblib.dump\nmetrics.json",
        "FastAPI /predict\nbuild_feature_vector",
    ]
    fig, ax = plt.subplots(figsize=(16, 4))
    ax.set_xlim(0, len(steps))
    ax.set_ylim(0, 2)
    ax.axis("off")
    fig.patch.set_facecolor(PALETTE["bg"])

    for i, step in enumerate(steps):
        color = PALETTE["accent"] if i % 2 == 0 else PALETTE["accent3"]
        rect = FancyBboxPatch(
            (i + 0.08, 0.5), 0.84, 1.0, boxstyle="round,pad=0.03",
            facecolor=PALETTE["card"], edgecolor=color, linewidth=1.5,
        )
        ax.add_patch(rect)
        ax.text(i + 0.5, 1.0, step, ha="center", va="center", fontsize=8.5, color=PALETTE["text"])
        if i < len(steps) - 1:
            ax.annotate("", xy=(i + 1.08, 1.0), xytext=(i + 0.92, 1.0),
                        arrowprops=dict(arrowstyle="->", color=PALETTE["muted"], lw=1.2))

    ax.text(len(steps) / 2, 1.85, "Pipeline de entrenamiento e inferencia (train.py + main.py)",
            ha="center", fontsize=13, fontweight="bold", color=PALETTE["text"])
    fig.savefig(OUT / "02-pipeline.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_stacking() -> None:
    fig, ax = plt.subplots(figsize=(11, 7))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8)
    ax.axis("off")
    fig.patch.set_facecolor(PALETTE["bg"])

    # Input
    rect = FancyBboxPatch((4.2, 6.5), 2.6, 0.9, boxstyle="round,pad=0.03",
                          facecolor=PALETTE["card"], edgecolor=PALETTE["text"], linewidth=1.5)
    ax.add_patch(rect)
    ax.text(5.5, 6.95, "X (10 features)", ha="center", fontsize=10, color=PALETTE["text"])

    estimators = [
        (1.0, 4.2, "Random Forest\nn_estimators=150\nmax_depth=12", PALETTE["accent2"]),
        (4.2, 4.2, "HistGradientBoosting\nmax_iter=150\nmax_depth=6", PALETTE["accent3"]),
    ]
    for x, y, label, color in estimators:
        rect = FancyBboxPatch((x, y), 2.6, 1.6, boxstyle="round,pad=0.03",
                              facecolor=PALETTE["card"], edgecolor=color, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + 1.3, y + 0.8, label, ha="center", va="center", fontsize=9, color=PALETTE["text"])
        ax.annotate("", xy=(x + 1.3, y + 1.6), xytext=(5.5, 6.5),
                    arrowprops=dict(arrowstyle="->", color=PALETTE["muted"], lw=1.2))

    # Meta-learner
    rect = FancyBboxPatch((3.5, 1.5), 4.0, 1.8, boxstyle="round,pad=0.04",
                          facecolor=PALETTE["card"], edgecolor=PALETTE["accent4"], linewidth=2.5)
    ax.add_patch(rect)
    ax.text(5.5, 2.7, "Meta-aprendiz: RandomForestClassifier", ha="center",
            fontsize=10, fontweight="bold", color=PALETTE["accent4"])
    ax.text(5.5, 2.1, "n_estimators=100, max_depth=6\ncv=3, passthrough=False",
            ha="center", fontsize=9, color=PALETTE["text"])

    for x in [2.3, 5.5]:
        ax.annotate("", xy=(5.5, 3.3), xytext=(x, 4.2),
                    arrowprops=dict(arrowstyle="->", color=PALETTE["muted"], lw=1.2))

    rect = FancyBboxPatch((4.0, 0.2), 3.0, 0.9, boxstyle="round,pad=0.03",
                          facecolor=PALETTE["card"], edgecolor=PALETTE["accent2"], linewidth=1.5)
    ax.add_patch(rect)
    ax.text(5.5, 0.65, "ŷ ∈ {bajo, medio, alto}", ha="center", fontsize=10, color=PALETTE["text"])
    ax.annotate("", xy=(5.5, 1.1), xytext=(5.5, 1.5),
                arrowprops=dict(arrowstyle="->", color=PALETTE["muted"], lw=1.5))

    ax.text(5.5, 7.6, "StackingClassifier — train.py L146-157",
            ha="center", fontsize=13, fontweight="bold", color=PALETTE["text"])
    ax.text(5.5, 0.0, "Nota: XGBoost se entrena en paralelo; stacking usa HGB por estabilidad sklearn 1.6+",
            ha="center", fontsize=8, color=PALETTE["muted"])
    fig.savefig(OUT / "03-stacking-metaaprendiz.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_distribucion_clases() -> None:
    X, y = generate_synthetic_data(2500)
    counts = np.bincount(y, minlength=3)
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(CLASS_LABELS, counts, color=CLASS_COLORS, edgecolor=PALETTE["grid"], linewidth=1.2)
    _style_ax(ax, "Distribución de clases — generate_synthetic_data() (n=2500)")
    ax.set_ylabel("Muestras", color=PALETTE["muted"])
    ax.set_xlabel("Nivel de riesgo", color=PALETTE["muted"])
    for bar, c in zip(bars, counts):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 30,
                str(c), ha="center", color=PALETTE["text"], fontweight="bold")
    ax.text(0.5, 0.92, "Etiquetas: estratificado 833/833/834 por perfil (train.py)",
            transform=ax.transAxes, fontsize=9, color=PALETTE["accent3"])
    fig.savefig(OUT / "04-distribucion-clases.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)
    return counts.tolist()


def diagram_metricas_comparacion(metrics: dict) -> None:
    model_keys = [k for k in ("random_forest", "xgboost", "stacking") if k in metrics]
    if not model_keys:
        return
    labels = ["Random Forest", "XGBoost", "Stacking"][: len(model_keys)]
    metric_keys = ["accuracy", "precision", "recall", "f1_score", "roc_auc_ovr_weighted"]
    metric_labels = ["Accuracy", "Precision", "Recall", "F1", "AUC-OvR"]

    x = np.arange(len(labels))
    width = 0.14
    fig, ax = plt.subplots(figsize=(12, 6))
    colors = [PALETTE["accent"], PALETTE["accent2"], PALETTE["accent3"], PALETTE["accent4"], "#a78bfa"]

    for i, (mk, ml) in enumerate(zip(metric_keys, metric_labels)):
        vals = [metrics.get(m, {}).get(mk, 0) for m in model_keys]
        ax.bar(x + (i - 2) * width, vals, width, label=ml, color=colors[i], edgecolor=PALETTE["grid"])

    _style_ax(ax, f"Comparación de métricas — mejor modelo: {metrics.get('best_model', 'N/A')}")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, color=PALETTE["text"])
    ax.set_ylim(0, 1.15)
    ax.legend(facecolor=PALETTE["card"], edgecolor=PALETTE["grid"], labelcolor=PALETTE["text"])
    ax.yaxis.grid(True, color=PALETTE["grid"], alpha=0.5)
    fig.savefig(OUT / "05-metricas-comparacion.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_confusion_matrix(metrics: dict, model_key: str | None = None) -> None:
    model_key = model_key or metrics.get("best_model", "random_forest")
    model_metrics = metrics.get(model_key)
    if not isinstance(model_metrics, dict) or "confusion_matrix" not in model_metrics:
        return
    cm = np.array(model_metrics["confusion_matrix"])
    fig, ax = plt.subplots(figsize=(7, 6))
    im = ax.imshow(cm, cmap="Blues", aspect="auto")
    _style_ax(ax, f"Matriz de confusión — {model_key} (test n={cm.sum()})")
    ax.set_xticks(range(3))
    ax.set_yticks(range(3))
    ax.set_xticklabels([f"Pred {c}" for c in CLASS_LABELS], color=PALETTE["text"])
    ax.set_yticklabels([f"Real {c}" for c in CLASS_LABELS], color=PALETTE["text"])
    ax.set_xlabel("Predicción", color=PALETTE["muted"])
    ax.set_ylabel("Real", color=PALETTE["muted"])
    for i in range(3):
        for j in range(3):
            color = "white" if cm[i, j] > cm.max() / 2 else PALETTE["text"]
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color=color, fontweight="bold")
    fig.colorbar(im, ax=ax, fraction=0.046)
    fig.savefig(OUT / "06-matriz-confusion.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_feature_importance() -> list[float] | None:
    import joblib

    path = MODELS / "random_forest_model.joblib"
    if not path.exists():
        return None
    rf = joblib.load(path)
    names_path = MODELS / "features.joblib"
    names = joblib.load(names_path) if names_path.exists() else [f"f{i}" for i in range(10)]
    imp = rf.feature_importances_

    order = np.argsort(imp)
    fig, ax = plt.subplots(figsize=(10, 6))
    colors = [PALETTE["accent2"] if v > 0 else PALETTE["muted"] for v in imp[order]]
    ax.barh([names[i] for i in order], imp[order], color=colors, edgecolor=PALETTE["grid"])
    _style_ax(ax, "Feature Importance — RandomForestClassifier (random_forest_model.joblib)")
    ax.set_xlabel("Importancia (Gini)", color=PALETTE["muted"])
    if imp.sum() == 0:
        ax.text(0.5, 0.5, "Sin importancias discriminativas",
                transform=ax.transAxes, ha="center", fontsize=10, color=PALETTE["accent3"])
    fig.savefig(OUT / "07-feature-importance.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)
    return imp.tolist()


def diagram_variables() -> None:
    features = [
        ("promedio_general", "0–20", "Nota promedio"),
        ("cursos_desaprobados", "0–12", "Cursos reprobados"),
        ("asistencia_general", "0–100%", "Asistencia"),
        ("frecuencia_acceso_lms", "0–100", "Accesos LMS"),
        ("tiempo_plataforma", "0–24 h", "Horas en LMS"),
        ("tareas_ratio", "0–1", "Tareas entregadas"),
        ("participacion_actividades", "0–100", "Participación"),
        ("uso_foros", "0–1", "Uso de foros"),
        ("disminucion_actividad", "0–100", "Caída actividad"),
        ("estado", "1/0.5/0", "activo/riesgo/retirado"),
    ]
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.axis("off")
    fig.patch.set_facecolor(PALETTE["bg"])
    ax.text(0.5, 0.97, "Vector de características — FEATURE_NAMES (features.py)",
            ha="center", transform=ax.transAxes, fontsize=14, fontweight="bold", color=PALETTE["text"])

    for i, (name, rng, desc) in enumerate(features):
        y = 0.88 - i * 0.085
        rect = FancyBboxPatch((0.05, y - 0.03), 0.9, 0.07, boxstyle="round,pad=0.01",
                              transform=ax.transAxes, facecolor=PALETTE["card"],
                              edgecolor=PALETTE["accent"], linewidth=1)
        ax.add_patch(rect)
        ax.text(0.08, y, f"{i+1}. {name}", transform=ax.transAxes, fontsize=10,
                fontweight="bold", color=PALETTE["accent2"], va="center")
        ax.text(0.42, y, rng, transform=ax.transAxes, fontsize=9, color=PALETTE["accent3"], va="center")
        ax.text(0.55, y, desc, transform=ax.transAxes, fontsize=9, color=PALETTE["text"], va="center")

    fig.savefig(OUT / "08-variables.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_roc_curves(metrics: dict, model_key: str | None = None) -> None:
    model_key = model_key or metrics.get("best_model", "random_forest")
    model_metrics = metrics.get(model_key, {})
    curves = model_metrics.get("roc_curves", {})
    if not curves:
        return

    fig, ax = plt.subplots(figsize=(8, 7))
    for class_name, color in zip(CLASS_LABELS, CLASS_COLORS):
        if class_name not in curves:
            continue
        fpr = curves[class_name]["fpr"]
        tpr = curves[class_name]["tpr"]
        auc_val = model_metrics.get("roc_auc_per_class", {}).get(class_name, 0)
        ax.plot(fpr, tpr, color=color, lw=2.2, label=f"{class_name} (AUC={auc_val:.3f})")

    ax.plot([0, 1], [0, 1], "--", color=PALETTE["muted"], lw=1, label="Azar")
    _style_ax(ax, f"Curvas ROC OvR — {model_key}")
    ax.set_xlabel("Tasa de falsos positivos (FPR)", color=PALETTE["muted"])
    ax.set_ylabel("Tasa de verdaderos positivos (TPR)", color=PALETTE["muted"])
    ax.legend(facecolor=PALETTE["card"], edgecolor=PALETTE["grid"], labelcolor=PALETTE["text"])
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.02)
    fig.savefig(OUT / "09-roc-curves.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def diagram_auc_per_class(metrics: dict, model_key: str | None = None) -> None:
    model_key = model_key or metrics.get("best_model", "random_forest")
    per_class = metrics.get(model_key, {}).get("roc_auc_per_class", {})
    if not per_class:
        return

    names = list(per_class.keys())
    vals = [per_class[n] for n in names]
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.bar(names, vals, color=CLASS_COLORS[: len(names)], edgecolor=PALETTE["grid"])
    _style_ax(ax, f"AUC por clase (OvR) — {model_key}")
    ax.set_ylim(0, 1.08)
    ax.set_ylabel("AUC", color=PALETTE["muted"])
    for i, v in enumerate(vals):
        ax.text(i, v + 0.02, f"{v:.3f}", ha="center", color=PALETTE["text"], fontweight="bold")
    macro = metrics.get(model_key, {}).get("roc_auc_ovr_macro")
    if macro is not None:
        ax.text(0.98, 0.95, f"Macro: {macro:.3f}", transform=ax.transAxes, ha="right",
                color=PALETTE["accent2"], fontsize=10)
    fig.savefig(OUT / "10-auc-por-clase.png", dpi=160, bbox_inches="tight", facecolor=PALETTE["bg"])
    plt.close(fig)


def build_analysis_report(metrics: dict, class_dist: list, importances: list | None) -> dict:
    return {
        "source": "python-ia/scripts/generate_diagrams.py",
        "metrics_from": str(MODELS / "metrics.json"),
        "class_distribution_train": dict(zip(CLASS_LABELS, class_dist)),
        "best_model": metrics.get("best_model"),
        "best_f1_score": metrics.get("best_f1_score"),
        "n_samples": metrics.get("n_samples"),
        "n_features": metrics.get("n_features"),
        "features": metrics.get("features"),
        "models": {
            k: v for k, v in metrics.items()
            if k in ("random_forest", "xgboost", "stacking")
        },
        "roc_auc": {
            "implemented_in_train_py": True,
            "computable_with_current_data": True,
            "best_model_ovr_weighted": metrics.get(metrics.get("best_model", ""), {}).get("roc_auc_ovr_weighted"),
            "best_model_ovr_macro": metrics.get(metrics.get("best_model", ""), {}).get("roc_auc_ovr_macro"),
        },
        "feature_importance_rf": dict(zip(metrics.get("features", []), importances or [])),
        "stacking_config": {
            "estimators": ["RandomForestClassifier", "HistGradientBoostingClassifier"],
            "final_estimator": "RandomForestClassifier(n_estimators=100, max_depth=6)",
            "cv": 3,
            "passthrough": False,
        },
    }


def main() -> None:
    try:
        metrics = load_metrics()
        print("Generando diagramas en", OUT)
        diagram_arquitectura()
        diagram_pipeline()
        diagram_stacking()
        class_dist = diagram_distribucion_clases()
        diagram_metricas_comparacion(metrics)
        diagram_confusion_matrix(metrics)
        importances = diagram_feature_importance()
        diagram_variables()
        diagram_roc_curves(metrics)
        diagram_auc_per_class(metrics)

        report = build_analysis_report(metrics, class_dist, importances)
        data_dir = Path(__file__).resolve().parents[1] / "datos"
        data_dir.mkdir(exist_ok=True)
        (data_dir / "analysis_report.json").write_text(
            json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        (data_dir / "metrics_snapshot.json").write_text(
            json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print("Completado:", len(list(OUT.glob("*.png"))), "diagramas")
    finally:
        plt.close("all")


if __name__ == "__main__":
    main()
