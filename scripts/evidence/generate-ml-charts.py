"""LEGACY — NO USAR PARA EVIDENCIA V6. Generador de gráficos ML deshabilitado.

Este script era el generador de gráficos del pipeline ANTERIOR a BLENKIR V6:

- datos: ``generate_synthetic_data(2500)`` (función que ya **no existe** en ``train.py`` V6);
- target: **multiclase** 0/1/2 (bajo / medio / alto);
- artefactos leídos de ``machine-learning/models`` (V6 escribe en
  ``machine-learning/artifacts/synthetic``);
- partición: ``train_test_split`` 80/20 (V6 usa los splits fijos del CSV:
  train 316 · validation 68 · holdout 66).

Está **DESHABILITADO**: al ejecutarlo termina con ``exit 1`` y **no escribe ningún fichero**,
de modo que ninguna imagen actual pueda provenir de este pipeline. Tampoco lo invoca
``npm run evidence:generate`` (``scripts/evidence/run-all.mjs`` solo ejecuta
``verify-stack.mjs`` y ``capture-ui.mjs``).

Evidencia ML vigente (V6):

- métricas: ``docs/ml/RESULTADOS_EXPERIMENTALES_V6.md``;
- artefactos: ``machine-learning/artifacts/synthetic/`` (`BLENKIR_V6_BIN_20260924`);
- pruebas: ``npm run ml:test`` (32 pruebas).

El código original de este generador se conserva en el historial de git y las imágenes que ya
generó están clasificadas como **HISTÓRICAS** en ``docs/evidencias/README.md``.
"""
from __future__ import annotations

import sys

LEGACY_NOTICE = """\
LEGACY — scripts/evidence/generate-ml-charts.py está DESHABILITADO (no genera evidencia V6).

Pipeline anterior (multiclase, 2500 muestras, clases bajo/medio/alto, machine-learning/models).
Pipeline vigente: BLENKIR V6 — target binario permanece/deserta, dataset CSV científico-sintético
(450 instantáneas / 225 estudiantes), artefactos en machine-learning/artifacts/synthetic.
Referencias: docs/ml/RESULTADOS_EXPERIMENTALES_V6.md · docs/ml/PIPELINE_ML_V6.md
Pruebas: npm run ml:test
"""


def main() -> int:
    print(LEGACY_NOTICE, file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
