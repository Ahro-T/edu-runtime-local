#!/usr/bin/env bash
# wiki-search.sh — CLI search tool for wiki-vault
# Usage: wiki-search.sh [--pillar PILLAR] [--tag TAG] QUERY
# Output: one structured line per match (parseable by agents)

set -euo pipefail

WIKI_ROOT="$(cd "$(dirname "$0")/.." && pwd)/wiki-vault/concepts"

PILLAR_FILTER=""
TAG_FILTER=""
QUERY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pillar)
      PILLAR_FILTER="$2"
      shift 2
      ;;
    --tag)
      TAG_FILTER="$2"
      shift 2
      ;;
    *)
      QUERY="$1"
      shift
      ;;
  esac
done

if [[ -z "$QUERY" ]]; then
  echo "Usage: wiki-search.sh [--pillar PILLAR] [--tag TAG] QUERY" >&2
  exit 1
fi

# Build search paths
if [[ -n "$PILLAR_FILTER" ]]; then
  SEARCH_DIRS=("$WIKI_ROOT/$PILLAR_FILTER")
else
  SEARCH_DIRS=("$WIKI_ROOT")
fi

# Search and format results
find "${SEARCH_DIRS[@]}" -name "*.md" -type f 2>/dev/null | sort | while read -r FILE; do
  # Extract frontmatter fields
  NODE_ID=$(awk '/^---/{f=!f;next} f && /^id:/{print $2; exit}' "$FILE")
  TITLE=$(awk '/^---/{f=!f;next} f && /^title:/{sub(/^title:[[:space:]]*/,""); print; exit}' "$FILE")
  PILLAR=$(awk '/^---/{f=!f;next} f && /^pillar:/{print $2; exit}' "$FILE")
  SUMMARY=$(awk '/^---/{f=!f;next} f && /^summary:/{sub(/^summary:[[:space:]]*/,""); print; exit}' "$FILE")

  # Skip if tag filter set and tag not found in frontmatter
  if [[ -n "$TAG_FILTER" ]]; then
    if ! grep -q "$TAG_FILTER" "$FILE" 2>/dev/null; then
      continue
    fi
  fi

  # Match query against: title, summary, body text, pillar, prerequisites, related
  MATCH=$(grep -i "$QUERY" "$FILE" 2>/dev/null | head -1 || true)

  if [[ -z "$MATCH" ]]; then
    continue
  fi

  # Trim snippet
  SNIPPET=$(echo "$MATCH" | sed 's/^[[:space:]]*//' | cut -c1-120)

  # Output one structured line per match
  printf "node-id=%s\ttitle=%s\tpillar=%s\tsnippet=%s\n" \
    "$NODE_ID" "$TITLE" "$PILLAR" "$SNIPPET"
done
