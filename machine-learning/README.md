# Machine Learning Service

Servicio FastAPI para predicción de riesgo de deserción (ensemble: Random Forest, HistGradientBoosting, Stacking).

```bash
pip install -r requirements.txt
python train.py
python -m uvicorn app.main:app --reload --port 5000
```

Desde la raíz: `npm run dev:ml` o `npm run ml:train`
