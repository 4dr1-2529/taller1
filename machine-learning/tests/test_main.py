"""Pruebas unitarias para app/main.py (funciones puras sin modelo cargado)"""
import os
from app.main import (
    current_data_mode,
    artifacts_dir,
    _with_thesis_fields,
    PredictInput,
    PredictOutput,
)


def test_current_data_mode_default(monkeypatch):
    monkeypatch.delenv("ML_DATA_MODE", raising=False)
    assert current_data_mode() == "synthetic_scientific"


def test_current_data_mode_real(monkeypatch):
    monkeypatch.setenv("ML_DATA_MODE", "real")
    assert current_data_mode() == "real"


def test_current_data_mode_invalido(monkeypatch):
    monkeypatch.setenv("ML_DATA_MODE", "invalido")
    assert current_data_mode() == "synthetic_scientific"


def test_artifacts_dir_synthetic():
    from pathlib import Path
    from app.main import SYNTHETIC_DIR
    dir_path = artifacts_dir("synthetic_scientific")
    assert dir_path == SYNTHETIC_DIR


def test_predict_input_valido():
    data = PredictInput(
        promedio_general=15,
        cursos_desaprobados=1,
        asistencia_general=90,
        frecuencia_acceso_lms=3,
        tiempo_interaccion_lms=2,
        actividades_realizadas=4,
        recursos_consultados=5,
    )
    assert data.promedio_general == 15
    assert data.cursos_desaprobados == 1


def test_predict_input_promedio_fuera_de_rango():
    from pydantic import ValidationError
    try:
        PredictInput(
            promedio_general=25,
            cursos_desaprobados=1,
            asistencia_general=90,
            frecuencia_acceso_lms=3,
            tiempo_interaccion_lms=2,
            actividades_realizadas=4,
            recursos_consultados=5,
        )
        assert False, "Debería haber lanzado ValidationError"
    except ValidationError:
        pass


def test_predict_output_campos():
    out = PredictOutput(
        probabilidadDesercion=0.3,
        nivelRiesgo="bajo",
        modelo="test",
        modelVersion="1.0",
        datasetVersion="v1",
        dataMode="synthetic_scientific",
        contractVersion="2026-v3",
        factors=[],
        score=30.0,
        level="bajo",
        probability=0.3,
        probability_abandono=0.3,
        recommendation="Riesgo bajo",
        model_name="test",
        predicted_at="2026-01-01T00:00:00Z",
        input_data={},
        prediction_source="ml_model",
    )
    assert out.nivelRiesgo == "bajo"
    assert out.score == 30.0


def test_with_thesis_fields():
    from app.main import PredictOutput
    out = PredictOutput(
        probabilidadDesercion=0.8,
        nivelRiesgo="alto",
        modelo="test",
        modelVersion="1.0",
        datasetVersion="v1",
        dataMode="synthetic_scientific",
        contractVersion="2026-v3",
        factors=[],
        score=80.0,
        level="alto",
        probability=0.8,
        probability_abandono=0.8,
        recommendation="Intervención urgente",
        model_name="test",
        predicted_at="2026-01-01T00:00:00Z",
        input_data={},
        prediction_source="ml_model",
    )
    result = _with_thesis_fields(out)
    assert result.probabilidad_desercion == 0.8
    assert result.probabilidad_abandono == 0.8
    assert result.score_predictivo == 80.0
    assert result.nivel_riesgo == "Alto"
    assert result.factores_riesgo == []
    assert result.recomendacion == "Intervención urgente"
    assert result.modelo_usado == "test"
    assert result.fecha_prediccion == "2026-01-01T00:00:00Z"
    assert result.fecha == "2026-01-01T00:00:00Z"
