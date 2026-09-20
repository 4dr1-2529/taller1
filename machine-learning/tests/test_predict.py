"""Contract tests. No generated dataset or model performance claims."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import numpy as np
from fastapi import HTTPException
from pydantic import ValidationError as PydanticValidationError
from app.features import FEATURE_NAMES, build_feature_vector
from app.main import PredictInput, predict
from utils.validators import ValidationError, validate_predict_payload

PAYLOAD = dict(promedio_general=14, cursos_desaprobados=1, asistencia_general=90,
               frecuencia_acceso_lms=3, tiempo_interaccion_lms=2,
               actividades_realizadas=4, recursos_consultados=5)

class TestPredict(unittest.TestCase):
    def test_contract_order(self):
        self.assertEqual(build_feature_vector(PAYLOAD).tolist(), [[14, 1, 90, 3, 2, 4, 5]])
        self.assertEqual(len(FEATURE_NAMES), 7)
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
    def test_no_model_returns_503(self):
        with patch('app.main.model', None), self.assertRaises(HTTPException) as caught:
            predict(PredictInput(**PAYLOAD))
        self.assertEqual(caught.exception.status_code, 503)
    def test_class_mapping(self):
        class Model:
            def predict(self, features): return np.array([2])
            def predict_proba(self, features): return np.array([[0.1, 0.2, 0.7]])
        with patch('app.main.model', Model()):
            result = predict(PredictInput(**PAYLOAD))
        self.assertEqual(result.level, 'alto')
        self.assertEqual(result.probability_abandono, 0.7)

if __name__ == '__main__':
    unittest.main()
