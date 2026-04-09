#!/bin/bash
# stop.sh — Stop containers (data preserved)
# Use cleanup.sh for full removal
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

MODE="${1:-all}"
if [ "$MODE" = "local" ]; then
  echo "[stop] Stopping local..."
  $COMPOSE -p edu-runtime -f docker-compose.yml -f docker-compose.local.yml down --remove-orphans 2>/dev/null || true
elif [ "$MODE" = "remote" ]; then
  echo "[stop] Stopping remote..."
  $COMPOSE -p edu-runtime-remote -f docker-compose.yml -f docker-compose.remote.yml down --remove-orphans 2>/dev/null || true
else
  echo "[stop] Stopping all..."
  $COMPOSE -p edu-runtime -f docker-compose.yml -f docker-compose.local.yml down --remove-orphans 2>/dev/null || true
  $COMPOSE -p edu-runtime-remote -f docker-compose.yml -f docker-compose.remote.yml down --remove-orphans 2>/dev/null || true
fi

echo ""
echo "========================================="
echo "  Edu Runtime stopped — data preserved"
echo "  cleanup.sh for full removal"
echo "========================================="
