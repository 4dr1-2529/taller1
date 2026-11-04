"""Ejecución integral del pipeline con estimadores deterministas y salida temporal."""
import csv
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import train
from app.dataset import DatasetError, SYNTHETIC_MODE
from app.features import FEATURE_NAMES


class FakeClassifier:
    classes_ = np.array([0, 1])
    feature_importances_ = np.array([1, 2, 3, 4, 5, 6, 7], dtype=float)

    def __init__(self, **_kwargs):
        self.fit_rows = None

    def fit(self, X, y):
        self.fit_rows = len(y)
        return self

    def predict_proba(self, X):
        probability = 0.1 + 0.8 * X[:, 0]
        return np.column_stack((1 - probability, probability))


class FakeStacking(FakeClassifier):
    def __init__(self, estimators, final_estimator, cv, passthrough):
        super().__init__()
        self.estimators = estimators
        self.final_estimator = final_estimator
        self.cv = cv
        self.passthrough = passthrough


def make_dataset():
    values = np.zeros((12, len(FEATURE_NAMES)), dtype=float)
    values[:, 0] = np.tile([0.0, 1.0], 6)
    targets = np.tile([0, 1], 6)
    splits = np.array(["train"] * 4 + ["validation"] * 4 + ["holdout"] * 4, dtype=object)
    meta = {
        "splits": splits,
        "n_snapshots": 12,
        "n_students": 12,
        "dataset_version": "fixture-v6",
        "class_distribution": {"permanece_0": 6, "deserta_1": 6},
        "split_students": {"train": 4, "validation": 4, "holdout": 4},
        "split_distribution": {"train": 4, "validation": 4, "holdout": 4},
        "data_source": "test fixture",
        "data_mode": SYNTHETIC_MODE,
        "cutoffs": [],
        "outcome_date": None,
    }
    return values, targets, meta


def test_train_models_trains_selects_on_validation_and_writes_only_to_requested_directory(monkeypatch, tmp_path):
    X, y, meta = make_dataset()
    monkeypatch.setattr(train, "resolve_mode", lambda: SYNTHETIC_MODE)
    monkeypatch.setattr(train, "artifacts_dir", lambda mode: tmp_path)
    monkeypatch.setattr(train, "load_dataset", lambda: (X, y, meta))
    monkeypatch.setattr(train, "RandomForestClassifier", FakeClassifier)
    monkeypatch.setattr(train, "HistGradientBoostingClassifier", FakeClassifier)
    monkeypatch.setattr(train, "StackingClassifier", FakeStacking)
    monkeypatch.setattr(train, "HAS_XGBOOST", False)

    payload = train.train_models()

    assert payload["selection"] == "validation_f1_desercion"
    assert payload["holdout_used_for_selection"] is False
    assert payload["n_samples"] == len(y)
    assert payload["train_size"] == payload["validation_size"] == payload["test_size"] == 4
    assert payload["n_features"] == len(FEATURE_NAMES)
    assert payload["feature_importance_source"] == "FakeClassifier"
    assert payload["feature_importance"][FEATURE_NAMES[0]] == 1.0
    assert payload["level_distribution_validation_holdout"] == {"bajo": 4, "medio": 0, "alto": 4}
    assert payload["leakage_review_required"] is True
    assert payload["model_used"] == payload["best_model"]

    for filename in (
        "best_model.joblib", "random_forest_model.joblib", "hist_gradient_boosting_model.joblib",
        "stacking_model.joblib", "features.joblib", "holdout.joblib", "metrics.json",
        "metrics_comparison.csv", "training_history.json", "metadata.json",
    ):
        assert (tmp_path / filename).is_file(), filename

    metrics = json.loads((tmp_path / "metrics.json").read_text(encoding="utf-8"))
    history = json.loads((tmp_path / "training_history.json").read_text(encoding="utf-8"))
    metadata = json.loads((tmp_path / "metadata.json").read_text(encoding="utf-8"))
    assert metrics["data_mode"] == SYNTHETIC_MODE
    assert history["best_model"] == payload["best_model"]
    assert metadata["feature_names"] == FEATURE_NAMES
    assert metadata["experimental"] is True
    with (tmp_path / "metrics_comparison.csv").open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == 6
    assert {row["split"] for row in rows} == {"validation", "holdout"}


def test_train_models_rejects_missing_required_splits_before_fitting(monkeypatch, tmp_path):
    X, y, meta = make_dataset()
    meta["splits"] = np.array(["train"] * len(y), dtype=object)
    monkeypatch.setattr(train, "resolve_mode", lambda: SYNTHETIC_MODE)
    monkeypatch.setattr(train, "artifacts_dir", lambda _mode: tmp_path)
    monkeypatch.setattr(train, "load_dataset", lambda: (X, y, meta))
    with pytest.raises(DatasetError, match="splits train, validation y holdout"):
        train.train_models()
    assert list(tmp_path.iterdir()) == []


