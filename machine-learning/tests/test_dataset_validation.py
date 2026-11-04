"""Casos límite del cargador CSV sin tocar artefactos ni datos del repositorio."""
import csv
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.dataset as dataset
from app.features import FEATURE_NAMES


def valid_row(**overrides):
    row = {name: "10" for name in FEATURE_NAMES}
    row.update({
        "cursos_desaprobados": "1",
        "actividades_realizadas": "3",
        "recursos_consultados": "4",
        "target_desercion": "0",
        "split": "train",
        "student_code": "S-1",
        "snapshot_id": "snap-1",
        "data_mode": dataset.SYNTHETIC_MODE,
        "dataset_version": dataset.SYNTHETIC_DATASET_VERSION,
        "cutoff_date": "2026-01-01",
        "outcome_date": "2026-12-01",
    })
    row.update(overrides)
    return row


def write_csv(path: Path, rows, *, fieldnames=None):
    if fieldnames is None:
        fieldnames = list(rows[0]) if rows else [*FEATURE_NAMES, dataset.TARGET, dataset.SPLIT_COLUMN]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    return path


def configure_real_dataset(monkeypatch, tmp_path, rows, *, fieldnames=None):
    path = write_csv(tmp_path / "fixture.csv", rows, fieldnames=fieldnames)
    report = tmp_path / "quality" / "report.json"
    monkeypatch.setenv("ML_DATA_MODE", dataset.REAL_MODE)
    monkeypatch.setenv("DATASET_PATH", str(path))
    monkeypatch.setenv("ML_DATA_QUALITY_REPORT", str(report))
    return path, report


def test_resolve_mode_normalizes_value_and_rejects_unknown(monkeypatch):
    monkeypatch.delenv("ML_DATA_MODE", raising=False)
    assert dataset.resolve_mode() == dataset.SYNTHETIC_MODE
    monkeypatch.setenv("ML_DATA_MODE", " REAL ")
    assert dataset.resolve_mode() == dataset.REAL_MODE
    monkeypatch.setenv("ML_DATA_MODE", "staging")
    with pytest.raises(dataset.DatasetError, match="ML_DATA_MODE inválido"):
        dataset.resolve_mode()


def test_resolve_dataset_path_never_falls_back_or_accepts_missing_file(monkeypatch):
    monkeypatch.delenv("DATASET_PATH", raising=False)
    with pytest.raises(dataset.DatasetError, match="DATASET_PATH"):
        dataset.resolve_dataset_path(dataset.REAL_MODE)
    monkeypatch.setenv("DATASET_PATH", "C:/missing/real.csv")
    with pytest.raises(dataset.DatasetError, match="no existe"):
        dataset.resolve_dataset_path(dataset.REAL_MODE)
    monkeypatch.setattr(dataset, "SYNTHETIC_V6_PATH", Path("C:/missing/synthetic.csv"))
    with pytest.raises(dataset.DatasetError, match="sintético V6 no encontrado"):
        dataset.resolve_dataset_path(dataset.SYNTHETIC_MODE)


def test_parse_number_and_check_row_reject_invalid_values():
    assert dataset._parse_number("NaN") is None
    assert dataset._parse_number("not-a-number") is None
    assert dataset._parse_number("2.5") == 2.5

    row = valid_row()
    row[FEATURE_NAMES[0]] = ""
    assert dataset._check_row(row) is None
    row = valid_row(asistencia_general="101")
    assert dataset._check_row(row) is None
    row = valid_row(cursos_desaprobados="1.5")
    assert dataset._check_row(row) is None
    row = valid_row(target_desercion="2")
    assert dataset._check_row(row) is None
    row = valid_row(target_desercion="bad")
    assert dataset._check_row(row) is None
    parsed = dataset._check_row(valid_row())
    assert parsed is not None and parsed[1] == 0 and len(parsed[0]) == len(FEATURE_NAMES)


def test_check_row_rejects_contract_validation_errors_and_blank_target(monkeypatch):
    monkeypatch.setattr(dataset, "validate_predict_payload", lambda _payload: (_ for _ in ()).throw(ValueError("invalid contract")))
    assert dataset._check_row(valid_row()) is None
    monkeypatch.undo()
    assert dataset._check_row(valid_row(target_desercion="  ")) is None


def test_load_dataset_rejects_empty_missing_columns_legacy_target_and_split(monkeypatch, tmp_path):
    empty, _ = configure_real_dataset(monkeypatch, tmp_path, [])
    with pytest.raises(dataset.DatasetError, match="vacío"):
        dataset.load_dataset()

    missing_target = tmp_path / "legacy.csv"
    legacy_fields = [*FEATURE_NAMES, dataset.LEGACY_TARGET, dataset.SPLIT_COLUMN]
    write_csv(missing_target, [{**valid_row(), dataset.LEGACY_TARGET: "0"}], fieldnames=legacy_fields)
    monkeypatch.setenv("DATASET_PATH", str(missing_target))
    with pytest.raises(dataset.DatasetError, match="target binario"):
        dataset.load_dataset()

    missing_feature = tmp_path / "missing.csv"
    fields = [name for name in FEATURE_NAMES if name != FEATURE_NAMES[0]] + [dataset.TARGET, dataset.SPLIT_COLUMN]
    write_csv(missing_feature, [{dataset.TARGET: "0", dataset.SPLIT_COLUMN: "train"}], fieldnames=fields)
    monkeypatch.setenv("DATASET_PATH", str(missing_feature))
    with pytest.raises(dataset.DatasetError, match="Columnas requeridas ausentes"):
        dataset.load_dataset()

    no_split = tmp_path / "no-split.csv"
    fields = [*FEATURE_NAMES, dataset.TARGET]
    write_csv(no_split, [{**valid_row(), dataset.TARGET: "0"}], fieldnames=fields)
    monkeypatch.setenv("DATASET_PATH", str(no_split))
    with pytest.raises(dataset.DatasetError, match="split.*ausente"):
        dataset.load_dataset()


