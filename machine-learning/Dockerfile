FROM python:3.12-slim

WORKDIR /app
COPY requirements.lock .
RUN pip install --no-cache-dir --only-binary=:all: --require-hashes -r requirements.lock
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --create-home app
COPY app ./app
COPY utils ./utils
COPY models ./models
# Artefactos V6 (Data Seed sintetico): metadata.json, metrics.json, features.joblib,
# best_model.joblib y los modelos candidatos. Sin esta capa el contenedor arranca en
# /health modelLoaded=false (el codigo los resuelve en ROOT/artifacts/synthetic).
COPY artifacts/synthetic ./artifacts/synthetic

USER app

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-5000}"]
