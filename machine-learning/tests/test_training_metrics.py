"""Pruebas unitarias de las métricas y helpers puros del entrenamiento V6."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from train import _feature_importance, _predict_positive, _round, evaluate_binary, tune_threshold


def test_round_handles_none_and_non_finite_values():
    assert _round(None) is None
    assert _round(float("nan")) is None
    assert _round(float("inf")) is None
    assert _round(0.123456, 3) == 0.123


def test_tune_threshold_selects_best_validation_f1():
    threshold, score = tune_threshold(np.array([0, 0, 1, 1]), np.array([0.1, 0.4, 0.6, 0.9]))
    assert threshold == 0.41
    assert score == 1.0


def test_evaluate_binary_reports_confusion_and_discrimination_metrics():
    metrics = evaluate_binary("fixture", np.array([0, 0, 1, 1]), np.array([0.1, 0.4, 0.6, 0.9]), 0.5)
    assert metrics["confusion_matrix"] == [[2, 0], [0, 2]]
    assert metrics["f1_score"] == 1.0
    assert metrics["roc_auc"] == 1.0
    assert metrics["n_samples"] == 4


def test_evaluate_binary_handles_empty_and_single_class_inputs():
    empty = evaluate_binary("empty", np.array([]), np.array([]), 0.5)
    assert empty["n_samples"] == 0
    assert empty["accuracy"] is None
    assert empty["confusion_matrix"] == [[0, 0], [0, 0]]

    single = evaluate_binary("single", np.array([0, 0]), np.array([0.1, 0.7]), 0.5)
    assert single["roc_auc"] is None
    assert single["balanced_accuracy"] is None
    assert single["specificity"] == 0.5


def test_predict_positive_uses_positive_class_index_or_last_column():
    class Model:
        classes_ = [1, 0]

        def predict_proba(self, _features):
            return np.array([[0.8, 0.2]])

    assert _predict_positive(Model(), np.zeros((1, 2))).tolist() == [0.8]

    class UnlabelledModel:
        def predict_proba(self, _features):
            return np.array([[0.2, 0.8]])

    assert _predict_positive(UnlabelledModel(), np.zeros((1, 2))).tolist() == [0.8]


def test_feature_importance_supports_direct_and_stacking_models():
    class Estimator:
        feature_importances_ = np.array([0.25, 0.75])

    direct, source = _feature_importance(Estimator(), ["a", "b"])
    assert direct == {"a": 0.25, "b": 0.75}
    assert source == "Estimator"

    class Stack:
        estimators_ = [("base", Estimator())]

    stacked, source = _feature_importance(Stack(), ["a", "b"])
    assert stacked == direct
    assert "base del stacking" in source

    assert _feature_importance(object(), ["a", "b"]) == ({}, "no disponible")

def test_feature_importance_rejects_misaligned_or_missing_estimator_features():
    from types import SimpleNamespace
    for model in (
        SimpleNamespace(feature_importances_=[1.0]),
        SimpleNamespace(estimators_=[object()]),
        SimpleNamespace(estimators_=[SimpleNamespace(feature_importances_=[1.0])]),
    ):
        assert _feature_importance(model, ["first", "second"]) == ({}, "no disponible")
