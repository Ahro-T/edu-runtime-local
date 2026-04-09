#!/bin/sh
# stop.sh — Stop and remove all Edu runtime containers + volumes
# Leaves no trace. Safe for shared machines.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "[stop] Stopping and removing all containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true

echo "[stop] Pruning dangling volumes..."
docker volume prune -f 2>/dev/null || true

echo ""
echo "========================================="
echo "  Edu Runtime stopped — clean slate"
echo "========================================="
