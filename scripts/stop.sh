#!/bin/bash
# stop.sh — Stop containers (data preserved)
# Use cleanup.sh for full removal
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

MODE="${1:-local}"

# Container runtime detection
if [ "${CONTAINER_RUNTIME:-}" = "podman" ]; then
  COMPOSE="sudo podman-compose"
  CONTAINER="sudo podman"
else
  COMPOSE="docker-compose"
  CONTAINER="docker"
fi

if [ "$MODE" = "democlaw" ]; then
  echo "[stop] Stopping edu-runtime services (democlaw mode)..."
  $COMPOSE -f docker-compose.democlaw.yml down 2>/dev/null || true

  echo ""
  echo "========================================="
  echo "  Edu Runtime stopped — data preserved"
  echo "  democlaw stack left running"
  echo "========================================="
  exit 0
fi

echo "[stop] Stopping Edu Runtime..."
$COMPOSE -p edu-runtime down --remove-orphans 2>/dev/null || true

echo ""
echo "========================================="
echo "  Edu Runtime stopped — data preserved"
echo "  cleanup.sh for full removal"
echo "========================================="
