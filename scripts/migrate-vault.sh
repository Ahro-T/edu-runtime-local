#!/usr/bin/env bash
# migrate-vault.sh
#
# Documents the one-time migration of vault/ -> wiki-vault/
# with id preservation. This script is idempotent: re-running it
# will not overwrite files that already exist in wiki-vault/.
#
# Migration steps:
#   1. Copy vault/agents/*.md    -> wiki-vault/concepts/agents/
#   2. Copy vault/harnesses/*.md -> wiki-vault/concepts/harnesses/
#   3. Copy vault/openclaw/*.md  -> wiki-vault/concepts/openclaw/
#   4. Copy vault/templates/*.md -> wiki-vault/templates/
#   5. Verify all 9 node ids and 9 template ids are present in wiki-vault/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VAULT="${ROOT}/vault"
WIKI="${ROOT}/wiki-vault"

echo "=== edu-runtime vault migration ==="
echo "Source: ${VAULT}"
echo "Target: ${WIKI}"
echo ""

# Ensure target directories exist
mkdir -p "${WIKI}/concepts/agents"
mkdir -p "${WIKI}/concepts/harnesses"
mkdir -p "${WIKI}/concepts/openclaw"
mkdir -p "${WIKI}/templates"
mkdir -p "${WIKI}/sources"
mkdir -p "${WIKI}/syntheses"
mkdir -p "${WIKI}/reports"
mkdir -p "${WIKI}/.openclaw-wiki"

# Step 1: Copy agents
echo "Step 1: Copying agents..."
for f in "${VAULT}/agents/"*.md; do
  dest="${WIKI}/concepts/agents/$(basename "$f")"
  if [ -f "$dest" ]; then
    echo "  [skip] $(basename "$f") already exists"
  else
    cp "$f" "$dest"
    echo "  [copy] $(basename "$f")"
  fi
done

# Step 2: Copy harnesses
echo "Step 2: Copying harnesses..."
for f in "${VAULT}/harnesses/"*.md; do
  dest="${WIKI}/concepts/harnesses/$(basename "$f")"
  if [ -f "$dest" ]; then
    echo "  [skip] $(basename "$f") already exists"
  else
    cp "$f" "$dest"
    echo "  [copy] $(basename "$f")"
  fi
done

# Step 3: Copy openclaw
echo "Step 3: Copying openclaw..."
for f in "${VAULT}/openclaw/"*.md; do
  dest="${WIKI}/concepts/openclaw/$(basename "$f")"
  if [ -f "$dest" ]; then
    echo "  [skip] $(basename "$f") already exists"
  else
    cp "$f" "$dest"
    echo "  [copy] $(basename "$f")"
  fi
done

# Step 4: Copy templates
echo "Step 4: Copying templates..."
for f in "${VAULT}/templates/"*.md; do
  dest="${WIKI}/templates/$(basename "$f")"
  if [ -f "$dest" ]; then
    echo "  [skip] $(basename "$f") already exists"
  else
    cp "$f" "$dest"
    echo "  [copy] $(basename "$f")"
  fi
done

# Step 5: Verify all node ids and template ids are present
echo ""
echo "Step 5: Verifying id preservation..."

NODE_IDS=$(grep -h "^id:" \
  "${WIKI}/concepts/agents/"*.md \
  "${WIKI}/concepts/harnesses/"*.md \
  "${WIKI}/concepts/openclaw/"*.md \
  2>/dev/null | sed 's/^id: //' | sort)

TEMPLATE_IDS=$(grep -h "^id:" \
  "${WIKI}/templates/"*.md \
  2>/dev/null | sed 's/^id: //' | sort)

NODE_COUNT=$(echo "$NODE_IDS" | grep -c .)
TEMPLATE_COUNT=$(echo "$TEMPLATE_IDS" | grep -c .)

echo "Node ids found (${NODE_COUNT}):"
echo "$NODE_IDS" | sed 's/^/  /'

echo ""
echo "Template ids found (${TEMPLATE_COUNT}):"
echo "$TEMPLATE_IDS" | sed 's/^/  /'

echo ""

# Verify cross-references: every node's assessment_template should exist
ERRORS=0
while IFS= read -r node_file; do
  node_id=$(grep "^id:" "$node_file" | sed 's/^id: //')
  tpl_ref=$(grep "^assessment_template:" "$node_file" | sed 's/^assessment_template: //')
  if [ -n "$tpl_ref" ] && [ ! -f "${WIKI}/templates/${tpl_ref}.md" ]; then
    echo "  [ERROR] Node ${node_id} references template ${tpl_ref} but ${tpl_ref}.md not found in wiki-vault/templates/"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "${WIKI}/concepts" -name "*.md")

# Verify cross-references: every template's nodeId should exist as a node
while IFS= read -r tpl_file; do
  tpl_id=$(grep "^id:" "$tpl_file" | sed 's/^id: //')
  node_ref=$(grep "^nodeId:" "$tpl_file" | sed 's/^nodeId: //')
  if [ -n "$node_ref" ]; then
    found=$(find "${WIKI}/concepts" -name "*.md" -exec grep -l "^id: ${node_ref}$" {} \; 2>/dev/null | head -1)
    if [ -z "$found" ]; then
      echo "  [ERROR] Template ${tpl_id} references nodeId ${node_ref} but no matching node found"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done < <(find "${WIKI}/templates" -name "*.md")

if [ "$ERRORS" -eq 0 ]; then
  echo "Verification passed: all ${NODE_COUNT} node ids and ${TEMPLATE_COUNT} template ids are present and cross-references resolve."
  echo ""
  echo "Migration complete."
  exit 0
else
  echo ""
  echo "Verification FAILED: ${ERRORS} error(s) found. See above."
  exit 1
fi
