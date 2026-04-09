#!/bin/bash
# cleanup.sh — Remove ALL traces from a shared NUC
# Usage: ./scripts/cleanup.sh [--keep-models]
#
# Removes: edu-runtime containers/images/volumes, democlaw containers/images/volumes,
#           democlaw-net network, cloned repos, Docker build cache, Claude Code.
#
# --keep-models  Keep the LLM model cache (~5.7 GB) to avoid re-downloading next time
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMOCLAW_DIR="$(cd "$PROJECT_ROOT/.." && pwd)/democlaw"

KEEP_MODELS=false
for arg in "$@"; do
  case "$arg" in
    --keep-models) KEEP_MODELS=true ;;
  esac
done

echo "========================================="
echo "  edu-runtime + democlaw — Full Cleanup"
echo "========================================="
echo ""

if [ "$KEEP_MODELS" = "true" ]; then
  echo "  (--keep-models: LLM 모델 캐시 유지)"
  echo ""
fi

# Auto-detect container runtime
if command -v docker >/dev/null 2>&1; then
  CONTAINER="docker"
  if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
  else
    COMPOSE=""
  fi
elif command -v podman >/dev/null 2>&1; then
  CONTAINER="sudo podman"
  COMPOSE="sudo podman-compose"
else
  echo "[cleanup] No container runtime found. Removing files only."
  CONTAINER=""
  COMPOSE=""
fi

# ── 1. Stop edu-runtime containers ───────────────────────────────────────────
echo "[cleanup] 1/7 Stopping edu-runtime containers..."
cd "$PROJECT_ROOT"
if [ -n "$COMPOSE" ]; then
  $COMPOSE -f docker-compose.democlaw.yml down -v --remove-orphans 2>/dev/null || true
  $COMPOSE -f docker-compose.yml down -v --remove-orphans 2>/dev/null || true
fi

# ── 2. Stop democlaw containers ──────────────────────────────────────────────
echo "[cleanup] 2/7 Stopping democlaw containers..."
if [ -n "$CONTAINER" ]; then
  $CONTAINER rm -f democlaw-llamacpp 2>/dev/null || true
  $CONTAINER rm -f democlaw-openclaw 2>/dev/null || true
fi

# ── 3. Remove Docker images ──────────────────────────────────────────────────
echo "[cleanup] 3/7 Removing Docker images..."
if [ -n "$CONTAINER" ]; then
  # edu-runtime images (built from Dockerfile)
  $CONTAINER rmi -f edu-runtime-local-app 2>/dev/null || true
  $CONTAINER rmi -f edu-runtime-local_app 2>/dev/null || true
  # democlaw images
  $CONTAINER rmi -f democlaw-llamacpp 2>/dev/null || true
  $CONTAINER rmi -f democlaw-openclaw 2>/dev/null || true
  $CONTAINER rmi -f jinwangmok/democlaw-llamacpp 2>/dev/null || true
  $CONTAINER rmi -f jinwangmok/democlaw-openclaw 2>/dev/null || true
  # Prune dangling images and build cache
  $CONTAINER image prune -f 2>/dev/null || true
  $CONTAINER builder prune -f 2>/dev/null || true
fi

# ── 4. Remove Docker volumes and network ─────────────────────────────────────
echo "[cleanup] 4/7 Removing volumes and networks..."
if [ -n "$CONTAINER" ]; then
  $CONTAINER volume prune -f 2>/dev/null || true
  $CONTAINER network rm democlaw-net 2>/dev/null || true
fi

# ── 5. Remove LLM model cache ───────────────────────────────────────────────
if [ "$KEEP_MODELS" = "false" ]; then
  echo "[cleanup] 5/7 Removing LLM model cache (~5.7 GB)..."
  rm -rf "${HOME}/.cache/democlaw" 2>/dev/null || true
else
  echo "[cleanup] 5/7 Keeping LLM model cache (--keep-models)"
fi

# ── 6. Remove Claude Code ───────────────────────────────────────────────────
echo "[cleanup] 6/7 Removing Claude Code..."
rm -rf "$HOME/.claude" 2>/dev/null || true
rm -f "$HOME/.claude.json" 2>/dev/null || true
rm -rf "$HOME/.config/claude" 2>/dev/null || true
rm -f "$HOME/.local/bin/claude" 2>/dev/null || true
rm -rf "$HOME/.local/share/claude" 2>/dev/null || true

# Clean shell profile PATH additions
for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
  if [ -f "$rc" ]; then
    grep -v '\.local/bin' "$rc" > "$rc.tmp" 2>/dev/null && mv "$rc.tmp" "$rc" || rm -f "$rc.tmp"
  fi
done

# ── 7. Remove project directories ───────────────────────────────────────────
echo "[cleanup] 7/7 Removing project directories..."
cd /
rm -rf "$DEMOCLAW_DIR" 2>/dev/null || true
rm -rf "$PROJECT_ROOT" 2>/dev/null || true

echo ""
echo "========================================="
echo "  Clean slate. No traces left."
if [ "$KEEP_MODELS" = "true" ]; then
  echo "  (모델 캐시 유지: ~/.cache/democlaw/)"
fi
echo "========================================="
