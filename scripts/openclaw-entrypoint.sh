#!/bin/sh
set -e

CONFIG_DIR="/home/node/.openclaw"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"

mkdir -p "$CONFIG_DIR"

VLLM_BASE="${VLLM_URL:-http://ollama:11434}"
MODEL_ID="${VLLM_MODEL:-ollama/gemma4:e2b}"
DISCORD_TOKEN_VAL="${DISCORD_TOKEN:-}"
DISCORD_GUILD_VAL="${DISCORD_GUILD_ID:-}"
CF_ID="${CF_ACCESS_CLIENT_ID:-}"
CF_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"

# If CF Access credentials provided, start a local proxy that injects headers
if [ -n "$CF_ID" ] && [ -n "$CF_SECRET" ]; then
  echo "[openclaw-entrypoint] Starting vLLM proxy (CF Access enabled)..."
  node /entrypoint-scripts/vllm-proxy.mjs &
  PROXY_PID=$!
  sleep 1
  PROVIDER_URL="http://127.0.0.1:8787/v1"
  echo "[openclaw-entrypoint] vLLM proxy PID=$PROXY_PID -> ${VLLM_BASE}"
else
  PROVIDER_URL="${VLLM_BASE}/v1"
fi

# Set up teacher agent directory
mkdir -p "$CONFIG_DIR/agents/teacher/agent"
mkdir -p "$CONFIG_DIR/agents/teacher/sessions"

# Write config with agents section included
cat > "$CONFIG_FILE" << EOFCONFIG
{
  "agents": {
    "list": [
      {
        "id": "teacher",
        "name": "teacher",
        "workspace": "/workspace",
        "agentDir": "/home/node/.openclaw/agents/teacher/agent",
        "model": "${MODEL_ID}"
      }
    ]
  },
  "models": {
    "mode": "replace",
    "providers": {
      "ollama": {
        "baseUrl": "${PROVIDER_URL}",
        "api": "openai-completions",
        "apiKey": "EMPTY",
        "models": [
          {"id": "${MODEL_ID}", "name": "Gemma 4"}
        ]
      }
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "token": "${DISCORD_TOKEN_VAL}",
      "guilds": {
        "1487744986404491387": {"requireMention": true}
      },
      "intents": {"presence": true, "guildMembers": true}
    }
  },
  "mcp": {}
}
EOFCONFIG

echo "[openclaw-entrypoint] Config written to $CONFIG_FILE"
echo "[openclaw-entrypoint] Model: ${MODEL_ID} via ${PROVIDER_URL}"
echo "[openclaw-entrypoint] Discord guild: ${DISCORD_GUILD_VAL}"

# Start OpenClaw gateway in foreground
exec openclaw gateway run --allow-unconfigured --verbose
