# Skill: call-runtime-api

Call the Runtime API using `exec curl`. All endpoints use the base URL from `$RUNTIME_API_URL` (default: `http://localhost:3000`).

---

## Extracting channelId from OpenClaw Message Metadata

OpenClaw provides Discord channel context in message metadata. Before calling `start-or-resume`, extract the channel ID from the message metadata field `message.channelId`. This value is the Discord channel ID and must be passed in the request body as `channelId`. The `channelId` column is NOT NULL in the database — omitting it will cause an insert failure.

```
channelId = message.metadata.channelId
```

---

## Endpoints

### 1. Upsert Learner

Maps a Discord user ID to a learner record. Call this when a learner runs `/start`.

```bash
exec curl -s -X POST "$RUNTIME_API_URL/api/learners/upsert" \
  -H "Content-Type: application/json" \
  -d '{"discordUserId": "<discord_user_id>"}'
```

Response includes `learnerId` — store this for subsequent calls.

---

### 2. Start or Resume Session

Start a new session or resume an existing one for the learner in the given pillar. Requires the Discord channel ID from message metadata.

```bash
exec curl -s -X POST "$RUNTIME_API_URL/api/sessions/start-or-resume" \
  -H "Content-Type: application/json" \
  -d '{"learnerId": "<learner_id>", "pillar": "<pillar>", "channelId": "<discord_channel_id>"}'
```

`channelId` must be the Discord channel ID from `message.metadata.channelId`.

---

### 3. Get Current Node

Retrieve the learner's current node in a given pillar.

```bash
exec curl -s -X GET "$RUNTIME_API_URL/api/learners/<learner_id>/current-node?pillar=<pillar>"
```

---

### 4. Record Submission

Submit the learner's raw answer for a node.

```bash
exec curl -s -X POST "$RUNTIME_API_URL/api/submissions" \
  -H "Content-Type: application/json" \
  -d '{"learnerId": "<learner_id>", "sessionId": "<session_id>", "nodeId": "<node_id>", "rawAnswer": "<learner_answer>"}'
```

Response includes `submissionId` — store this to trigger evaluation.

---

### 5. Trigger Evaluation

Evaluate a recorded submission. This may take a moment — handle timeouts gracefully per degraded mode policy.

```bash
exec curl -s -X POST "$RUNTIME_API_URL/api/submissions/<submission_id>/evaluate"
```

Response includes evaluation result: pass/fail/remediation and per-slot scores.

---

### 6. Advance Node

Advance the learner to the next node after a passing evaluation.

```bash
exec curl -s -X POST "$RUNTIME_API_URL/api/nodes/advance" \
  -H "Content-Type: application/json" \
  -d '{"learnerId": "<learner_id>", "pillar": "<pillar>"}'
```

---

### 7. Schedule Review

Schedule a spaced-repetition review for a node the learner has passed.

```bash
exec curl -s -X POST "$RUNTIME_API_URL/api/reviews/schedule" \
  -H "Content-Type: application/json" \
  -d '{"learnerId": "<learner_id>", "nodeId": "<node_id>"}'
```

---

### 8. Get Learner Dashboard

Retrieve the full learner dashboard: current node, session state, pending reviews, and progress across pillars.

```bash
exec curl -s -X GET "$RUNTIME_API_URL/api/learners/<learner_id>/dashboard"
```

Use this at the start of every session and for heartbeat review reminder checks.

---

## Error Handling

- On non-2xx responses: log the error, do not silently proceed. Apply degraded mode policy from SOUL.md.
- On evaluation timeout: preserve the submission (it was already recorded in step 4), acknowledge to learner, and invite retry.
- On upsert failure: do not proceed with session start. Inform the learner the setup step failed and to try `/start` again.
