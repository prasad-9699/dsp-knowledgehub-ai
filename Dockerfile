# Multi-layer secure production Dockerfile for DSP KnowledgeHub AI Backend
FROM python:3.11-slim

# System security & optimization flags
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install native dependencies for build and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies from backend/
COPY backend/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy backend application source code
COPY backend/ .

# Create non-root unprivileged service user for enterprise compliance
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Support dynamic $PORT assigned by Render/Cloud platforms with fallback to 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1

