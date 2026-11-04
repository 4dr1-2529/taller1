"""Pruebas para app/main.py - predicción con modelo mockeado"""
from app.main import (
    current_data_mode,
    _with_thesis_fields,
    PredictInput,
    PredictOutput,
)
import app.main as main_mod
import pytest
from fastapi import HTTPException


class FakeModel:
    classes_ = [0, 1]

    def predict_proba(self, features):
        import numpy as np
        return np.array([[0.3, 0.7]])


def test_predict_con_modelo_mocado():
    main_mod.model = FakeModel()
    main_mod.model_meta = {
        "model_version": "v1",
        "dataset_version": "ds1",
        "data_mode": "synthetic_scientific",
        "contract_version": "2026-v3",
        "decision_threshold": 0.41,
    }
    main_mod.best_model_name = "test_model"

    data = PredictInput(
        promedio_general=15,
        cursos_desaprobados=1,
        asistencia_general=90,
        frecuencia_acceso_lms=3,
        tiempo_interaccion_lms=2,
        actividades_realizadas=4,
        recursos_consultados=5,
    )
    result = main_mod.predict(data)
    assert result.nivelRiesgo in ("bajo", "medio", "alto")
    assert 0 <= result.probabilidadDesercion <= 1
    assert result.modelo == "test_model"
    assert result.prediction_source == "ml_model"


def test_predict_sin_modelo_retorna_503():
    main_mod.model = None
    data = PredictInput(
        promedio_general=15,
        cursos_desaprobados=1,
        asistencia_general=90,
        frecuencia_acceso_lms=3,
        tiempo_interaccion_lms=2,
        actividades_realizadas=4,
        recursos_consultados=5,
    )
    from fastapi import HTTPException
    try:
        main_mod.predict(data)
        assert False, "Debería haber lanzado HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 503


def test_get_metrics_sin_metricas():
    main_mod.metrics = None
    result = main_mod.get_metrics()
    assert result is None


def test_get_metrics_con_metricas():
    main_mod.metrics = {"accuracy": 0.85, "f1": 0.8}
    result = main_mod.get_metrics()
    assert result == {"accuracy": 0.85, "f1": 0.8}


def test_health_con_modelo():
    main_mod.model = FakeModel()
    main_mod.model_meta = {
        "model_version": "v1",
        "dataset_version": "ds1",
        "data_mode": "synthetic_scientific",
        "contract_version": "2026-v3",
    }
    main_mod.best_model_name = "test_model"
    main_mod.feature_names = ["a", "b", "c", "d", "e", "f", "g"]

    result = main_mod.health()
    assert result["status"] == "healthy"
    assert result["model_loaded"] is True
    assert result["modelName"] == "test_model"
    assert result["dataMode"] == "synthetic_scientific"


def test_health_sin_modelo():
    main_mod.model = None
    main_mod.model_meta = {}
    main_mod.best_model_name = "unavailable"
    main_mod.feature_names = None

    result = main_mod.health()
    assert result["status"] == "no-model"
    assert result["model_loaded"] is False
    assert result["modelName"] == "unavailable"
    assert result["dataMode"] == "synthetic_scientific"


def valid_input():
    return PredictInput(
        promedio_general=15, cursos_desaprobados=1, asistencia_general=90,
        frecuencia_acceso_lms=3, tiempo_interaccion_lms=2,
        actividades_realizadas=4, recursos_consultados=5,
    )


def test_candidate_dirs_includes_only_existing_mode_directories(tmp_path, monkeypatch):
    synthetic = tmp_path / "synthetic"
    real = tmp_path / "real"
    legacy = tmp_path / "legacy"
    synthetic.mkdir()
    real.mkdir()
    monkeypatch.setattr(main_mod, "SYNTHETIC_DIR", synthetic)
    monkeypatch.setattr(main_mod, "REAL_DIR", real)
    monkeypatch.setattr(main_mod, "MODELS_DIR", legacy)
    assert main_mod._candidate_dirs("synthetic_scientific") == [synthetic]
    assert main_mod._candidate_dirs("real") == [real]
    legacy.mkdir()
    assert main_mod._candidate_dirs("real") == [real, legacy]


def test_predict_returns_422_for_contract_validation_error(monkeypatch):
    malformed = PredictInput.model_construct(
        promedio_general=-1, cursos_desaprobados=1, asistencia_general=90,
        frecuencia_acceso_lms=3, tiempo_interaccion_lms=2,
        actividades_realizadas=4, recursos_consultados=5,
    )
    with pytest.raises(HTTPException) as caught:
        main_mod.predict(malformed)
    assert caught.value.status_code == 422


def test_predict_uses_last_probability_column_when_model_has_no_positive_class(monkeypatch):
    class NoPositiveLabelModel:
        classes_ = [0, 2]

        def predict_proba(self, _features):
            import numpy as np
            return np.array([[0.3, 0.7]])

    monkeypatch.setattr(main_mod, "model", NoPositiveLabelModel())
    monkeypatch.setattr(main_mod, "model_meta", {"data_mode": "real", "decision_threshold": 0.5})
    monkeypatch.setattr(main_mod, "best_model_name", "fallback-model")
    result = main_mod.predict(valid_input())
    assert result.probabilidadDesercion == 0.7


def test_predict_preserves_http_errors_from_model_and_converts_internal_errors(monkeypatch):
    class HttpFailureModel:
        classes_ = [0, 1]

        def predict_proba(self, _features):
            raise HTTPException(status_code=418, detail="model unavailable")

    monkeypatch.setattr(main_mod, "model", HttpFailureModel())
    with pytest.raises(HTTPException) as caught:
        main_mod.predict(valid_input())
    assert caught.value.status_code == 418

    class BrokenModel:
        classes_ = [0, 1]

        def predict_proba(self, _features):
            raise RuntimeError("broken estimator")

    monkeypatch.setattr(main_mod, "model", BrokenModel())
    with pytest.raises(HTTPException) as caught:
        main_mod.predict(valid_input())
    assert caught.value.status_code == 503
    assert "No se genera riesgo ficticio" in caught.value.detail
