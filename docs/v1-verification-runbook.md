# V1 Verification Runbook

This runbook verifies the edu-runtime-v1 end-to-end learning loop. Execute each step in order. All 12 steps must pass before claiming V1 is complete.

**Prerequisites**: Docker, Docker Compose, a Discord bot token and guild ID.

---

## Step 1: Environment Setup

**What to do:**
```bash
cp .env.example .env
# Edit .env and fill in:
#   DISCORD_TOKEN=<your bot token from Discord Developer Portal>
#   DISCORD_GUILD_ID=<your guild/server ID>
# Leave DATABASE_URL, VAULT_PATH, VLLM_URL, LOG_LEVEL, PORT as-is for local Docker Compose

docker compose up -d
docker compose logs -f app
```

**Expected output:**
- `docker compose up -d` exits with no errors
- App logs show: `{"level":"info","msg":"Server listening","port":3000}`
- App logs show migrations applied (or "already up to date")
- No `ERROR` or `FATAL` lines in startup logs

**What failure looks like:**
- `Error: Missing required environment variable: DISCORD_TOKEN` — fill in `.env`
- `ECONNREFUSED` connecting to postgres — postgres container not healthy yet; wait 15s and retry
- `Cannot find module` — image build failed; run `docker compose build` and check TypeScript errors

---

## Step 2: Health Check

**What to do:**
```bash
curl -s http://localhost:3000/health | jq .
```

**Expected output:**
```json
{
  "status": "ok",
  "postgres": true,
  "vllm": false,
  "contentValid": true
}
```
(`vllm: false` is expected unless a GPU host running vLLM is configured. The system operates in degraded eval mode without it.)

**What failure looks like:**
- `Connection refused` — app container not started; check `docker compose ps` and `docker compose logs app`
- `"postgres": false` — DB connectivity issue; check postgres container health with `docker compose ps`
- `"contentValid": false` — vault parsing failed; check `docker compose logs app` for content validation errors
- `"status": "degraded"` with `"postgres": false` — critical failure, app cannot serve requests

---

## Step 3: Discord Bot Online

**What to do:**
1. Open your Discord server (guild)
2. Check the member list or bot section

**Expected output:**
- The bot appears with a green "Online" indicator
- Bot user shows as a member of the guild

**What failure looks like:**
- Bot appears offline — check `docker compose logs app` for `DISCORD_TOKEN invalid` or WebSocket disconnect errors
- Bot not in guild — ensure `DISCORD_GUILD_ID` is correct and the bot has been invited with `bot` and `applications.commands` OAuth2 scopes

---

## Step 4: Start Learning — /start

**What to do:**
In any Discord channel in the guild:
```
/start agents
```

**Expected output:**
- Bot replies with a confirmation message
- Bot creates a channel named `agents-study-<your-username>` (or finds the existing one)
- Bot sends the first knowledge node explanation in the study channel (node title, summary, key concepts)
- Bot prompts you to use `/task` when ready for assessment

**What failure looks like:**
- `Unknown interaction` — slash commands not registered; check `docker compose logs app` for registration errors on startup
- Bot replies with an error — check `docker compose logs app` for stack traces; likely a DB or content repo error
- No study channel created — check bot has `Manage Channels` permission in the guild
- No node explanation — `getCurrentNode` failed; check vault has content for the `agents` pillar

---

## Step 5: Get Assessment — /task

**What to do:**
In the study channel created in Step 4:
```
/task
```

**Expected output:**
- Bot replies with the assessment template for the current node
- Message includes assessment instructions, what to cover, any specific requirements
- Bot prompts you to type your answer as a free-text message in this channel

**What failure looks like:**
- `TEMPLATE_NOT_FOUND` — the current node has no assessment template in the vault; add a template file
- Bot replies "No active session" — run `/start agents` again
- Empty or malformed message — check `docker compose logs app` for formatter errors

---

## Step 6: Submit Answer

**What to do:**
In the study channel, type a free-text answer (not a slash command):
```
Claude agents are autonomous AI systems that can use tools, maintain context, and complete
multi-step tasks. They are important because they extend LLM capabilities beyond single-turn
responses. They relate to harnesses by being orchestrated through them. An example is a coding
agent that reads files, writes code, and runs tests. The boundary is that agents still require
human oversight for consequential decisions.
```

**Expected output:**
- Bot acknowledges the submission: e.g., "Answer received. Evaluating..." or similar
- If vLLM is available: evaluation begins immediately
- If vLLM is unavailable (degraded mode): bot responds with "evaluation temporarily unavailable, your answer has been saved"

**What failure looks like:**
- Message is ignored — message handler not detecting study channel context; check `docker compose logs app` for `messageCreate` events
- `SUBMISSION_DUPLICATE` error — same answer already submitted; expected if you submit twice
- Bot crashes on receipt — check logs for unhandled promise rejection in `message-handler.ts`

---

## Step 7: Receive Evaluation Feedback

**What to do:**
Wait for the bot to respond after submission (5-30 seconds if vLLM is available).

For degraded mode testing (no vLLM), skip to Step 11 and return here after.

**Expected output (pass):**
```
Result: PASS (score: 4/5)

Slot breakdown:
  definition: covered
  importance: covered
  relation: covered
  example: covered
  boundary: partial

Feedback: Good answer! Your boundary definition could be more specific...

Next steps: Run /next to advance to the next node.
```

**Expected output (fail/remediation):**
```
Result: REMEDIATION (score: 2/5)

Missing: definition, example

Feedback: Your answer didn't clearly define what an agent is...

Next steps: Review the node explanation and try again.
```

