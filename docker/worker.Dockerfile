# Recording worker: Playwright + Chromium (bundled in the base image) + ffmpeg.
# Completed in Phase 3. Build context: repo root.
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker/ .

CMD ["python", "main.py"]
