"""Carga controlada de datos reales para entrenamiento científico."""
from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from app.features import FEATURE_NAMES

TARGET = "target"


def load_dataset() -> tuple[np.ndarray, np.ndarray, dict[str, object]]:
    path_value = os.environ.get("DATASET_PATH", "").strip()
    if not path_value:
        raise RuntimeError("Dataset real no disponible. El entrenamiento científico no puede ejecutarse.")
    path = Path(path_value)
    if not path.exists():
        raise RuntimeError("Dataset real no disponible. El entrenamiento científico no puede ejecutarse.")

    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    required = [*FEATURE_NAMES, TARGET]
    missing = [column for column in required if not rows or column not in rows[0]]
    if missing:
        raise ValueError(f"Columnas requeridas ausentes: {', '.join(missing)}")

    clean: list[tuple[list[float], str]] = []
    duplicates = 0
    seen: set[tuple[object, ...]] = set()
    for row in rows:
        try:
            values = tuple(float(row[name]) for name in FEATURE_NAMES)
            target = str(row[TARGET]).strip()
            if not target or any(not np.isfinite(value) for value in values):
                continue
        except (TypeError, ValueError):
            continue
        key = (*values, target)
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)
        clean.append((list(values), target))

    if not clean:
        raise ValueError("El dataset real no contiene filas válidas.")
    labels = sorted({target for _, target in clean})
    if set(labels) != {"alto", "bajo", "medio"}:
        raise ValueError("La columna target debe contener exactamente las clases bajo, medio y alto.")
    label_map = {label: index for index, label in enumerate(labels)}
    X = np.asarray([values for values, _ in clean], dtype=np.float64)
    y = np.asarray([label_map[target] for _, target in clean], dtype=np.int64)
    report = {
        "data_source": "real",
        "dataset_path": str(path),
        "dataset_size": int(len(clean)),
        "duplicates_removed": duplicates,
        "invalid_rows_skipped": len(rows) - len(clean) - duplicates,
        "features": FEATURE_NAMES,
        "target": TARGET,
        "classes": labels,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    report_path = Path(os.environ.get("ML_DATA_QUALITY_REPORT", "reports/production/data-quality.json"))
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return X, y, report