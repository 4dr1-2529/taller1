"""Pruebas unitarias para app/thresholds.py"""
from app.thresholds import level_from_probability, score_from_probability, thresholds_payload, RISK_THRESHOLDS


def test_level_from_probability_bajo():
    assert level_from_probability(0.0) == "bajo"
    assert level_from_probability(0.40) == "bajo"
    assert level_from_probability(0.4099) == "bajo"


def test_level_from_probability_medio():
    assert level_from_probability(0.41) == "medio"
    assert level_from_probability(0.50) == "medio"
    assert level_from_probability(0.64) == "medio"
    assert level_from_probability(0.6499) == "medio"


def test_level_from_probability_alto():
    assert level_from_probability(0.65) == "alto"
    assert level_from_probability(0.80) == "alto"
    assert level_from_probability(1.0) == "alto"


def test_level_from_probability_rangos_invalidos():
    import pytest
    with pytest.raises(ValueError):
        level_from_probability(-0.01)
    with pytest.raises(ValueError):
        level_from_probability(1.5)
    with pytest.raises(ValueError):
        level_from_probability(float("nan"))


def test_score_from_probability():
    assert score_from_probability(0.0) == 0.0
    assert score_from_probability(0.5) == 50.0
    assert score_from_probability(1.0) == 100.0
    assert score_from_probability(0.852) == 85.2


def test_thresholds_payload():
    payload = thresholds_payload()
    assert payload["medio"] == 0.41
    assert payload["alto"] == 0.65
    assert "rule" in payload
    assert "note" in payload


def test_risk_thresholds_constantes():
    assert RISK_THRESHOLDS["medio"] == 0.41
    assert RISK_THRESHOLDS["alto"] == 0.65
