FROM python:3.12-slim

WORKDIR /app
COPY requirements.lock .
RUN pip install --no-cache-dir --only-binary=:all: --require-hashes -r requirements.lock
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --create-home app
COPY app ./app
COPY utils ./utils
COPY models ./models

USER app

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-5000}"]
