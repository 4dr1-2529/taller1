"""Pruebas de selección y validación de artefactos al iniciar el servicio ML."""
import asyncio
import json
from pathlib import Path

import pytest

import app.main as main


class FakeModel:
    classes_ = [0, 1]
    n_features_in_ = len(main.FEATURE_NAMES)


def prepare_directory(tmp_path: Path, *, data_mode="synthetic_scientific", metrics=None):
    directory = tmp_path / "model-v6"
    directory.mkdir(parents=True)
    (directory / "metadata.json").write_text(
        json.dumps({"data_mode": data_mode, "model_selected": "metadata-model"}),
        encoding="utf-8",
    )
    if metrics is not None:
        (directory / "metrics.json").write_text(json.dumps(metrics), encoding="utf-8")
    return directory


def configure_load(monkeypatch, directory, feature_names=None, model=None):
    monkeypatch.setattr(main, "_candidate_dirs", lambda mode: [directory])
    values = iter([feature_names if feature_names is not None else main.FEATURE_NAMES, model or FakeModel()])
    monkeypatch.setattr(main.joblib, "load", lambda _path: next(values))


def test_load_artifacts_fails_when_no_candidate_directory_exists(monkeypatch):
    monkeypatch.setattr(main, "_candidate_dirs", lambda _mode: [])
    with pytest.raises(FileNotFoundError, match="sin artefactos"):
        main._load_artifacts()


def test_load_artifacts_reports_missing_metadata(tmp_path, monkeypatch):
    directory = tmp_path / "missing-meta"
    directory.mkdir()
    monkeypatch.setattr(main, "_candidate_dirs", lambda _mode: [directory])
    with pytest.raises(FileNotFoundError, match="metadata.json ausente"):
        main._load_artifacts()


def test_load_artifacts_rejects_mode_and_feature_mismatches(tmp_path, monkeypatch):
    directory = prepare_directory(tmp_path, data_mode="real")
    configure_load(monkeypatch, directory)
    with pytest.raises(FileNotFoundError, match="data_mode=real"):
        main._load_artifacts()

    directory = prepare_directory(tmp_path / "features", data_mode="synthetic_scientific")
    configure_load(monkeypatch, directory, feature_names=["incorrect_feature"])
    with pytest.raises(FileNotFoundError, match="vector de features incompatible"):
        main._load_artifacts()


def test_load_artifacts_rejects_non_binary_classes_and_wrong_feature_count(tmp_path, monkeypatch):
    directory = prepare_directory(tmp_path / "classes")

    class InvalidClasses:
        classes_ = [0, 2]
        n_features_in_ = len(main.FEATURE_NAMES)

    configure_load(monkeypatch, directory, model=InvalidClasses())
    with pytest.raises(FileNotFoundError, match=r"clases \[0, 2\] no binarias"):
        main._load_artifacts()

    directory = prepare_directory(tmp_path / "feature-count")

    class WrongFeatureCount:
        classes_ = [0, 1]
        n_features_in_ = 3

    configure_load(monkeypatch, directory, model=WrongFeatureCount())
    with pytest.raises(FileNotFoundError, match="n_features incompatible"):
        main._load_artifacts()


def test_load_artifacts_returns_model_metadata_metrics_and_name(tmp_path, monkeypatch):
    directory = prepare_directory(tmp_path, metrics={"best_model": "metrics-model", "f1": 0.8})
    configure_load(monkeypatch, directory)
    model, names, metadata, metrics, name = main._load_artifacts()
    assert isinstance(model, FakeModel)
    assert names == main.FEATURE_NAMES
    assert metadata["model_selected"] == "metadata-model"
    assert metrics == {"best_model": "metrics-model", "f1": 0.8}
    assert name == "metrics-model"


def test_load_artifacts_uses_metadata_name_and_empty_metrics_when_optional_files_absent(tmp_path, monkeypatch):
    directory = prepare_directory(tmp_path)
    configure_load(monkeypatch, directory)
    _, _, metadata, metrics, name = main._load_artifacts()
    assert metrics == {}
    assert name == "metadata-model"


def test_lifespan_loads_model_and_clears_runtime_state_on_shutdown(monkeypatch):
    metadata = {"model_version": "v6", "data_mode": "real"}
    monkeypatch.setattr(
        main,
        "_load_artifacts",
        lambda: (FakeModel(), main.FEATURE_NAMES, metadata, {"accuracy": 0.9}, "fixture-model"),
    )

    async def exercise():
        async with main.lifespan(main.app):
            assert isinstance(main.model, FakeModel)
            assert main.feature_names == main.FEATURE_NAMES
            assert main.metrics == {"accuracy": 0.9}
            assert main.model_meta is metadata
            assert main.best_model_name == "fixture-model"
        assert main.model is None
        assert main.feature_names is None
        assert main.metrics is None
        assert main.model_meta == {}

    asyncio.run(exercise())


def test_lifespan_keeps_service_available_when_artifacts_are_missing(monkeypatch):
    monkeypatch.setattr(main, "_load_artifacts", lambda: (_ for _ in ()).throw(FileNotFoundError("missing")))

    async def exercise():
        async with main.lifespan(main.app):
            assert main.model is None
        assert main.model is None
        assert main.model_meta == {}

    asyncio.run(exercise())
