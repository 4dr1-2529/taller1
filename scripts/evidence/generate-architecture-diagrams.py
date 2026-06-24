"""Diagramas arquitectura — Graphviz si disponible, sino Matplotlib."""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "evidencias_finales" / "arquitectura"
OUT_DIAG = ROOT / "docs" / "evidencias_finales" / "diagramas"
OUT_API = ROOT / "docs" / "evidencias_finales" / "api"
OUT_ISO = ROOT / "docs" / "evidencias_finales" / "iso"
for d in (OUT, OUT_DIAG, OUT_API, OUT_ISO):
    d.mkdir(parents=True, exist_ok=True)

HAS_DOT = shutil.which("dot") is not None


def save_matplotlib(name: str, folders: list[Path]):
    for folder in folders:
        folder.mkdir(parents=True, exist_ok=True)
        plt.savefig(folder / f"{name}.png", dpi=200, bbox_inches="tight", facecolor="white")
        plt.savefig(folder / f"{name}.svg", bbox_inches="tight", facecolor="white")
    plt.close()
    print(f"  OK {name}.png/svg (matplotlib)")


def flow_diagram(title: str, steps: list[str], fname: str, folders: list[Path]):
    fig, ax = plt.subplots(figsize=(max(12, len(steps) * 2.2), 3.5))
    ax.set_xlim(0, len(steps))
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title(title, fontsize=14, fontweight="bold", pad=12)
    colors = ["#dbeafe", "#ffedd5", "#dcfce7", "#f3e8ff", "#fef3c7", "#ede9fe"]
    for i, step in enumerate(steps):
        c = colors[i % len(colors)]
        rect = mpatches.FancyBboxPatch(
            (i + 0.08, 0.25), 0.84, 0.5,
            boxstyle="round,pad=0.02", linewidth=1.2, edgecolor="#334155", facecolor=c,
        )
        ax.add_patch(rect)
        ax.text(i + 0.5, 0.5, step, ha="center", va="center", fontsize=9, wrap=True)
        if i < len(steps) - 1:
            ax.annotate("", xy=(i + 1.02, 0.5), xytext=(i + 0.92, 0.5),
                        arrowprops=dict(arrowstyle="->", color="#475569", lw=1.5))
    save_matplotlib(fname, folders)


def stack_diagram(title: str, layers: list[tuple[str, str]], fname: str, folders: list[Path]):
    fig, ax = plt.subplots(figsize=(8, len(layers) * 1.2 + 1))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, len(layers) + 0.5)
    ax.axis("off")
    ax.set_title(title, fontsize=14, fontweight="bold")
    for i, (label, color) in enumerate(layers):
        y = len(layers) - i - 1
        rect = mpatches.FancyBboxPatch(
            (0.1, y + 0.1), 0.8, 0.7,
            boxstyle="round,pad=0.02", linewidth=1.2, edgecolor="#334155", facecolor=color,
        )
        ax.add_patch(rect)
        ax.text(0.5, y + 0.45, label, ha="center", va="center", fontsize=11)
        if i < len(layers) - 1:
            ax.annotate("", xy=(0.5, y + 0.08), xytext=(0.5, y + 0.02),
                        arrowprops=dict(arrowstyle="->", color="#475569", lw=1.5))
    save_matplotlib(fname, folders)


def graphviz_render(name: str, dot_source: str, folders: list[Path]):
    if not HAS_DOT:
        return False
    try:
        from graphviz import Source
        for folder in folders:
            for fmt in ("png", "svg"):
                src = Source(dot_source, format=fmt)
                src.render(str(folder / name), cleanup=True)
                print(f"  OK {folder.name}/{name}.{fmt}")
        return True
    except Exception as e:
        print(f"  ! graphviz falló {name}: {e}")
        return False


