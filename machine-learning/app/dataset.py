"""Carga controlada del dataset V6 (científico-sintético) o institucional real.

Reglas:
- `ML_DATA_MODE=synthetic_scientific` usa el CSV V6 versionado en el repo.
- `ML_DATA_MODE=real` exige `DATASET_PATH` institucional; NO existe fallback
  automático hacia datos sintéticos.
- El split (train/validation/holdout) se toma del CSV: nunca se remezcla.
- Solo las siete features del contrato 2026 y el target binario `target_desercion`.
"""
from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from app.features import FEATURE_NAMES
from utils.validators import validate_predict_payload

TARGET = "target_desercion"
LEGACY_TARGET = "target"
SPLIT_COLUMN = "split"
SPLIT_VALUES = ("train", "validation", "holdout")
DATA_MODE_COLUMN = "data_mode"
DATASET_VERSION_COLUMN = "dataset_version"
SYNTHETIC_MODE = "synthetic_scientific"
REAL_MODE = "real"
SYNTHETIC_DATASET_VERSION = "BLENKIR_V6_SYNTH_20260924"
SYNTHETIC_V6_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "synthetic-scientific-v6"
    / "BLENKIR_ML_DATASET_V6_SYNTHETIC.csv"
)
SYNTHETIC_DATASET_VERSION = "BLENKIR_V6_SYNTH_20260924"

# Límites de saneamiento por variable (mismos del contrato de inferencia).
RANGES: dict[str, tuple[float, float]] = {
    "promedio_general": (0.0, 20.0),
    "cursos_desaprobados": (0.0, 50.0),
    "asistencia_general": (0.0, 100.0),
    "frecuencia_acceso_lms": (0.0, 100.0),
    "tiempo_interaccion_lms": (0.0, 10000.0),
    "actividades_realizadas": (0.0, 1000.0),
    "recursos_consultados": (0.0, 10000.0),
}
INTEGER_FEATURES = ("cursos_desaprobados", "actividades_realizadas", "recursos_consultados")


class DatasetError(ValueError):
    """Dataset inválido: el entrenamiento se detiene sin inventar datos."""


def resolve_mode() -> str:
    # Por defecto se sirve el dataset experimental V6 versionado en el repo.
    # `ML_DATA_MODE=real` exige DATASET_PATH institucional (sin fallback sintético).
    mode = os.environ.get("ML_DATA_MODE", SYNTHETIC_MODE).strip().lower()
    if mode not in (SYNTHETIC_MODE, REAL_MODE):
        raise DatasetError(
            f"ML_DATA_MODE inválido: {mode}. Use 'synthetic_scientific' o 'real'."
        )
    return mode


def resolve_dataset_path(mode: str) -> Path:
    if mode == SYNTHETIC_MODE:
        path = SYNTHETIC_V6_PATH
        if not path.exists():
            raise DatasetError(f"Dataset sintético V6 no encontrado: {path}")
        return path
    path_value = os.environ.get("DATASET_PATH", "").strip()
    if not path_value:
        raise DatasetError(
            "Dataset real no disponible: defina DATASET_PATH. "
            "No se usa ningún dataset sintético como sustituto en modo real."
        )
    path = Path(path_value)
    if not path.exists():
        raise DatasetError(
            f"DATASET_PATH no existe: {path}. No se usa ningún dataset sintético "
            "como sustituto en modo real."
        )
    return path


def _parse_number(raw: str) -> float | None:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(value):
        return None
    return value


def _check_row(row: dict[str, str]) -> tuple[list[float], int] | None:
    values: list[float] = []
    for name in FEATURE_NAMES:
        value = _parse_number(row.get(name, ""))
        if value is None:
            return None
        low, high = RANGES[name]
        if value < low or value > high:
            return None
        if name in INTEGER_FEATURES and int(value) != value:
            return None
        values.append(float(value))
    try:
        validate_predict_payload(dict(zip(FEATURE_NAMES, values)))
    except Exception:
        return None
    target_raw = str(row.get(TARGET, "")).strip()
    if target_raw == "":
        return None
    try:
        target_value = float(target_raw)
    except ValueError:
        return None
    if target_value not in (0.0, 1.0):
        return None
    return values, int(target_value)


def _default_quality_report_path(mode: str) -> Path:
    configured = os.environ.get("ML_DATA_QUALITY_REPORT", "").strip()
    if configured:
        return Path(configured)
    root = Path(__file__).resolve().parent.parent
    if mode == SYNTHETIC_MODE:
        return root / "artifacts" / "synthetic" / "data-quality.json"
    return root / "reports" / "production" / "data-quality.json"


