"""Genera diagrama ER desde schema.prisma (matplotlib — sin Graphviz requerido)."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = ROOT / "backend" / "prisma" / "schema.prisma"
OUT = ROOT / "docs" / "evidencias_finales" / "base_datos"
OUT_LEGACY = ROOT / "docs" / "evidencias" / "backend"
for d in (OUT, OUT_LEGACY):
    d.mkdir(parents=True, exist_ok=True)

CORE = [
    "Student", "Teacher", "Usuario", "Seccion", "Grado", "Matricula",
    "Course", "Enrollment", "Grade", "PeriodoAcademico", "AnioLectivo",
    "Prediction", "Alert", "TeacherAssignment", "TutorSeccion",
]

RELATIONS = [
    ("Student", "Seccion", "N:1"),
    ("Student", "Matricula", "1:N"),
    ("Student", "Enrollment", "1:N"),
    ("Student", "Grade", "1:N"),
    ("Student", "Prediction", "1:N"),
    ("Student", "Alert", "1:N"),
    ("Teacher", "TeacherAssignment", "1:N"),
    ("Teacher", "TutorSeccion", "1:N"),
    ("Course", "Enrollment", "1:N"),
    ("Course", "Grade", "1:N"),
    ("Seccion", "Grado", "N:1"),
    ("Seccion", "AnioLectivo", "N:1"),
    ("Grade", "PeriodoAcademico", "N:1"),
    ("Usuario", "Student", "1:1"),
    ("Usuario", "Teacher", "1:1"),
]


def try_graphviz():
    if not shutil.which("dot"):
        return False
    try:
        from graphviz import Digraph
        dot = Digraph("ER", format="png")
        dot.attr(rankdir="LR", bgcolor="white")
        for n in CORE:
            dot.node(n, n, shape="box", style="rounded,filled", fillcolor="#eef2ff")
        for a, b, label in RELATIONS:
            if a in CORE and b in CORE:
                dot.edge(a, b, label=label)
        base = OUT / "diagrama-er-blenkir"
        dot.render(str(base), cleanup=True)
        g = Digraph("ER", format="svg")
        g.source = dot.source
        g.render(str(base), cleanup=True)
        shutil.copy2(f"{base}.png", OUT_LEGACY / "diagrama-er-blenkir.png")
        print("  OK diagrama-er-blenkir.png/svg (graphviz)")
        return True
    except Exception as e:
        print(f"  ! graphviz: {e}")
        return False


def matplotlib_er():
    pos = {
        "Student": (2, 4), "Usuario": (0.5, 4), "Teacher": (2, 2),
        "Seccion": (4, 4), "Grado": (5.5, 4), "AnioLectivo": (5.5, 2.5),
        "Matricula": (4, 2.5), "Course": (4, 1), "Enrollment": (2.5, 1),
        "Grade": (1, 1), "PeriodoAcademico": (0, 1), "Prediction": (0, 2.5),
        "Alert": (0, 3.5), "TeacherAssignment": (3.5, 2), "TutorSeccion": (1.5, 2),
    }
    fig, ax = plt.subplots(figsize=(14, 9))
    ax.set_xlim(-0.5, 6.5)
    ax.set_ylim(0.5, 5)
    ax.axis("off")
    ax.set_title("Diagrama ER — I.E.P. Blenkir v3 (core académico + IA)\nGenerado desde schema.prisma local", fontsize=13, fontweight="bold")

    for name, (x, y) in pos.items():
        box = mpatches.FancyBboxPatch(
            (x - 0.55, y - 0.22), 1.1, 0.44,
            boxstyle="round,pad=0.02", linewidth=1.2, edgecolor="#1f3a5f", facecolor="#eef2ff",
        )
        ax.add_patch(box)
        ax.text(x, y, name, ha="center", va="center", fontsize=8, fontweight="bold")

    for a, b, label in RELATIONS:
        if a in pos and b in pos:
            x1, y1 = pos[a]
            x2, y2 = pos[b]
            ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                        arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.2))
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx, my + 0.08, label, fontsize=7, color="#475569", ha="center")

    text = SCHEMA.read_text(encoding="utf-8")
    total_models = len(re.findall(r"^model\s+\w+", text, re.M))
    ax.text(0.02, 0.02, f"Modelos en schema: {total_models} · Core mostrado: {len(CORE)}",
            transform=ax.transAxes, fontsize=9, color="#64748b")

    for folder in (OUT, OUT_LEGACY):
        plt.savefig(folder / "diagrama-er-blenkir.png", dpi=200, bbox_inches="tight", facecolor="white")
        plt.savefig(folder / "diagrama-er-blenkir.svg", bbox_inches="tight", facecolor="white")
    plt.close()
    print("  OK diagrama-er-blenkir.png/svg (matplotlib)")

    (OUT / "README-ER.md").write_text(
        f"# ER generado localmente\n\n- Fuente: backend/prisma/schema.prisma\n"
        f"- Total modelos: {total_models}\n- Core: {len(CORE)} entidades\n",
        encoding="utf-8",
    )


def main():
    if not try_graphviz():
        matplotlib_er()


if __name__ == "__main__":
    main()
