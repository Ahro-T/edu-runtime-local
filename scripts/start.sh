#!/bin/bash
# start.sh — Start the Edu runtime stack (local Ollama + Gemma 4 E2B)
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Container runtime detection
if [ "${CONTAINER_RUNTIME:-}" = "podman" ]; then
  COMPOSE="sudo podman-compose"
  CONTAINER="sudo podman"
else
  COMPOSE="docker-compose"
  CONTAINER="docker"
fi

# Load .env if present
if [ -f .env ]; then
  echo "[start] Loading .env"
else
  echo "[start] No .env found. Run ./scripts/setup-dev.sh first."
  exit 1
fi

echo "[start] Building and starting Edu stack (${CONTAINER_RUNTIME:-docker})..."
$COMPOSE -p edu-runtime up -d --build

echo ""
echo "[start] Waiting for postgres to be healthy..."
for i in $(seq 1 30); do
  if $COMPOSE -p edu-runtime exec -T postgres pg_isready -U postgres -d edu_runtime > /dev/null 2>&1; then
    echo "[start] postgres: healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[start] ERROR: postgres did not become healthy in 60s"
    exit 1
  fi
  sleep 2
done

echo "[start] Waiting for app to be healthy..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:3000/health" > /dev/null 2>&1; then
    echo "[start] app: healthy (http://localhost:3000)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[start] ERROR: app did not become healthy in 60s"
    exit 1
  fi
  sleep 2
done

echo ""
echo "========================================="
echo "  Edu Runtime is running"
echo "========================================="
echo "  API:       http://localhost:3000"
echo "  OpenClaw:  http://localhost:3100"
echo "  Postgres:  localhost:5432"
echo ""
echo "  Stop:  ./scripts/stop.sh"
echo "========================================="
