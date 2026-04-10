#!/bin/sh
# edu-start skill: register learner + start session + get current node
API="http://app:3000"
PILLAR="${1:-agents}"
DISCORD_USER_ID="${OPENCLAW_DISCORD_USER_ID:-unknown}"

echo "=== edu-start: pillar=$PILLAR user=$DISCORD_USER_ID ==="

# Step 1: Upsert learner
LEARNER=$(curl -sf -X POST "$API/api/learners/upsert" \
  -H "Content-Type: application/json" \
  -d "{\"discordUserId\": \"$DISCORD_USER_ID\"}")

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to register learner"
  exit 1
fi

LEARNER_ID=$(echo "$LEARNER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Learner ID: $LEARNER_ID"

# Step 2: Start session
SESSION=$(curl -sf -X POST "$API/api/sessions/start-or-resume" \
  -H "Content-Type: application/json" \
  -d "{\"learnerId\": \"$LEARNER_ID\", \"pillar\": \"$PILLAR\"}")

echo "Session: $SESSION"

# Step 3: Get current node
NODE=$(curl -sf -X GET "$API/api/learners/$LEARNER_ID/current-node?pillar=$PILLAR")
echo "Current Node: $NODE"
