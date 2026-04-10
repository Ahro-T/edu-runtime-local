#!/bin/sh
API="http://app:3000"
DISCORD_USER_ID="${OPENCLAW_DISCORD_USER_ID:-unknown}"

LEARNER=$(curl -sf -X POST "$API/api/learners/upsert" \
  -H "Content-Type: application/json" \
  -d "{\"discordUserId\": \"$DISCORD_USER_ID\"}")
LEARNER_ID=$(echo "$LEARNER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

DASHBOARD=$(curl -sf -X GET "$API/api/learners/$LEARNER_ID/dashboard")
echo "=== edu-status ==="
echo "Dashboard: $DASHBOARD"
