"""Pruebas de contrato del pipeline V6 (binario, 7 features, split del CSV).

No afirman desempeño de modelos ni generan datos: solo validan contrato,
carga del dataset V6, umbrales de riesgo y respuesta del servicio FastAPI.
"""
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np
from fastapi import HTTPException
from pydantic import ValidationError as PydanticValidationError

from app.dataset import (
    SYNTHETIC_DATASET_VERSION,
    SYNTHETIC_MODE,
    DatasetError,
    load_dataset,
    resolve_dataset_path,
    resolve_mode,
)
from app.features import FEATURE_NAMES, build_feature_vector, probability_to_level
from app.main import PredictInput, predict
from app.thresholds import RISK_THRESHOLDS, level_from_probability
from utils.validators import ValidationError, validate_predict_payload

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = dict(promedio_general=14, cursos_desaprobados=1, asistencia_general=90,
               frecuencia_acceso_lms=3, tiempo_interaccion_lms=2,
               actividades_realizadas=4, recursos_consultados=5)

PROHIBITED = {
    "student_code", "snapshot_id", "cutoff_date", "outcome_date", "grado",
    "seccion_codigo", "split", "target", "target_label", "data_mode",
    "dataset_version", "prob_generador", "score_generador",
}


class TestFeatureContract(unittest.TestCase):
    def test_contract_order(self):
        self.assertEqual(build_feature_vector(PAYLOAD).tolist(), [[14, 1, 90, 3, 2, 4, 5]])

    def test_exactly_seven_features(self):
        self.assertEqual(len(FEATURE_NAMES), 7)

    def test_no_metadata_or_generator_columns_as_features(self):
        self.assertFalse(PROHIBITED & set(FEATURE_NAMES))

    def test_missing_data_is_not_imputed(self):
        for feature in FEATURE_NAMES:
            data = dict(PAYLOAD)
            del data[feature]
            with self.assertRaises(ValidationError):
                validate_predict_payload(data)

    def test_obsolete_fields_rejected(self):
        with self.assertRaises(PydanticValidationError):
            PredictInput(**PAYLOAD, uso_foros=0.5)

    def test_invalid_values(self):
        for feature, value in [('promedio_general', 21), ('asistencia_general', 101),
                               ('tiempo_interaccion_lms', -1), ('recursos_consultados', 1.5),
                               ('frecuencia_acceso_lms', float('nan'))]:
            with self.assertRaises(ValidationError):
                validate_predict_payload({**PAYLOAD, feature: value})


class TestRiskThresholds(unittest.TestCase):
    def test_levels_derive_from_probability(self):
        self.assertEqual(level_from_probability(0.4099), "bajo")
        self.assertEqual(level_from_probability(0.41), "medio")
        self.assertEqual(level_from_probability(0.6499), "medio")
        self.assertEqual(level_from_probability(0.65), "alto")
        self.assertEqual(level_from_probability(0.99), "alto")

    def test_operational_thresholds_are_centralized(self):
        self.assertEqual(RISK_THRESHOLDS, {"medio": 0.41, "alto": 0.65})

    def test_probability_out_of_range_is_rejected(self):
        for value in (-0.01, 1.5, float("nan")):
            with self.assertRaises(ValueError):
                level_from_probability(value)


