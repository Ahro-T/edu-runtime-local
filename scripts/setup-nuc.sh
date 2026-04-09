#!/bin/bash
# setup-nuc.sh — One-command NUC deployment with democlaw LLM backend
# Usage: ./scripts/setup-nuc.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMOCLAW_DIR="$(cd "$PROJECT_ROOT/.." && pwd)/democlaw"

# Trap Ctrl+C for clean exit
cleanup() {
  echo ""
  echo "[setup-nuc] Interrupted. Containers may still be running."
  echo "[setup-nuc] To stop: ./scripts/stop.sh democlaw"
  exit 1
}
trap cleanup INT

echo "========================================="
echo "  edu-runtime + democlaw — NUC Setup"
echo "========================================="

# ── Phase 1: Prerequisites check ──────────────────────────────────────────────

echo ""
echo "[phase 1] Checking prerequisites..."

MISSING=""

if ! command -v nvidia-smi >/dev/null 2>&1; then
  MISSING="${MISSING}\n  - nvidia-smi (install NVIDIA drivers)"
fi

if ! command -v git >/dev/null 2>&1; then
  MISSING="${MISSING}\n  - git"
fi

if ! command -v curl >/dev/null 2>&1; then
  MISSING="${MISSING}\n  - curl"
fi

# Auto-detect container runtime
if command -v docker >/dev/null 2>&1; then
  CONTAINER_RUNTIME="docker"
elif command -v podman >/dev/null 2>&1; then
  CONTAINER_RUNTIME="podman"
else
  MISSING="${MISSING}\n  - docker or podman"
fi

# Check compose availability (after runtime is detected)
if [ -n "${CONTAINER_RUNTIME:-}" ]; then
  if [ "$CONTAINER_RUNTIME" = "docker" ]; then
    if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
      MISSING="${MISSING}\n  - docker compose (plugin or standalone)"
    fi
  else
    if ! command -v podman-compose >/dev/null 2>&1; then
      MISSING="${MISSING}\n  - podman-compose"
    fi
  fi
fi

if [ -n "$MISSING" ]; then
  echo "[phase 1] ERROR: Missing required tools:"
  printf "$MISSING\n"
  exit 1
fi

echo "[phase 1] Container runtime: ${CONTAINER_RUNTIME}"

# Check NVIDIA driver version
DRIVER_VERSION="$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null || true)"
if [ -z "$DRIVER_VERSION" ]; then
  echo "[phase 1] ERROR: nvidia-smi found but GPU query failed. Check NVIDIA driver installation."
  exit 1
fi
echo "[phase 1] NVIDIA driver: ${DRIVER_VERSION}"
echo "[phase 1] Prerequisites OK"

# Set compose command
if [ "$CONTAINER_RUNTIME" = "podman" ]; then
  COMPOSE="sudo podman-compose"
else
  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
  else
    COMPOSE="docker-compose"
  fi
fi

# ── Phase 2: Clone democlaw ────────────────────────────────────────────────────

echo ""
echo "[phase 2] Checking for democlaw..."

if [ -d "$DEMOCLAW_DIR" ]; then
  echo "[phase 2] democlaw already present, skipping clone"
else
  echo "[phase 2] Cloning democlaw into ${DEMOCLAW_DIR}..."
  git clone https://github.com/JinwangMok/democlaw.git "$DEMOCLAW_DIR"
  echo "[phase 2] democlaw cloned"
fi

# ── Phase 3: Create .env ──────────────────────────────────────────────────────

echo ""
echo "[phase 3] Configuring .env..."

cd "$PROJECT_ROOT"

if [ -f .env ]; then
  printf "[phase 3] .env already exists. Overwrite? (y/N) "
  read overwrite
  if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
    echo "[phase 3] Keeping existing .env"
  else
    cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/edu_runtime
LLM_URL=http://llamacpp:8000
LLM_MODEL=gemma-4-E4B-it
VAULT_PATH=/app/wiki-vault
OPENCLAW_GATEWAY_URL=http://openclaw:18789
LOG_LEVEL=info
PORT=3000
EOF
    echo "[phase 3] .env created"
  fi
else
  cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/edu_runtime
LLM_URL=http://llamacpp:8000
LLM_MODEL=gemma-4-E4B-it
VAULT_PATH=/app/wiki-vault
OPENCLAW_GATEWAY_URL=http://openclaw:18789
LOG_LEVEL=info
PORT=3000
EOF
  echo "[phase 3] .env created"
fi

# ── Phase 4: Start democlaw ───────────────────────────────────────────────────

echo ""
echo "[phase 4] Starting democlaw (first run may download ~5.7 GB model)..."

cd "$DEMOCLAW_DIR"

if ! ./scripts/start.sh; then
  echo "[phase 4] ERROR: democlaw start.sh failed."
  echo "[phase 4] Check logs: docker logs democlaw-llamacpp"
  exit 1
fi

echo "[phase 4] Waiting for llama.cpp to be ready (timeout 600s)..."
TIMEOUT=600
ELAPSED=0
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if curl -sf http://localhost:8000/v1/models >/dev/null 2>&1; then
    echo ""
    echo "[phase 4] llama.cpp: healthy (http://localhost:8000/v1)"
    break
  fi
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo ""
    echo "[phase 4] ERROR: llama.cpp did not become healthy within ${TIMEOUT}s."
    echo "[phase 4] Check logs: docker logs democlaw-llamacpp"
    exit 1
  fi
  printf "."
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

# Final check after loop (covers exact timeout boundary)
if ! curl -sf http://localhost:8000/v1/models >/dev/null 2>&1; then
  echo ""
  echo "[phase 4] ERROR: llama.cpp did not become healthy within ${TIMEOUT}s."
  echo "[phase 4] Check logs: docker logs democlaw-llamacpp"
  exit 1
fi

# ── Phase 5: Start edu-runtime ────────────────────────────────────────────────

echo ""
echo "[phase 5] Starting edu-runtime..."

cd "$PROJECT_ROOT"

if ! $COMPOSE -f docker-compose.democlaw.yml up -d --build; then
  echo "[phase 5] ERROR: edu-runtime failed to start."
  echo "[phase 5] Check logs: $COMPOSE -f docker-compose.democlaw.yml logs -f app"
  exit 1
fi

echo "[phase 5] Waiting for app to be healthy (timeout 60s)..."
TIMEOUT=60
ELAPSED=0
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "[phase 5] app: healthy (http://localhost:3000)"
    break
  fi
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "[phase 5] ERROR: app did not become healthy within ${TIMEOUT}s."
    echo "[phase 5] Check logs: $COMPOSE -f docker-compose.democlaw.yml logs -f app"
    exit 1
  fi
  printf "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if ! curl -sf http://localhost:3000/health >/dev/null 2>&1; then
  echo ""
  echo "[phase 5] ERROR: app did not become healthy within 60s."
  echo "[phase 5] Check logs: $COMPOSE -f docker-compose.democlaw.yml logs -f app"
  exit 1
fi

# ── Phase 6: Summary ──────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  edu-runtime + democlaw — Ready!"
echo "========================================="
echo "  API:       http://localhost:3000"
echo "  LLM:       http://localhost:8000/v1"
echo "  Dashboard: (check democlaw output above)"
echo ""
echo "  Stop:   ./scripts/stop.sh democlaw"
echo "  Logs:   $COMPOSE -f docker-compose.democlaw.yml logs -f app"
echo "========================================="
