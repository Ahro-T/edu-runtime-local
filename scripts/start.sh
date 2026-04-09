#!/bin/sh
# start.sh — Start the Edu runtime stack
# Usage: ./scripts/start.sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Load .env if present
if [ -f .env ]; then
  echo "[start] Loading .env"
else
  echo "[start] No .env found. Run ./scripts/setup-dev.sh first."
  exit 1
fi

echo "[start] Building and starting Edu stack..."
docker-compose up -d --build

echo ""
echo "[start] Waiting for postgres to be healthy..."
until docker-compose exec -T postgres pg_isready -U postgres -d edu_runtime > /dev/null 2>&1; do
  sleep 2
done
echo "[start] postgres: healthy"

echo "[start] Waiting for app to be healthy..."
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  sleep 2
done
echo "[start] app: healthy (http://localhost:3000)"

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