class TestSyntheticDatasetV6(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["ML_DATA_MODE"] = SYNTHETIC_MODE
        cls.X, cls.y, cls.meta = load_dataset()

    @classmethod
    def tearDownClass(cls):
        os.environ.pop("ML_DATA_MODE", None)

    def test_mode_resolves_to_synthetic(self):
        self.assertEqual(resolve_mode(), SYNTHETIC_MODE)

    def test_rows_and_students(self):
        self.assertEqual(int(self.meta["n_snapshots"]), 450)
        self.assertEqual(int(self.meta["n_students"]), 225)

    def test_target_is_binary(self):
        self.assertEqual(set(int(v) for v in np.unique(self.y)), {0, 1})
        self.assertEqual(
            sum(self.meta["class_distribution"].values()), 450,
        )

    def test_features_shape_and_order(self):
        self.assertEqual(self.X.shape, (450, 7))
        self.assertEqual(self.meta["features"], FEATURE_NAMES)

    def test_split_distribution(self):
        self.assertEqual(self.meta["split_distribution"],
                         {"train": 316, "validation": 68, "holdout": 66})
        self.assertEqual(self.meta["split_students"],
                         {"train": 158, "validation": 34, "holdout": 33})

    def test_student_not_repeated_across_splits(self):
        import csv as _csv
        students: dict[str, set[str]] = {}
        path = resolve_dataset_path(SYNTHETIC_MODE)
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for row in _csv.DictReader(handle):
                students.setdefault(row["student_code"], set()).add(row["split"])
        repeated = {s: splits for s, splits in students.items() if len(splits) > 1}
        self.assertEqual(repeated, {})
        self.assertEqual(len(students), 225)

    def test_metadata_contract(self):
        for key in ("data_source", "data_mode", "dataset_version", "n_students",
                    "n_snapshots", "features", "target", "class_distribution",
                    "split_distribution", "timestamp"):
            self.assertIn(key, self.meta)
        self.assertEqual(self.meta["data_mode"], "synthetic_scientific")
        self.assertEqual(self.meta["dataset_version"], SYNTHETIC_DATASET_VERSION)
        self.assertEqual(self.meta["target"], "target_desercion")

    def test_values_finite_and_in_range(self):
        self.assertTrue(np.isfinite(self.X).all())
        self.assertTrue((self.X >= 0).all())
        self.assertTrue((self.X[:, 0] <= 20).all())
        self.assertTrue((self.X[:, 2] <= 100).all())


class TestRealModeHasNoSyntheticFallback(unittest.TestCase):
    def setUp(self):
        self._previous = os.environ.pop("ML_DATA_MODE", None)
        os.environ.pop("DATASET_PATH", None)

    def tearDown(self):
        os.environ.pop("DATASET_PATH", None)
        if self._previous is not None:
            os.environ["ML_DATA_MODE"] = self._previous

    def test_real_without_dataset_path_fails(self):
        os.environ["ML_DATA_MODE"] = "real"
        with self.assertRaises(DatasetError) as caught:
            load_dataset()
        self.assertIn("DATASET_PATH", str(caught.exception))
        self.assertNotIn("synthetic-scientific-v6", str(caught.exception))

    def test_real_path_missing_fails(self):
        os.environ["ML_DATA_MODE"] = "real"
        os.environ["DATASET_PATH"] = str(ROOT / "data" / "real" / "no-existe.csv")
        with self.assertRaises(DatasetError):
            load_dataset()

    def test_invalid_mode_fails(self):
        os.environ["ML_DATA_MODE"] = "demo"
        with self.assertRaises(DatasetError):
            resolve_mode()


class TestArtifacts(unittest.TestCase):
    def test_synthetic_artifacts_exist(self):
        directory = ROOT / "artifacts" / "synthetic"
        for name in ("best_model.joblib", "random_forest_model.joblib",
                     "stacking_model.joblib", "features.joblib", "metrics.json",
                     "metrics_comparison.csv", "training_history.json", "metadata.json"):
            self.assertTrue((directory / name).exists(), f"falta {name}")

    def test_synthetic_artifacts_not_written_into_real(self):
        real_dir = ROOT / "artifacts" / "real"
        model_files = [] if not real_dir.exists() else [
            p.name for p in real_dir.glob("*.joblib")
        ]
        self.assertEqual(model_files, [])

    def test_metadata_marks_experimental_synthetic(self):
        meta = json.loads((ROOT / "artifacts" / "synthetic" / "metadata.json")
                          .read_text(encoding="utf-8"))
        self.assertEqual(meta["data_mode"], "synthetic_scientific")
        self.assertEqual(meta["dataset_version"], SYNTHETIC_DATASET_VERSION)
        self.assertEqual(meta["n_features"], 7)
        self.assertEqual(meta["feature_names"], FEATURE_NAMES)
        self.assertTrue(meta["experimental"])

    def test_metrics_select_on_validation_only(self):
        metrics = json.loads((ROOT / "artifacts" / "synthetic" / "metrics.json")
                             .read_text(encoding="utf-8"))
        self.assertEqual(metrics["selection"], "validation_f1_desercion")
        self.assertFalse(metrics["holdout_used_for_selection"])
        self.assertEqual(metrics["n_features"], 7)
        self.assertNotIn("prob_generador", metrics["features"])
        self.assertNotIn("score_generador", metrics["features"])
        for model_name, block in metrics["holdout_results"].items():
            for key in ("accuracy", "precision", "recall", "f1_score", "roc_auc",
                        "pr_auc", "brier", "confusion_matrix", "tn", "fp", "fn", "tp",
                        "specificity", "sensitivity"):
                self.assertIn(key, block, f"{model_name} sin {key}")
            self.assertGreaterEqual(block["accuracy"], 0.0)
            self.assertLessEqual(block["accuracy"], 1.0)
            for bound in ("roc_auc", "pr_auc", "brier"):
                if block[bound] is None:
                    continue
                self.assertGreaterEqual(block[bound], 0.0)
                self.assertLessEqual(block[bound], 1.0)


class TestPredict(unittest.TestCase):
    def test_no_model_returns_503(self):
        with patch('app.main.model', None), self.assertRaises(HTTPException) as caught:
            predict(PredictInput(**PAYLOAD))
        self.assertEqual(caught.exception.status_code, 503)

    def test_inference_error_returns_503_without_heuristic(self):
        class BrokenModel:
            classes_ = [0, 1]
            def predict_proba(self, features): raise RuntimeError("fallo interno")
        with patch('app.main.model', BrokenModel()):
            with self.assertRaises(HTTPException) as caught:
                predict(PredictInput(**PAYLOAD))
        self.assertEqual(caught.exception.status_code, 503)
        self.assertNotIn("heuristic", str(caught.exception.detail).lower())

    def test_probability_maps_to_level(self):
        class Model:
            classes_ = [0, 1]
            def predict_proba(self, features):
                return np.array([[0.73, 0.27]])
        with patch('app.main.model', Model()):
            result = predict(PredictInput(**PAYLOAD))
        self.assertEqual(result.nivelRiesgo, 'bajo')
        self.assertEqual(result.probabilidadDesercion, 0.27)
        self.assertEqual(result.level, 'bajo')
        self.assertEqual(result.probability_abandono, 0.27)

    def test_high_probability_maps_to_alto(self):
        class Model:
            classes_ = [0, 1]
            def predict_proba(self, features):
                return np.array([[0.27, 0.73]])
        with patch('app.main.model', Model()):
            result = predict(PredictInput(**PAYLOAD))
        self.assertEqual(result.nivelRiesgo, 'alto')
        self.assertEqual(result.probabilidadDesercion, 0.73)

    def test_contract_fields_present(self):
        class Model:
            classes_ = [0, 1]
            def predict_proba(self, features):
                return np.array([[0.4, 0.6]])
        with patch('app.main.model', Model()), \
             patch('app.main.model_meta', {"model_version": "BLENKIR_V6_BIN_TEST",
                                           "dataset_version": SYNTHETIC_DATASET_VERSION,
                                           "data_mode": "synthetic_scientific",
                                           "contract_version": "2026-v3",
                                           "decision_threshold": 0.41}), \
             patch('app.main.best_model_name', 'stacking'):
            result = predict(PredictInput(**PAYLOAD))
        self.assertEqual(result.probabilidadDesercion, 0.6)
        self.assertEqual(result.nivelRiesgo, 'medio')
        self.assertEqual(result.modelo, 'stacking')
        self.assertEqual(result.modelVersion, 'BLENKIR_V6_BIN_TEST')
        self.assertEqual(result.datasetVersion, SYNTHETIC_DATASET_VERSION)
        self.assertEqual(result.dataMode, 'synthetic_scientific')
        self.assertEqual(result.contractVersion, '2026-v3')
        self.assertIsInstance(result.factors, list)
        self.assertTrue(0 <= result.probabilidadDesercion <= 1)

    def test_response_does_not_leak_known_target(self):
        class Model:
            classes_ = [0, 1]
            def predict_proba(self, features):
                return np.array([[0.5, 0.5]])
        with patch('app.main.model', Model()):
            result = predict(PredictInput(**PAYLOAD)).model_dump()
        self.assertNotIn("target_desercion", result)
        self.assertNotIn("target", result)
        self.assertNotIn("target_label", result)

    def test_probability_always_between_0_and_1(self):
        for value in (0.0, 0.05, 0.95, 1.0):
            class Model:
                classes_ = [0, 1]
                def predict_proba(self, features):
                    return np.array([[1 - value, value]])
            with patch('app.main.model', Model()):
                result = predict(PredictInput(**PAYLOAD))
            self.assertTrue(0 <= result.probabilidadDesercion <= 1)
            self.assertIn(result.nivelRiesgo, ("bajo", "medio", "alto"))


class TestLevelFromModelOutput(unittest.TestCase):
    def test_probability_to_level_matches_thresholds(self):
        for probability in (0.0, 0.2, 0.4099, 0.41, 0.64, 0.65, 1.0):
            self.assertEqual(
                probability_to_level(probability), level_from_probability(probability)
            )


if __name__ == '__main__':
    unittest.main()