def test_artifacts_dir_separates_modes_and_rejects_unknown_without_touching_project(monkeypatch, tmp_path):
    monkeypatch.setattr(train, "ROOT", tmp_path)
    synthetic = train.artifacts_dir(SYNTHETIC_MODE)
    real = train.artifacts_dir("real")
    assert synthetic == tmp_path / "artifacts" / "synthetic"
    assert real == tmp_path / "artifacts" / "real"
    assert synthetic.is_dir() and real.is_dir()
    with pytest.raises(RuntimeError, match="ML_DATA_MODE inválido"):
        train.artifacts_dir("unexpected")


def test_training_cli_reports_dataset_error_and_exits_without_writing_artifacts():
    env = os.environ.copy()
    env["ML_DATA_MODE"] = "invalid-mode"
    result = subprocess.run(
        [sys.executable, str(Path(__file__).resolve().parents[1] / "train.py")],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    assert result.returncode == 1
    assert "DATASET_ERROR=ML_DATA_MODE inválido" in result.stdout


def test_train_models_falls_back_to_hist_gradient_when_xgboost_cannot_initialize(monkeypatch, tmp_path):
    X, y, meta = make_dataset()
    monkeypatch.setattr(train, "resolve_mode", lambda: SYNTHETIC_MODE)
    monkeypatch.setattr(train, "artifacts_dir", lambda _mode: tmp_path)
    monkeypatch.setattr(train, "load_dataset", lambda: (X, y, meta))
    monkeypatch.setattr(train, "RandomForestClassifier", FakeClassifier)
    monkeypatch.setattr(train, "HistGradientBoostingClassifier", FakeClassifier)
    monkeypatch.setattr(train, "StackingClassifier", FakeStacking)
    monkeypatch.setattr(train, "HAS_XGBOOST", True)

    def broken_xgboost(**_kwargs):
        raise RuntimeError("incompatible XGBoost")

    monkeypatch.setattr(train, "XGBClassifier", broken_xgboost)
    payload = train.train_models()
    assert "xgboost" not in payload["validation_results"]
    assert "hist_gradient_boosting" in payload["validation_results"]
    assert (tmp_path / "hist_gradient_boosting_model.joblib").is_file()

def test_training_entrypoint_reports_dataset_failure(monkeypatch, capsys):
    def fail():
        raise DatasetError("invalid fixture")
    monkeypatch.setattr(train, "train_models", fail)
    with pytest.raises(SystemExit) as error:
        train.main()
    assert error.value.code == 1
    assert "DATASET_ERROR=invalid fixture" in capsys.readouterr().out


def test_training_entrypoint_runs_training(monkeypatch):
    calls = []
    monkeypatch.setattr(train, "train_models", lambda: calls.append("trained"))
    train.main()
    assert calls == ["trained"]


class UninformativeClassifier(FakeClassifier):
    def predict_proba(self, X):
        return np.tile([0.5, 0.5], (len(X), 1))


def test_train_models_with_xgboost_and_imperfect_metrics_has_no_leakage_warning(monkeypatch, tmp_path, capsys):
    X, y, meta = make_dataset()
    monkeypatch.setattr(train, "resolve_mode", lambda: SYNTHETIC_MODE)
    monkeypatch.setattr(train, "artifacts_dir", lambda _mode: tmp_path)
    monkeypatch.setattr(train, "load_dataset", lambda: (X, y, meta))
    for name in ("RandomForestClassifier", "HistGradientBoostingClassifier", "XGBClassifier", "StackingClassifier"):
        monkeypatch.setattr(train, name, UninformativeClassifier)
    monkeypatch.setattr(train, "HAS_XGBOOST", True)
    payload = train.train_models()
    assert "xgboost" in payload["validation_results"]
    assert payload["leakage_review_required"] is False
    assert "LEAKAGE_REVIEW_REQUIRED=true" not in capsys.readouterr().out
    assert (tmp_path / "xgboost_model.joblib").is_file()

def test_training_script_entrypoint_rejects_invalid_mode(monkeypatch, capsys):
    import runpy
    monkeypatch.setenv("ML_DATA_MODE", "invalid-mode")
    with pytest.raises(SystemExit) as error:
        runpy.run_path(str(Path(train.__file__)), run_name="__main__")
    assert error.value.code == 1
    assert "DATASET_ERROR=ML_DATA_MODE" in capsys.readouterr().out
