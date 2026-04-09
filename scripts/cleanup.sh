#!/usr/bin/env bash
# cleanup.sh — Remove all traces from a shared NUC
# Usage: ./scripts/cleanup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "  Edu Runtime — Full Cleanup"
echo "========================================="

# 1. Stop containers
echo "[cleanup] Stopping containers..."
cd "$PROJECT_ROOT"
docker-compose down -v --remove-orphans 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

# 2. Remove Claude Code
echo "[cleanup] Removing Claude Code..."
rm -rf ~/.claude ~/.config/claude 2>/dev/null || true
# Remove binary from PATH
rm -f ~/.local/bin/claude 2>/dev/null || true

# 3. Remove project
echo "[cleanup] Removing project directory..."
cd /
rm -rf "$PROJECT_ROOT"

echo ""
echo "========================================="
echo "  Clean slate. No traces left."
echo "========================================="
