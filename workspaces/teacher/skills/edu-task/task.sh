#!/bin/sh
API="http://app:3000"
PILLAR="${1:-agents}"
DISCORD_USER_ID="${OPENCLAW_DISCORD_USER_ID:-unknown}"

LEARNER=$(curl -sf -X POST "$API/api/learners/upsert" \
  -H "Content-Type: application/json" \
  -d "{\"discordUserId\": \"$DISCORD_USER_ID\"}")
LEARNER_ID=$(echo "$LEARNER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

NODE=$(curl -sf -X GET "$API/api/learners/$LEARNER_ID/current-node?pillar=$PILLAR")
echo "=== edu-task: pillar=$PILLAR ==="
echo "Current Node: $NODE"
echo "INSTRUCTION: Generate a 5-slot assessment task for this node."