**What failure looks like:**
- No response after 60 seconds with vLLM running — check `docker compose logs app` for vLLM timeout errors; verify `VLLM_URL` is reachable from the app container
- `EVALUATION_UNAVAILABLE` in logs when vLLM should be up — check vLLM container health
- Malformed evaluation (missing slots) — guardrails should catch this; check logs for guardrails warnings

---

## Step 8: Advance — /next

**What to do:**
After receiving a PASS evaluation in Step 7:
```
/next
```

**Expected output (more nodes available):**
- Bot replies with the next knowledge node explanation
- Node is different from the previous one
- Bot confirms advancement: e.g., "Moving to: [Node Title]"

**Expected output (pillar complete):**
- Bot replies: "You've completed the agents pillar! Run `/start harnesses` to begin the next pillar."

**What failure looks like:**
- `INVALID_TRANSITION` — node state is not `passed`; must pass evaluation before advancing
- Bot says "no next node" but pillar has more nodes — prerequisite chain in vault is broken; check vault frontmatter for valid `prerequisites` links
- Bot advances but shows same node — `AdvancementService` bug; check `docker compose logs app`

---

## Step 9: Check Dashboard — /status

**What to do:**
```
/status
```

**Expected output:**
```
Learning Progress — agents pillar

  node-agents-001: PASSED (score: 4/5, attempts: 1)
  node-agents-002: STUDYING (current)
  node-agents-003: UNSEEN

Sessions: 1 active
Pending reviews: 0
```
(Exact node IDs and counts depend on vault content.)

**What failure looks like:**
- Empty dashboard — `DashboardService` aggregation failed; check logs
- Wrong current node shown — session `currentNodeId` not updated after `/next`; check `AdvancementService` logs

---

## Step 10: State Persistence — Restart Test

**What to do:**
```bash
docker compose restart app
# Wait 15 seconds for app to become healthy
curl -s http://localhost:3000/health | jq .status
```
Then in Discord:
```
/status
```

**Expected output:**
- Health check returns `"ok"`
- `/status` shows the same progress as before the restart
- Current node is the same node you were on before restart

**What failure looks like:**
- Progress is gone after restart — state not persisted in Postgres; check that DB writes are committed (not just in-memory)
- `"postgres": false` after restart — DB connection pool not re-established; check connection retry logic in `connection.ts`
- Different current node after restart — session `currentNodeId` not correctly persisted; check `DrizzleLearnerStateStore`

---

## Step 11: Degraded Mode — vLLM Unavailable

**What to do:**
Simulate vLLM being unreachable by editing `.env`:
```bash
# In .env, change VLLM_URL to an unreachable address:
VLLM_URL=http://localhost:19999
docker compose restart app
```

Then submit a free-text answer in the study channel.

**Expected output:**
- Bot responds: "Evaluation is temporarily unavailable. Your answer has been saved and will be evaluated when the service is restored."
- Health check shows: `{"status": "degraded", "vllm": false, ...}`
- No state transition occurs (node stays in `studying` status)
- Submission IS persisted in the database

Verify submission was saved:
```bash
docker compose exec postgres psql -U postgres -d edu_runtime \
  -c "SELECT id, node_id, submitted_at FROM submissions ORDER BY submitted_at DESC LIMIT 5;"
```

**Expected output:** Row appears for your recent submission.

Restore vLLM and re-evaluate:
```bash
# Restore VLLM_URL in .env, then:
docker compose restart app
# Submit the answer again in Discord
```

**Expected output:** Bot evaluates and returns pass/fail/remediation feedback.

**What failure looks like:**
- App crashes when vLLM unreachable — `degraded-mode.ts` not handling connection errors; check logs
- Submission not saved — `SubmissionStore` write failed before evaluation; check DB logs
- State transition occurs even in degraded mode — `EvaluationService` not checking `isAvailable()`

---

## Step 12: Review Scheduling — /review

**What to do:**
```
/review
```

**Expected output:**
- Bot confirms review scheduled: e.g., "Review scheduled for [node title]."
- `/status` shows `Pending reviews: 1`

Verify in DB:
```bash
docker compose exec postgres psql -U postgres -d edu_runtime \
  -c "SELECT learner_id, node_id, job_type, status, scheduled_for FROM review_jobs ORDER BY scheduled_for DESC LIMIT 5;"
```

**Expected output:** Row with `job_type = 'review'` and `status = 'pending'`.

**What failure looks like:**
- `REVIEW_JOB_CONFLICT` — a review is already scheduled for this node; this is correct behavior (idempotent)
- Review not appearing in `/status` — `DashboardService` not including pending review jobs
- DB row not created — `LearnerEventStore.createReviewJob` failed; check logs

---

## Full Stack Teardown

When verification is complete:
```bash
docker compose down -v
```

**Expected output:**
- All containers stopped and removed
- Named volume `pgdata` removed
- No orphan containers or volumes

---

## Summary Checklist

| Step | Description | Pass |
|------|-------------|------|
| 1 | `docker compose up -d` — stack starts cleanly | [ ] |
| 2 | `/health` returns `ok` with postgres + contentValid | [ ] |
| 3 | Bot appears online in Discord | [ ] |
| 4 | `/start agents` — study channel created, first node explained | [ ] |
| 5 | `/task` — assessment template presented | [ ] |
| 6 | Free-text submission acknowledged | [ ] |
| 7 | Evaluation feedback received (pass/fail/remediation) | [ ] |
| 8 | `/next` — advances to next node or completes pillar | [ ] |
| 9 | `/status` — shows correct progress dashboard | [ ] |
| 10 | Restart test — progress survives `docker compose restart app` | [ ] |
| 11 | Degraded mode — graceful "unavailable" with submission persisted | [ ] |
| 12 | `/review` — review job created and visible in dashboard | [ ] |