def load_dataset() -> tuple[np.ndarray, np.ndarray, dict[str, object]]:
    """Carga y valida el dataset; devuelve X, y y metadatos (incluye `splits`)."""
    mode = resolve_mode()
    path = resolve_dataset_path(mode)

    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise DatasetError("El dataset está vacío.")

    header = set(rows[0].keys())
    missing = [column for column in [*FEATURE_NAMES, TARGET] if column not in header]
    if missing:
        if TARGET in missing and LEGACY_TARGET in header:
            missing = [c for c in missing if c != TARGET]
            raise DatasetError(
                "Se encontró la columna legada 'target'. Se exige el target binario "
                f"'{TARGET}' (0=permanece, 1=deserta)."
            )
        raise DatasetError(f"Columnas requeridas ausentes: {', '.join(missing)}")
    if SPLIT_COLUMN not in header:
        raise DatasetError(
            "Columna 'split' ausente: el entrenamiento usa el split provisto por el "
            "dataset (train/validation/holdout); no se genera un split aleatorio."
        )

    clean: list[tuple[str, list[float], int, str]] = []
    duplicates = 0
    skipped = 0
    seen_snapshots: set[str] = set()
    for row in rows:
        parsed = _parse_row(row)
        if parsed is None:
            skipped += 1
            continue
        snapshot_id = str(row.get("snapshot_id", "")).strip()
        if snapshot_id:
            if snapshot_id in seen_snapshots:
                duplicates += 1
                continue
            seen_snapshots.add(snapshot_id)
        student_code = str(row.get("student_code", "")).strip() or snapshot_id or str(len(clean))
        split = str(row.get(SPLIT_COLUMN, "")).strip().lower()
        if split not in SPLIT_VALUES:
            skipped += 1
            continue
        values, target = parsed
        clean.append((student_code, values, target, split))

    if not clean:
        raise DatasetError("El dataset no contiene filas válidas tras la validación.")

    student_split: dict[str, str] = {}
    for student_code, _, _, split in clean:
        previous = student_split.setdefault(student_code, split)
        if previous != split:
            raise DatasetError(
                f"El estudiante {student_code} aparece en los splits '{previous}' y "
                "'{split}': los dos snapshots de un alumno deben estar en el mismo split."
            )

    targets = {target for _, _, target, _ in clean}
    if targets != {0, 1}:
        raise DatasetError(
            f"'{TARGET}' debe ser binario 0/1; se observaron los valores {sorted(targets)}."
        )

    data_modes = {str(row.get(DATA_MODE_COLUMN, "")).strip() for row in rows} - {""}
    versions = {str(row.get(DATASET_VERSION_COLUMN, "")).strip() for row in rows} - {""}
    if mode == SYNTHETIC_MODE:
        if data_modes and data_modes != {SYNTHETIC_MODE}:
            raise DatasetError(f"data_mode inesperado: {sorted(data_modes)}")
        if len(versions) > 1:
            raise DatasetError(f"dataset_version múltiple: {sorted(versions)}")

    X = np.asarray([values for _, values, _, _ in clean], dtype=np.float64)
    y = np.asarray([target for _, _, target, _ in clean], dtype=np.int64)
    splits = np.asarray([split for _, _, _, split in clean], dtype=object)

    split_distribution = {name: int(np.sum(splits == name)) for name in SPLIT_VALUES}
    students_by_split = {
        name: len({s for s, _, _, sp in clean if sp == name}) for name in SPLIT_VALUES
    }
    data_mode_value = (
        next(iter(data_modes)) if len(data_modes) == 1 else mode
    )
    dataset_version = next(iter(versions)) if len(versions) == 1 else (
        SYNTHETIC_DATASET_VERSION if mode == SYNTHETIC_MODE else "unknown"
    )
    cutoffs = sorted({str(r.get("cutoff_date", "")).strip() for r in rows} - {""})
    outcome_dates = sorted({str(r.get("outcome_date", "")).strip() for r in rows} - {""})

    report: dict[str, object] = {
        "data_source": str(path),
        "data_mode": data_mode_value or mode,
        "dataset_version": dataset_version,
        "n_students": len({student_code for student_code, _, _, _ in clean}),
        "n_snapshots": int(len(clean)),
        "features": list(FEATURE_NAMES),
        "target": TARGET,
        "class_distribution": {
            "permanece_0": int(np.sum(y == 0)),
            "deserta_1": int(np.sum(y == 1)),
        },
        "split_distribution": split_distribution,
        "split_students": students_by_split,
        "duplicates_removed": duplicates,
        "invalid_rows_skipped": skipped,
        "cutoffs": cutoffs,
        "outcome_date": outcome_dates[0] if len(outcome_dates) == 1 else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "splits": splits,
    }

    quality_path = _default_quality_report_path(mode)
    quality_path.parent.mkdir(parents=True, exist_ok=True)
    serializable = {k: v for k, v in report.items() if k != "splits"}
    quality_path.write_text(
        json.dumps(serializable, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return X, y, report


def _parse_row(row: dict[str, str]) -> tuple[list[float], int] | None:
    return _check_row(row)