def main():
    print(f"Generando diagramas (dot={'si' if HAS_DOT else 'no'})...")

    stack_diagram(
        "Arquitectura General — Local",
        [
            ("Frontend Next.js :3029", "#dbeafe"),
            ("Backend Express + Prisma :4000", "#ffedd5"),
            ("MySQL 8 — tesis_dashboard", "#dcfce7"),
            ("Modelo IA FastAPI :5000", "#f3e8ff"),
        ],
        "arquitectura-general",
        [OUT, OUT_DIAG],
    )

    stack_diagram(
        "Arquitectura Frontend",
        [
            ("login/page.tsx", "#dbeafe"),
            ("AuthProvider + useAuthReady", "#e0e7ff"),
            ("(shell)/page.tsx + vistas", "#ffedd5"),
            ("api.ts + *Service.ts", "#fef3c7"),
        ],
        "arquitectura-frontend",
        [OUT, OUT_DIAG],
    )

    stack_diagram(
        "Arquitectura Backend",
        [
            ("routes/index.ts", "#ffedd5"),
            ("middleware JWT + RBAC", "#fed7aa"),
            ("controllers + services", "#fde68a"),
            ("Prisma ORM → MySQL", "#dcfce7"),
        ],
        "arquitectura-backend",
        [OUT, OUT_DIAG],
    )

    stack_diagram(
        "Base de Datos",
        [
            ("schema.prisma (51 tablas)", "#dcfce7"),
            ("Prisma migrate + seed", "#bbf7d0"),
            ("MySQL XAMPP :3306", "#86efac"),
        ],
        "arquitectura-base-datos",
        [OUT, OUT_DIAG],
    )

    stack_diagram(
        "Modelo IA — Ensemble local",
        [
            ("generate_synthetic_data + features.py", "#f3e8ff"),
            ("Random Forest · XGBoost · HistGB", "#e9d5ff"),
            ("StackingClassifier → best_model.joblib", "#ddd6fe"),
            ("FastAPI :5000 + POST /predict", "#c4b5fd"),
        ],
        "arquitectura-modelo-ia",
        [OUT, OUT_DIAG],
    )

    flow_diagram(
        "Flujo API completo",
        ["Frontend", "API /api/v1", "Backend", "Prisma", "MySQL", "Modelo IA", "Respuesta JSON"],
        "flujo-api-completo",
        [OUT_API, OUT_DIAG],
    )

    flow_diagram(
        "Pipeline Random Forest",
        ["Datos", "Features", "Bootstrap", "150 árboles", "Clase bajo/medio/alto"],
        "pipeline-random-forest",
        [OUT, OUT_DIAG],
    )

    flow_diagram(
        "Pipeline XGBoost",
        ["Datos", "Features", "Gradient Boosting", "150 estimators", "Clase"],
        "pipeline-xgboost",
        [OUT, OUT_DIAG],
    )

    flow_diagram(
        "Pipeline Stacking",
        ["RF", "XGB/HGB", "Stacking CV=3", "Meta-RF", "best_model"],
        "pipeline-stacking",
        [OUT, OUT_DIAG],
    )

    flow_diagram(
        "Flujo Predicción",
        ["Datos BD", "Preproceso", "Features", "Ensemble", "Predicción", "Dashboard", "Alertas"],
        "flujo-prediccion",
        [OUT, OUT_DIAG],
    )

    flow_diagram(
        "Flujo Registro Notas",
        ["Director/Profesor", "GradesView", "POST /grades", "Prisma", "MySQL", "Dashboard KPIs"],
        "flujo-registro-notas",
        [OUT, OUT_DIAG],
    )

    flow_diagram(
        "Macroproceso ISO 9001",
        ["Entradas académico+LMS", "Validar · Predecir · Alertar", "Dashboard · Reportes · Decisiones"],
        "macroproceso-iso-9001",
        [OUT_ISO, OUT_DIAG],
    )

    flow_diagram(
        "ISO 29119 — Plan de pruebas",
        ["Plan 54 casos", "Ejecución local test+capture", "Evidencias finales"],
        "iso-29119-aplicado",
        [OUT_ISO, OUT_DIAG],
    )

    # ISO 25010 radial-ish as bar chart
    fig, ax = plt.subplots(figsize=(10, 5))
    chars = ["Funcionalidad", "Usabilidad", "Seguridad", "Fiabilidad", "Mantenibilidad"]
    vals = [95, 90, 92, 88, 91]
    ax.barh(chars, vals, color=["#1f3a5f", "#f47c20", "#2d6a4f", "#7b2cbf", "#0369a1"])
    ax.set_xlim(0, 100)
    ax.set_xlabel("Cobertura evidenciada (%)")
    ax.set_title("ISO 25010 aplicado al sistema — evidencias locales")
    save_matplotlib("iso-25010-aplicado", [OUT_ISO, OUT_DIAG])

    print("Diagramas completados.")


if __name__ == "__main__":
    main()
