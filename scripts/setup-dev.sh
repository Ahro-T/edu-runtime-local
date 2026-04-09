#!/usr/bin/env bash
# setup-dev.sh — Set up dev environment on a shared NUC (no Node required)
# Usage: ./scripts/setup-dev.sh
set -euo pipefail

echo "========================================="
echo "  Edu Runtime — Dev Setup"
echo "========================================="

# Install Claude Code (standalone, no npm)
if command -v claude &>/dev/null; then
  echo "[setup] Claude Code already installed"
else
  echo "[setup] Installing Claude Code..."
  curl -fsSL https://claude.ai/install.sh | sh
fi

# Copy .env if not present
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[setup] Created .env from .env.example — edit it with your tokens"
else
  echo "[setup] .env already exists"
fi

echo ""
echo "========================================="
echo "  Ready. Next steps:"
echo "========================================="
echo "  1. Edit .env with your tokens"
echo "  2. ./scripts/start.sh    — start runtime"
echo "  3. claude                — start coding"
echo "  4. ./scripts/cleanup.sh  — remove everything"
echo "========================================="