def test_load_dataset_rejects_empty_clean_set_mixed_student_splits_and_single_class(monkeypatch, tmp_path):
    _, _ = configure_real_dataset(monkeypatch, tmp_path, [valid_row(asistencia_general="101")])
    with pytest.raises(dataset.DatasetError, match="no contiene filas válidas"):
        dataset.load_dataset()

    rows = [valid_row(), valid_row(snapshot_id="snap-2", split="validation", target_desercion="1")]
    rows[1]["student_code"] = rows[0]["student_code"]
    configure_real_dataset(monkeypatch, tmp_path, rows)
    with pytest.raises(dataset.DatasetError, match="aparece en los splits"):
        dataset.load_dataset()

    rows = [valid_row(), valid_row(student_code="S-2", snapshot_id="snap-2", split="validation")]
    configure_real_dataset(monkeypatch, tmp_path, rows)
    with pytest.raises(dataset.DatasetError, match="debe ser binario"):
        dataset.load_dataset()


def test_load_dataset_skips_duplicates_and_invalid_splits_and_writes_quality_report(monkeypatch, tmp_path):
    rows = [
        valid_row(),
        valid_row(snapshot_id="snap-1", student_code="S-duplicate", target_desercion="1"),
        valid_row(student_code="S-2", snapshot_id="snap-2", split="validation", target_desercion="1"),
        valid_row(student_code="S-3", snapshot_id="snap-3", split="unknown", target_desercion="1"),
    ]
    _, report_path = configure_real_dataset(monkeypatch, tmp_path, rows)
    X, y, meta = dataset.load_dataset()
    assert X.shape == (2, len(FEATURE_NAMES))
    assert np.array_equal(y, np.array([0, 1]))
    assert meta["duplicates_removed"] == 1
    assert meta["invalid_rows_skipped"] == 1
    assert meta["split_distribution"] == {"train": 1, "validation": 1, "holdout": 0}
    assert meta["split_students"] == {"train": 1, "validation": 1, "holdout": 0}
    assert meta["cutoffs"] == ["2026-01-01"]
    assert meta["outcome_date"] == "2026-12-01"
    assert "splits" not in report_path.read_text(encoding="utf-8")


def test_synthetic_mode_rejects_unexpected_data_mode_and_multiple_versions(monkeypatch, tmp_path):
    monkeypatch.setenv("ML_DATA_MODE", dataset.SYNTHETIC_MODE)
    monkeypatch.setenv("ML_DATA_QUALITY_REPORT", str(tmp_path / "quality.json"))
    data_path = tmp_path / "synthetic.csv"
    monkeypatch.setattr(dataset, "SYNTHETIC_V6_PATH", data_path)
    write_csv(data_path, [
        valid_row(data_mode="real"),
        valid_row(student_code="S-2", snapshot_id="snap-2", split="validation", target_desercion="1", data_mode="real"),
    ])
    with pytest.raises(dataset.DatasetError, match="data_mode inesperado"):
        dataset.load_dataset()

    write_csv(data_path, [
        valid_row(),
        valid_row(student_code="S-2", snapshot_id="snap-2", split="validation", target_desercion="1", dataset_version="another-version"),
    ])
    with pytest.raises(dataset.DatasetError, match="dataset_version múltiple"):
        dataset.load_dataset()


def test_quality_report_path_uses_configuration_or_mode_defaults(monkeypatch, tmp_path):
    configured = tmp_path / "custom-report.json"
    monkeypatch.setenv("ML_DATA_QUALITY_REPORT", str(configured))
    assert dataset._default_quality_report_path(dataset.SYNTHETIC_MODE) == configured
    monkeypatch.delenv("ML_DATA_QUALITY_REPORT")
    assert dataset._default_quality_report_path(dataset.SYNTHETIC_MODE).name == "data-quality.json"
    assert "artifacts" in dataset._default_quality_report_path(dataset.SYNTHETIC_MODE).parts
    real_path = dataset._default_quality_report_path(dataset.REAL_MODE)
    assert real_path.name == "data-quality.json" and "production" in real_path.parts

def test_dataset_without_snapshot_ids_keeps_distinct_students(monkeypatch, tmp_path):
    rows = [
        valid_row(snapshot_id="", student_code="S-1"),
        valid_row(snapshot_id="", student_code="S-2", split="validation", target_desercion="1"),
    ]
    configure_real_dataset(monkeypatch, tmp_path, rows)
    X, y, meta = dataset.load_dataset()
    assert X.shape == (2, len(FEATURE_NAMES))
    assert list(y) == [0, 1]
    assert meta["duplicates_removed"] == 0
    assert meta["n_students"] == 2
