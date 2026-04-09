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

# Interactive .env setup
if [ -f .env ]; then
  echo "[setup] .env already exists. Overwrite? (y/N)"
  read -r overwrite
  if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
    echo "[setup] Keeping existing .env"
    echo ""
    echo "========================================="
    echo "  Ready!"
    echo "========================================="
    echo "  ./scripts/start.sh    — start runtime"
    echo "  claude                — start coding"
    echo "  ./scripts/cleanup.sh  — remove everything"
    echo "========================================="
    exit 0
  fi
fi

echo ""
echo "[setup] Creating .env — press Enter to use default"
echo ""

read -rp "VLLM_URL [http://localhost:8000]: " vllm_url
vllm_url="${vllm_url:-http://localhost:8000}"

read -rp "Discord bot token (skip if not using Discord): " discord_token
discord_token="${discord_token:-}"

read -rp "Discord guild ID (skip if not using Discord): " discord_guild
discord_guild="${discord_guild:-}"

read -rp "LOG_LEVEL [info]: " log_level
log_level="${log_level:-info}"

cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/edu_runtime
VLLM_URL=${vllm_url}
VAULT_PATH=/app/wiki-vault
OPENCLAW_DISCORD_TOKEN=${discord_token}
OPENCLAW_DISCORD_GUILD_ID=${discord_guild}
OPENCLAW_GATEWAY_URL=http://localhost:3100
OPENCLAW_GATEWAY_PORT=3100
LOG_LEVEL=${log_level}
PORT=3000
EOF

echo ""
echo "[setup] .env created"

echo ""
echo "========================================="
echo "  Ready!"
echo "========================================="
echo "  ./scripts/start.sh    — start runtime"
echo "  claude                — start coding"
echo "  ./scripts/cleanup.sh  — remove everything"
echo "========================================="
