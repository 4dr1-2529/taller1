"""Pruebas unitarias para app/features.py"""
from app.features import (
    FEATURE_NAMES,
    build_feature_vector,
    probability_to_level,
    proba_to_score,
    build_factors,
    auto_recommendation,
)


def test_feature_names():
    assert FEATURE_NAMES == [
        "promedio_general",
        "cursos_desaprobados",
        "asistencia_general",
        "frecuencia_acceso_lms",
        "tiempo_interaccion_lms",
        "actividades_realizadas",
        "recursos_consultados",
    ]


def test_build_feature_vector():
    data = {
        "promedio_general": 15,
        "cursos_desaprobados": 1,
        "asistencia_general": 90,
        "frecuencia_acceso_lms": 3,
        "tiempo_interaccion_lms": 2,
        "actividades_realizadas": 4,
        "recursos_consultados": 5,
    }
    vector = build_feature_vector(data)
    assert vector.shape == (1, 7)
    assert vector[0, 0] == 15
    assert vector[0, 1] == 1
    assert vector[0, 2] == 90


def test_probability_to_level():
    assert probability_to_level(0.3) == "bajo"
    assert probability_to_level(0.5) == "medio"
    assert probability_to_level(0.8) == "alto"


def test_proba_to_score():
    assert proba_to_score(0.0) == 0.0
    assert proba_to_score(0.5) == 50.0
    assert proba_to_score(1.0) == 100.0


def test_build_factors_bajo_promedio():
    data = {
        "promedio_general": 10,
        "cursos_desaprobados": 0,
        "asistencia_general": 90,
        "frecuencia_acceso_lms": 5,
        "tiempo_interaccion_lms": 10,
        "actividades_realizadas": 5,
        "recursos_consultados": 5,
    }
    factors = build_factors(data)
    assert any(f["key"] == "bajo_promedio" for f in factors)


def test_build_factors_cursos_desaprobados():
    data = {
        "promedio_general": 15,
        "cursos_desaprobados": 3,
        "asistencia_general": 90,
        "frecuencia_acceso_lms": 5,
        "tiempo_interaccion_lms": 10,
        "actividades_realizadas": 5,
        "recursos_consultados": 5,
    }
    factors = build_factors(data)
    assert any(f["key"] == "cursos_desaprobados" for f in factors)


def test_build_factors_baja_asistencia():
    data = {
        "promedio_general": 15,
        "cursos_desaprobados": 0,
        "asistencia_general": 80,
        "frecuencia_acceso_lms": 5,
        "tiempo_interaccion_lms": 10,
        "actividades_realizadas": 5,
        "recursos_consultados": 5,
    }
    factors = build_factors(data)
    assert any(f["key"] == "baja_asistencia" for f in factors)


def test_build_factors_baja_actividad_lms():
    data = {
        "promedio_general": 15,
        "cursos_desaprobados": 0,
        "asistencia_general": 90,
        "frecuencia_acceso_lms": 0,
        "tiempo_interaccion_lms": 10,
        "actividades_realizadas": 5,
        "recursos_consultados": 5,
    }
    factors = build_factors(data)
    assert any(f["key"] == "baja_actividad_lms" for f in factors)


def test_build_factors_sin_factores():
    data = {
        "promedio_general": 18,
        "cursos_desaprobados": 0,
        "asistencia_general": 95,
        "frecuencia_acceso_lms": 5,
        "tiempo_interaccion_lms": 10,
        "actividades_realizadas": 10,
        "recursos_consultados": 10,
    }
    factors = build_factors(data)
    assert factors == []


def test_build_factors_limite_5():
    data = {
        "promedio_general": 10,
        "cursos_desaprobados": 5,
        "asistencia_general": 50,
        "frecuencia_acceso_lms": 0,
        "tiempo_interaccion_lms": 0,
        "actividades_realizadas": 0,
        "recursos_consultados": 0,
    }
    factors = build_factors(data)
    assert len(factors) <= 5


def test_auto_recommendation_alto():
    factors = [{"label": "baja asistencia", "contribution": 10}]
    rec = auto_recommendation("alto", factors)
    assert "Intervención urgente" in rec
    assert "baja asistencia" in rec


def test_auto_recommendation_medio():
    factors = [{"label": "bajo promedio", "contribution": 10}]
    rec = auto_recommendation("medio", factors)
    assert "Seguimiento preventivo" in rec


def test_auto_recommendation_bajo():
    factors = []
    rec = auto_recommendation("bajo", factors)
    assert "Riesgo bajo" in rec
