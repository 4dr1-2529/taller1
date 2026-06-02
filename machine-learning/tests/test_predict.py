"""Pruebas básicas del servicio ML — ejecutar: python tests/test_predict.py"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.features import build_feature_vector, proba_to_score
from app.main import PredictInput, heuristic_predict, _normalize_input


class TestPredict(unittest.TestCase):
    def test_heuristic_low_risk(self):
        data = _normalize_input(
            PredictInput(
                promedio_general=16,
                asistencia_general=95,
                actividad_lms_prom=80,
                tareas_ratio=0.95,
                estado="activo",
            )
        )
        out = heuristic_predict(data)
        self.assertEqual(out.level, "bajo")
        self.assertGreaterEqual(out.score, 0)
        self.assertLessEqual(out.score, 100)
        self.assertTrue(out.recommendation)

    def test_heuristic_high_risk(self):
        data = _normalize_input(
            PredictInput(
                promedio_general=8,
                asistencia_general=60,
                actividad_lms_prom=25,
                tareas_ratio=0.3,
                cursos_desaprobados=4,
                estado="retirado",
            )
        )
        out = heuristic_predict(data)
        self.assertIn(out.level, ("medio", "alto"))

    def test_feature_vector_shape(self):
        vec = build_feature_vector({
            "promedio_general": 12,
            "asistencia_general": 80,
            "frecuencia_acceso_lms": 55,
            "tareas_ratio": 0.7,
            "estado": "activo",
        })
        self.assertEqual(vec.shape, (1, 10))

    def test_proba_to_score(self):
        import numpy as np

        score = proba_to_score(np.array([0.1, 0.2, 0.7]))
        self.assertGreaterEqual(score, 60)


if __name__ == "__main__":
    unittest.main()
