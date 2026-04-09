# edu-runtime-v1 Implementation Plan

## Context

Build a graph-driven educational runtime (TypeScript/ESM, hexagonal architecture) where a learner studies knowledge nodes via Discord, submits descriptive answers, receives pass/fail/remediation evaluation via vLLM, and progresses through a content graph. Specs 00-12 in `~/.omx/specs/edu-runtime-v1/` are frozen and authoritative.

## V1 Done Criteria

V1 is complete when all of the following are demonstrably true:

1. **End-to-end learning loop**: A learner can `/start agents` in Discord, study a node, `/task` to get an assessment, submit a descriptive answer, receive pass/fail/remediation feedback, and `/next` to advance -- all persisted across runtime restarts.
2. **Content loads from Obsidian**: At least 3 nodes per pillar with templates, loaded through `ContentRepository` abstraction (not direct file access from runtime).
3. **Evaluation works**: vLLM-based evaluation with 5-slot rubric (definition, importance, relation, example, boundary), deterministic guardrails, and degraded mode when vLLM is unavailable.
4. **State survives restart**: Postgres stores all learner state; restarting the runtime resumes the learner at their exact position.
5. **All 8 API endpoints operational**: Tested via integration tests against real Postgres (Testcontainers).
6. **All 7 Discord commands functional**: `/start`, `/status`, `/explain`, `/task`, `/next`, `/review`, `/help` -- routed through Runtime API, never direct DB access.
7. **Dockerized deployment**: `docker compose up` brings up the full stack (Postgres, vLLM, app) with health checks.
8. **V1 verification runbook passes**: All steps in the verification runbook execute successfully.

---

## Phase Breakdown (Inside-Out)

### Phase 1: Project Scaffold + Domain Core + Config + Logging

**Goal**: Establish the monorepo structure, TypeScript/ESM tooling, config management, structured logging, and pure domain entities with zero external dependencies (except pino for logging).

**Deliverables**:

| File/Module | Description |
|---|---|
| `package.json`, `tsconfig.json`, `vitest.config.ts` | ESM project config, path aliases, vitest setup |
| `src/config.ts` | Validated config object. Reads env vars: `DATABASE_URL` (required), `VLLM_URL` (required), `VAULT_PATH` (required), `DISCORD_TOKEN` (required), `DISCORD_GUILD_ID` (required), `LOG_LEVEL` (optional, default `info`), `PORT` (optional, default `3000`). Uses zod for schema validation. Fails fast with descriptive error on missing/invalid required vars. |
| `src/logger.ts` | Pino logger factory. JSON structured logs. Child logger creation for services/adapters. Fields: `service`, `requestId`, `learnerId` (when available). |
| `src/domain/content/KnowledgeNode.ts` | Entity: id, pillar, nodeType, title, summary, prerequisites[], related[], assessmentTemplateId, body, **masteryStageTarget**, **teacherPromptMode** |
| `src/domain/content/AssessmentTemplate.ts` | Entity: id, nodeId, instructions, requiredSlots[], rubric (pass/fail/remediation rules) |
| `src/domain/content/ContentRelation.ts` | Typed relation: prerequisite-of, related-to, example-of, implemented-by, compared-with |
| `src/domain/content/types.ts` | Pillar enum (agents, harnesses, openclaw), NodeType enum, RelationType enum |
| `src/domain/learner/Learner.ts` | Entity: id, discordUserId, currentPillar, currentSessionId |
| `src/domain/learner/LearnerSession.ts` | Entity with status FSM: active, paused, completed, abandoned. Fields: id, learnerId, **pillar**, **currentNodeId**, **channelId**, status, **metadata** (JSON blob for extensibility), startedAt, updatedAt |
| `src/domain/learner/NodeState.ts` | Entity with status FSM: unseen, studying, passed, remediation, mastered. MasteryLevel enum. Fields: id, learnerId, nodeId, status, masteryLevel, **attemptCount**, **lastScore**, **lastSubmissionId**, **nextReviewAt**, **passedAt**, updatedAt |
| `src/domain/learner/Submission.ts` | Entity: id, learnerId, sessionId, nodeId, templateId, rawAnswer, submittedAt |
| `src/domain/learner/SubmissionEvaluation.ts` | Entity: submissionId, result (pass/fail/remediation), score, rubricSlots, feedback, missingPoints[], **evaluatorModel** (string identifying which vLLM model produced this evaluation). Note: `confidence` is NOT persisted here -- it is transient, used only by guardrails post-processing in the evaluation adapter. |
| `src/domain/learner/ReviewJob.ts` | Entity: learnerId, nodeId, jobType (review/retry/reminder), status (pending/running/done/failed/cancelled), scheduledFor, payload. jobType and status are string literal unions for domain validation; Phase 3 adds DB check constraints. |
| `src/domain/learner/LearningEvent.ts` | Append-only event: type enum, learnerId, sessionId, nodeId, timestamp, payload |
| `src/domain/learner/state-machines.ts` | Pure functions: `transitionSession(current, event) -> next`, `transitionNodeState(current, event) -> next` with exhaustive validation |
| `src/domain/errors.ts` | Error code taxonomy: `LEARNER_NOT_FOUND`, `SESSION_NOT_FOUND`, `NODE_NOT_FOUND`, `TEMPLATE_NOT_FOUND`, `INVALID_TRANSITION`, `EVALUATION_UNAVAILABLE`, `CONTENT_VALIDATION_FAILED`, `SUBMISSION_DUPLICATE`, `REVIEW_JOB_CONFLICT`, `PILLAR_REQUIRED`, `UNAUTHORIZED`, `INTERNAL_ERROR`. Each has: code (string), httpStatus (number), retryable (boolean), messageTemplate (string). |

**Acceptance Criteria**:
- All entities are plain TypeScript classes/types with no framework imports (pino is allowed in logger only)
- `src/config.ts` validates all required env vars and throws a descriptive error listing ALL missing vars (not just the first one)
- Logger produces JSON output with `timestamp`, `level`, `service`, `msg` fields minimum
- State machine functions have 100% transition coverage in unit tests
- Invalid transitions throw typed errors using codes from `src/domain/errors.ts`
- KnowledgeNode includes `masteryStageTarget` and `teacherPromptMode` fields
- LearnerSession includes `pillar`, `currentNodeId`, `channelId`, `metadata` fields
- NodeState includes `attemptCount`, `lastScore`, `lastSubmissionId`, `nextReviewAt`, `passedAt` fields
- SubmissionEvaluation includes `evaluatorModel` field; does NOT include `confidence`
- ReviewJob `jobType` is typed as `'review' | 'retry' | 'reminder'`; `status` is typed as `'pending' | 'running' | 'done' | 'failed' | 'cancelled'`
- Error code taxonomy is defined and exported
- `npm run build` produces valid ESM output

**Dependencies**: None (this is the foundation).

---

### Phase 2: Ports (Interfaces)

**Goal**: Define the hexagonal port interfaces that the domain expects. Consolidated into 5 coarser interfaces (down from 7 repositories + 1 engine). No implementations yet.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/ports/ContentRepository.ts` | Interface: `getNodeById`, `getTemplateById`, `getTemplateByNodeId`, `listNodesByPillar`, `getPrerequisites`, `getRelatedNodes`, `validateContent`, `exportSnapshot` |
| `src/ports/LearnerStateStore.ts` | **Consolidated interface** covering learner + session + node-state operations: `upsertLearner`, `getLearnerById`, `getLearnerByDiscordId`, `createSession`, `getSession`, `getActiveSession`, `updateSessionStatus`, `getNodeState`, `upsertNodeState`, `getNodeStatesForLearner`, `getNodeStatesForSession` |
| `src/ports/SubmissionStore.ts` | **Consolidated interface** covering submission + evaluation: `createSubmission`, `getSubmission`, `getSubmissionsForNode`, `createEvaluation`, `getEvaluationForSubmission` |
| `src/ports/LearnerEventStore.ts` | **Consolidated interface** covering events + review jobs: `appendEvent`, `getEventsForLearner`, `getEventsForSession`, `createReviewJob`, `getPendingJobs`, `updateJobStatus` |
| `src/ports/EvaluationEngine.ts` | Interface: `evaluate(submission, node, template) -> EvaluationResult`, `isAvailable() -> boolean`. Kept separate because this is genuinely swappable (vLLM, OpenAI, mock, etc.) |

**Rationale for consolidation**: The original 7 fine-grained repository ports created unnecessary indirection. Learner/Session/NodeState are always queried together; Submission/Evaluation are always used together; Events/ReviewJobs are both append-oriented stores. This reduces constructor injection from 7+ dependencies to 3 stores + 1 engine per service, without losing testability (each store interface is still mockable).

**Acceptance Criteria**:
- Every port is a TypeScript interface (no classes)
- Port methods use domain types only (no Drizzle types, no Postgres types, no HTTP types)
- No implementation code in this phase
- 5 port interfaces total: `ContentRepository`, `LearnerStateStore`, `SubmissionStore`, `LearnerEventStore`, `EvaluationEngine`

**Dependencies**: Phase 1 (domain types).

---

### Phase 3: Adapters -- Database (Drizzle + Postgres)

**Goal**: Implement the 3 consolidated learner-state store ports against Postgres using Drizzle ORM.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/adapters/db/schema.ts` | Drizzle schema: 7 tables (learners, learner_sessions, node_states, submissions, submission_evaluations, review_jobs, learning_events). Includes DB check constraints: `review_jobs.job_type IN ('review', 'retry', 'reminder')`, `review_jobs.status IN ('pending', 'running', 'done', 'failed', 'cancelled')`. Includes `evaluator_model` column on submission_evaluations. LearnerSession schema includes `pillar`, `current_node_id`, `channel_id`, `metadata` columns. NodeState schema includes `attempt_count`, `last_score`, `last_submission_id`, `next_review_at`, `passed_at` columns. |
| `src/adapters/db/migrate.ts` | Migration runner using Drizzle Kit |
| `src/adapters/db/connection.ts` | Connection factory with pool config. Accepts logger instance for query logging. |
| `src/adapters/db/DrizzleLearnerStateStore.ts` | Implements `LearnerStateStore` (learner + session + node-state operations) |
| `src/adapters/db/DrizzleSubmissionStore.ts` | Implements `SubmissionStore` (submission + evaluation operations) |
| `src/adapters/db/DrizzleLearnerEventStore.ts` | Implements `LearnerEventStore` (events + review job operations) |
| `src/adapters/db/__tests__/*.test.ts` | Integration tests using Testcontainers (real Postgres) |

**Acceptance Criteria**:
- Schema enforces: unique (learner_id, node_id) on node_states, evaluation FK to submission, append-only learning_events
- DB check constraints enforce valid `jobType` and `status` values on review_jobs table
- `submission_evaluations` table has `evaluator_model` column (NOT NULL, text)
- `learner_sessions` table has `pillar`, `current_node_id`, `channel_id`, `metadata` columns
- `node_states` table has `attempt_count`, `last_score`, `last_submission_id`, `next_review_at`, `passed_at` columns
- All 3 store implementations pass integration tests against Testcontainers Postgres
- Migrations are idempotent and run on clean DB
- Schema does not assume single learner (multi-tenant safe)
- Each store constructor accepts a pino logger child instance

**Dependencies**: Phase 2 (port interfaces).

---

### Phase 4: Adapters -- Content (Obsidian) + Content Authoring

**Goal**: Implement `ContentRepository` port backed by Obsidian vault parsing, AND author the V1 content corpus.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/adapters/content/obsidian/ObsidianContentRepository.ts` | Parses vault directory, reads frontmatter + body, returns domain `KnowledgeNode` and `AssessmentTemplate` objects. Must populate `masteryStageTarget` and `teacherPromptMode` from frontmatter. |
| `src/adapters/content/obsidian/frontmatter-parser.ts` | YAML frontmatter extraction and validation |
| `src/adapters/content/obsidian/vault-scanner.ts` | Walks vault directories (agents/, harnesses/, openclaw/, templates/) |
| `src/adapters/content/obsidian/validators.ts` | Validates: unique ids, valid prereq refs, valid template refs, non-empty required slots, valid masteryStageTarget values, valid teacherPromptMode values |
| `src/adapters/content/obsidian/__tests__/*.test.ts` | Unit tests with fixture vault files |

**Content Authoring Deliverables** (tracked explicitly):

| Deliverable | Description |
|---|---|
| `vault/agents/` | 3-5 knowledge nodes for agents pillar with valid frontmatter |
| `vault/harnesses/` | 3-5 knowledge nodes for harnesses pillar with valid frontmatter |
| `vault/openclaw/` | 3-5 knowledge nodes for openclaw pillar with valid frontmatter |
| `vault/templates/` | 1 assessment template per node, with requiredSlots and rubric |
| Prerequisite chains | Each pillar has a valid linear prerequisite chain (node1 -> node2 -> node3 minimum) |
| Remediation paths | At least 1 node per pillar has a remediation path (node links to simpler prerequisite) |

**Acceptance Criteria**:
- `ObsidianContentRepository` implements `ContentRepository` interface exactly
- No runtime code outside this adapter imports Obsidian-specific parsing
- Validation catches: missing ids, broken prereq links, orphan templates, empty slot lists, missing masteryStageTarget, missing teacherPromptMode
- **Content authoring**: minimum 3 nodes per pillar (9 total), 1 template per node (9 total), valid prereq chains in each pillar, at least 1 remediation path per pillar
- Sample vault passes all validation rules from spec 03
- Constructor accepts a pino logger child instance

**Dependencies**: Phase 2 (port interfaces), Phase 1 (domain types). Content authoring can begin as soon as Phase 1 defines the entity shapes.

---

### Phase 5: Adapters -- Evaluation (vLLM)

**Goal**: Implement the evaluation engine port against vLLM's OpenAI-compatible HTTP API.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/adapters/evaluation/VllmEvaluationEngine.ts` | Implements EvaluationEngine port. Builds prompt, calls vLLM, parses structured JSON output, applies guardrails. Records `evaluatorModel` in result. |
| `src/adapters/evaluation/prompt-builder.ts` | Constructs evaluation prompt from node + template + submission + optional graph context |
| `src/adapters/evaluation/output-parser.ts` | Parses vLLM response into structured `{ result, score, rubricSlots, feedback, missingPoints, confidence }`. Note: `confidence` is parsed here but is transient -- used ONLY by guardrails, never persisted to SubmissionEvaluation. |
| `src/adapters/evaluation/guardrails.ts` | Deterministic post-processing: reject malformed output, cap pass when slots missing, fallback remediation on low confidence. Consumes `confidence` from parser output but strips it before returning final EvaluationResult. |
| `src/adapters/evaluation/degraded-mode.ts` | Returns `temporary-eval-unavailable` when vLLM unreachable, preserves submission |
| `src/adapters/evaluation/__tests__/*.test.ts` | Unit tests with mocked HTTP responses (pass, fail, remediation, malformed, timeout scenarios) |

**Acceptance Criteria**:
- Guardrails never allow pass when required slots are absent (regardless of LLM output)
- `confidence` is used by guardrails only and is NOT included in the returned EvaluationResult
- `evaluatorModel` is populated from vLLM response metadata (model name)
- Malformed vLLM responses trigger graceful degradation, not crashes
- Degraded mode preserves submission and returns retryable status
- Health check (`isAvailable()`) works
- Constructor accepts a pino logger child instance

**Dependencies**: Phase 2 (port interfaces).

---

### Phase 6: Domain Services (Application Layer)

**Goal**: Implement the core use cases that orchestrate ports and domain logic.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/services/LearnerService.ts` | `upsertLearner(discordUserId)`: idempotent create/update. **Emits**: `learner-created` event (on new), `learner-updated` event (on update). |
| `src/services/SessionService.ts` | `startOrResume(learnerId, pillar)`: creates or resumes session, resolves current node. Sets `pillar`, `currentNodeId`, `channelId` on session. **Emits**: `session-started` event (on new), `session-resumed` event (on existing). |
| `src/services/ContentService.ts` | `getCurrentNode(learnerId, pillar)`: resolves node via session -> nodeState -> content repo. Requires `pillar` parameter. **Emits**: none (read-only). |
| `src/services/SubmissionService.ts` | `recordSubmission(learnerId, sessionId, nodeId, rawAnswer)`: persists submission, increments `attemptCount` on NodeState. **Emits**: `submission-recorded` event. |
| `src/services/EvaluationService.ts` | `evaluateSubmission(submissionId)`: loads context, calls evaluation engine, persists result (including `evaluatorModel`), updates NodeState (`lastScore`, `lastSubmissionId`, `passedAt` on pass), triggers state transition. **Emits**: `evaluation-completed` event (on success), `evaluation-failed` event (on degraded mode). |
| `src/services/AdvancementService.ts` | `advanceNode(learnerId, pillar)`: determines next node from graph, transitions node state, updates session `currentNodeId`. **Emits**: `node-advanced` event, `pillar-completed` event (when no next node). |
| `src/services/ReviewService.ts` | `scheduleReview(learnerId, nodeId)`: creates review job, sets `nextReviewAt` on NodeState. **Emits**: `review-scheduled` event. |
| `src/services/DashboardService.ts` | `getDashboard(learnerId)`: aggregates node states, session history, pending reviews. **Emits**: none (read-only). |
| `src/services/__tests__/*.test.ts` | Unit tests with in-memory port stubs |

**LearningEvent Mapping** (which service method emits which event type):

| Service Method | Event Type(s) |
|---|---|
| `LearnerService.upsertLearner` | `learner-created` or `learner-updated` |
| `SessionService.startOrResume` | `session-started` or `session-resumed` |
| `SubmissionService.recordSubmission` | `submission-recorded` |
| `EvaluationService.evaluateSubmission` | `evaluation-completed` or `evaluation-failed` |
| `AdvancementService.advanceNode` | `node-advanced` or `pillar-completed` |
| `ReviewService.scheduleReview` | `review-scheduled` |

**Acceptance Criteria**:
- Services use only port interfaces (never concrete adapters)
- Services accept consolidated ports: `LearnerStateStore`, `SubmissionStore`, `LearnerEventStore`, `EvaluationEngine`, `ContentRepository`
- State transitions go through domain state machine functions
- Every mutation emits the appropriate LearningEvent as documented in the mapping table above
- EvaluationService handles degraded mode correctly (no state transition on unavailable)
- `ContentService.getCurrentNode` requires `pillar` parameter
- NodeState fields (`attemptCount`, `lastScore`, `lastSubmissionId`, `passedAt`, `nextReviewAt`) are updated by the correct services
- All services accept a pino logger child instance
- All services have unit tests with stubbed ports

**Dependencies**: Phases 1-2 (domain + ports). Does NOT require adapters -- uses stubs for testing.

---

### Phase 6.5: Integration Smoke Tests

**Goal**: Wire services to real adapters and verify 2-3 happy-path flows against Testcontainers before adding the API layer. Catches wiring and serialization bugs early.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/__integration__/smoke-start-study-submit.test.ts` | Happy path: upsert learner -> start session -> get current node -> record submission -> evaluate -> verify NodeState updated |
| `src/__integration__/smoke-advance-and-review.test.ts` | Happy path: pass a node -> advance to next -> schedule review -> verify review job created |
| `src/__integration__/smoke-degraded-eval.test.ts` | Degraded path: submit answer with vLLM unavailable -> verify submission persisted, evaluation NOT created, no state transition |

**Acceptance Criteria**:
- Tests use Testcontainers Postgres (real DB) and real `ObsidianContentRepository` (fixture vault)
- vLLM adapter is mocked (real HTTP calls are tested in Phase 5 unit tests)
- All 3 smoke tests pass
- Tests verify actual data in DB (not just service return values)
- Tests verify LearningEvents were emitted for each mutation

**Dependencies**: Phases 3, 4, 5, 6 (all adapters + services).

---

### Phase 7: Runtime API (Fastify) + Health Endpoint

**Goal**: Expose the 8 API endpoints + `/health` endpoint via Fastify, wiring services to HTTP.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/api/server.ts` | Fastify app factory with plugin registration, request-id generation, pino logger integration |
| `src/api/routes/health.ts` | `GET /health`: returns `{ status: 'ok' | 'degraded', postgres: boolean, vllm: boolean, contentValid: boolean }`. Used by Docker Compose readiness probes. |
| `src/api/routes/learners.ts` | `POST /api/learners/upsert` |
| `src/api/routes/sessions.ts` | `POST /api/sessions/start-or-resume` |
| `src/api/routes/nodes.ts` | `GET /api/learners/:learnerId/current-node?pillar=<pillar>` (pillar is required query param per spec 09), `POST /api/nodes/advance` |
| `src/api/routes/submissions.ts` | `POST /api/submissions`, `POST /api/submissions/:submissionId/evaluate` |
| `src/api/routes/reviews.ts` | `POST /api/reviews/schedule` |
| `src/api/routes/dashboard.ts` | `GET /api/learners/:learnerId/dashboard` |
| `src/api/error-handler.ts` | Structured error responses using error code taxonomy from `src/domain/errors.ts`: `{ code, message, retryable, details? }`. Maps domain error codes to HTTP status codes. |
| `src/api/schemas/` | Fastify JSON schema validators for request/response. `current-node` schema requires `pillar` query parameter. |
| `src/api/__tests__/*.test.ts` | Integration tests: Fastify inject + Testcontainers Postgres + stubbed vLLM |
| `src/composition-root.ts` | DI wiring: creates config, logger, concrete adapters (3 stores + content repo + eval engine), injects into services, registers routes |
| `src/main.ts` | Entry point: loads config (fail-fast on invalid), startup checks (Postgres reachable, content valid, vLLM status), then listen |

**Error Code Taxonomy** (defined in Phase 1, used here):

| Error Code | HTTP Status | Retryable | When |
|---|---|---|---|
| `LEARNER_NOT_FOUND` | 404 | false | Learner ID does not exist |
| `SESSION_NOT_FOUND` | 404 | false | Session ID does not exist |
| `NODE_NOT_FOUND` | 404 | false | Node ID not in content |
| `TEMPLATE_NOT_FOUND` | 404 | false | Assessment template missing for node |
| `INVALID_TRANSITION` | 409 | false | State machine rejects transition |
| `EVALUATION_UNAVAILABLE` | 503 | true | vLLM unreachable |
| `CONTENT_VALIDATION_FAILED` | 500 | false | Content repo validation failed |
| `SUBMISSION_DUPLICATE` | 409 | false | Duplicate submission detected |
| `REVIEW_JOB_CONFLICT` | 409 | false | Review job already exists |
| `PILLAR_REQUIRED` | 400 | false | Missing `pillar` query param on current-node |
| `UNAUTHORIZED` | 401 | false | Invalid or missing auth |
| `INTERNAL_ERROR` | 500 | true | Unexpected error |

**Acceptance Criteria**:
- All 8 endpoints match spec 09 contracts exactly
- `/health` returns structured status with component checks
- `GET /api/learners/:learnerId/current-node` requires `?pillar=` query parameter; returns `PILLAR_REQUIRED` error without it
- Error responses use error codes from the taxonomy and follow `{ code, message, retryable, details? }` format
- JSON only, no endpoint exposes vault paths or DB internals
- Startup fails loudly if Postgres unreachable or content validation fails
- Startup warns but continues if vLLM unreachable (degraded mode)
- Fastify uses pino logger (same instance as rest of app)
- Integration tests cover happy path + error cases for each endpoint

**Dependencies**: Phase 6 (services), Phase 3 (DB adapter for integration tests).

---

### Phase 7.5: Docker Compose

**Goal**: Containerize the application and provide a single-command deployment for V1.

**Deliverables**:

| File/Module | Description |
|---|---|
| `Dockerfile` | Multi-stage build: install deps -> build TypeScript -> production image (node:20-slim). Copies built JS + vault. |
| `docker-compose.yml` | Services: `postgres` (postgres:16, port 5432, named volume for data), `app` (built from Dockerfile, depends_on postgres healthy, env vars from `.env`, vault volume mount at `/app/vault`). Optional `vllm` service (commented out with instructions, since vLLM typically runs on GPU host). |
| `.env.example` | Template with all required env vars from `src/config.ts` |
| `docker-compose.override.yml` | Dev overrides: bind-mount source for hot reload, expose debug port |

**Acceptance Criteria**:
- `docker compose up` starts Postgres + app successfully
- App container waits for Postgres readiness (healthcheck + depends_on)
- App container uses `/health` endpoint as its own healthcheck
- Vault is mounted as a volume (not baked into image) so content can be updated without rebuild
- `.env.example` documents every env var with descriptions
- `docker compose down -v` cleanly removes everything
- Migrations run automatically on app startup

**Dependencies**: Phase 7 (API must be complete).

---

### Phase 8: Discord Integration (Discord.js)

**Goal**: Wire Discord commands to Runtime API using Discord.js directly. This is the thinnest possible layer.

**Deliverables**:

| File/Module | Description |
|---|---|
| `src/discord/client.ts` | Discord.js `Client` setup with `GatewayIntentBits.Guilds`, `GatewayIntentBits.GuildMessages`, `GatewayIntentBits.MessageContent`. Login using `DISCORD_TOKEN` from config. |
| `src/discord/register-commands.ts` | Uses `SlashCommandBuilder` + `REST.put(Routes.applicationGuildCommands(...))` to register all 7 slash commands with `DISCORD_GUILD_ID`. Run as standalone script or on bot startup. |
| `src/discord/interaction-handler.ts` | `client.on('interactionCreate')` dispatcher. Routes `ChatInputCommandInteraction` to the correct command handler. |
| `src/discord/commands/start.ts` | `/start <pillar>`: calls upsert learner + start-or-resume session, creates/finds study channel |
| `src/discord/commands/status.ts` | `/status`: calls dashboard endpoint |
| `src/discord/commands/explain.ts` | `/explain`: fetches current node, formats explanation |
| `src/discord/commands/task.ts` | `/task`: fetches template, issues assessment prompt |
| `src/discord/commands/next.ts` | `/next`: calls advance endpoint |
| `src/discord/commands/review.ts` | `/review`: calls review schedule endpoint |
| `src/discord/commands/help.ts` | `/help`: static help text |
| `src/discord/message-handler.ts` | `client.on('messageCreate')` listener. Detects free-text submissions in study channels, routes to submission endpoint |
| `src/discord/formatter.ts` | Formats API responses into Discord-friendly messages (teacher tone, length budget, next steps) |
| `src/discord/channel-manager.ts` | Creates/finds `{pillar}-study-{learner}` channels using Discord.js guild channel API |

**Acceptance Criteria**:
- Discord bot uses Discord.js `Client` directly (no OpenClaw, no plugin abstraction)
- Slash commands are registered via `SlashCommandBuilder` with proper option types (e.g., `pillar` is a required string choice option on `/start`)
- Bot calls Runtime API only (never imports services or repositories directly)
- Every response includes 1-3 actionable next steps (no dead-end messages)
- Failure messages are constructive and include retry guidance
- Channel naming follows `{pillar}-study-{learner}` pattern
- Free-text messages in study channels are captured as submissions
- Bot logs all interactions via pino logger

**Dependencies**: Phase 7 (API must be running).

---

### Phase 9: V1 Verification Runbook

**Goal**: Concrete steps to demonstrate V1 works end-to-end.

**Deliverables**:

| File/Module | Description |
|---|---|
| `docs/v1-verification-runbook.md` | Step-by-step verification procedure |

**Verification Steps**:

1. **Environment setup**: `cp .env.example .env`, fill in values, `docker compose up -d`
2. **Health check**: `curl http://localhost:3000/health` returns `{ status: 'ok', postgres: true, vllm: true, contentValid: true }`
3. **Discord bot online**: Bot appears online in guild
4. **Start learning**: User runs `/start agents` in Discord -> bot creates study channel, responds with first node explanation
5. **Get assessment**: User runs `/task` -> bot presents assessment prompt
6. **Submit answer**: User types free-text answer in study channel -> bot acknowledges submission
7. **Receive evaluation**: Bot returns pass/fail/remediation feedback with score and slot breakdown
8. **Advance**: User runs `/next` -> bot presents next node (if passed) or remediation guidance (if failed)
9. **Check dashboard**: User runs `/status` -> bot shows progress across nodes
10. **State persistence**: `docker compose restart app` -> user runs `/status` -> same progress shown
11. **Degraded mode**: Stop vLLM -> submit answer -> bot returns "evaluation temporarily unavailable" -> restart vLLM -> re-evaluate succeeds
12. **Review scheduling**: User runs `/review` -> review job created (visible in dashboard)

**Acceptance Criteria**:
- All 12 steps documented with expected outputs
- Each step includes "what to check" and "what failure looks like"
- Runbook is executable by someone with no prior context

**Dependencies**: All previous phases complete.

---

## Dependency Graph

```
Phase 1 (Domain+Config+Logging) ──> Phase 2 (Ports) ──┬──> Phase 3 (DB Adapters)
                                                        ├──> Phase 4 (Content + Authoring)
                                                        ├──> Phase 5 (Eval Adapter)
                                                        └──> Phase 6 (Services) ──> Phase 6.5 (Smoke Tests)
                                                                                        │
                                                                                        v
                                                                                  Phase 7 (API+Health)
                                                                                        │
                                                                                        v
                                                                                  Phase 7.5 (Docker)
                                                                                        │
                                                                                        v
                                                                                  Phase 8 (Discord.js)
                                                                                        │
                                                                                        v
                                                                                  Phase 9 (Verification)
```

Phases 3, 4, 5 can run in parallel after Phase 2.
Phase 6 can start as soon as Phase 2 is done (uses stubs), but integration tests need Phase 3.
Phase 6.5 needs Phases 3, 4, 5, 6.
Phase 7 needs Phase 6 + Phase 3.
Phase 7.5 needs Phase 7.
Phase 8 needs Phase 7.
Phase 9 needs all previous phases.

---

## Risk Areas

### 1. vLLM Structured Output Reliability (MEDIUM)
vLLM must return parseable JSON matching the evaluation contract. Different models may produce inconsistent structured output. **Mitigation**: Guardrails layer (Phase 5) treats LLM output as untrusted; deterministic rules override LLM decisions when slots are missing. `evaluatorModel` is tracked per evaluation for debugging.

### 2. Content Bootstrapping (MEDIUM)
V1 needs 9-15 real knowledge nodes with valid templates and prerequisite chains. If content is incomplete or structurally invalid, nothing downstream works. **Mitigation**: Phase 4 explicitly tracks content authoring with acceptance criteria (3-5 nodes per pillar, 1 template per node, valid prereq chains, valid remediation paths). Content authoring can start in parallel with Phases 1-3.

### 3. Drizzle + ESM Compatibility (LOW-MEDIUM)
Drizzle ORM with pure ESM and Vitest can have configuration friction. **Mitigation**: Resolve in Phase 1 scaffold; validate with a minimal Drizzle + Testcontainers test before proceeding.

### 4. State Machine Complexity (LOW)
Session and NodeState FSMs have multiple valid transitions including loops (remediation -> studying -> remediation). Edge cases in concurrent transitions could corrupt state. **Mitigation**: Phase 1 encodes all transitions as pure functions with exhaustive tests; Phase 3 uses DB-level constraints as safety net.

### 5. Discord.js Bot Permissions (LOW)
Bot needs permissions to create channels, manage messages, and register slash commands. **Mitigation**: Document required bot permissions and OAuth2 scopes in `.env.example`. Phase 8 validates permissions on startup.

---

## RALPLAN-DR Summary

### Principles (5)

1. **Inside-out construction**: Build domain first, then ports, then adapters, then composition. Never let infrastructure leak into domain.
2. **Port purity**: Domain services depend only on interfaces. Concrete adapters are injected at composition root. Ports are consolidated into coarser interfaces (3 stores + 1 engine + 1 content repo) to reduce indirection without losing testability.
3. **Content-backend independence**: Runtime never imports Obsidian-specific code. ContentRepository is the only content contract.
4. **Append-only auditability**: Every state mutation emits a LearningEvent (see service-event mapping table in Phase 6). Submissions are recorded before evaluation. Evaluations are immutable once persisted.
5. **Graceful degradation**: vLLM failure never corrupts learner state. System preserves submissions and signals retry capability. `/health` endpoint reports component status for orchestration.

### Decision Drivers (Top 3)

1. **Spec fidelity**: 13 frozen specs define exact entities, transitions, endpoints, and invariants. The plan must implement these precisely, not reinterpret them. All domain fields from spec 01 are accounted for.
2. **Testability at each layer**: Every phase must be independently testable. Domain uses unit tests, adapters use integration tests (Testcontainers), services use stubs, Phase 6.5 smoke tests wire everything together before the API layer.
3. **Parallelizability**: Multiple developers (or executor agents) should be able to work on adapters simultaneously after the ports are defined.

### Viable Options

#### Option A: Monolith with Hexagonal Layers (RECOMMENDED)

Single TypeScript package with clear directory boundaries for domain/ports/adapters/services/api/discord.

**Pros**:
- Simplest dependency management and build configuration
- Single deployment artifact (Docker image)
- Easiest to test end-to-end
- Matches V1 scale (single-user / low-scale multi-user)

**Cons**:
- All code in one package could tempt shortcut imports across boundaries
- Harder to extract modules later if V2 needs separate deployables

#### Option B: Multi-Package Monorepo (pnpm workspaces)

Separate packages: `@edu/domain`, `@edu/ports`, `@edu/adapters-db`, `@edu/adapters-content`, `@edu/adapters-eval`, `@edu/services`, `@edu/api`, `@edu/discord`.

**Pros**:
- Compiler-enforced boundary isolation (package B cannot import package A's internals)
- Cleaner dependency graph visible in package.json
- Easier to extract into separate deployables later

**Cons**:
- Significant setup overhead for V1 (workspace config, shared tsconfig, cross-package test orchestration)
- 8 packages for a V1 MVP is over-engineered
- Slower iteration during initial development
- TypeScript project references add build complexity

#### Why Option A is Recommended

V1 is explicitly scoped as a proof-of-learning-loop MVP. The hexagonal directory structure provides sufficient boundary discipline through convention (enforced by lint rules if needed), and the overhead of multi-package management is not justified until V2 scaling concerns materialize. Option B's compiler-enforced isolation is a real benefit, but at V1 scale it trades development speed for a problem that doesn't exist yet.

### ADR

**Decision**: Single-package hexagonal monolith with directory-based boundaries, Discord.js for bot integration, consolidated ports (3 stores + 1 engine + 1 content repo).

**Drivers**: V1 is MVP-scoped; spec fidelity is more important than package-level isolation; inside-out build order naturally enforces dependency direction; Discord.js is the standard, well-documented Discord bot library with no external framework dependency.

**Alternatives Considered**:
- Multi-package monorepo (Option B) -- rejected for V1 due to setup overhead disproportionate to scale.
- OpenClaw plugin for Discord -- rejected because OpenClaw plugin API is undocumented and adds an unnecessary abstraction layer. Discord.js is the standard approach.
- 7 fine-grained repository ports -- consolidated to 3 coarser store interfaces to reduce constructor injection complexity while maintaining testability.

**Why Chosen**: Fastest path to a working learning loop while maintaining clean architecture through directory conventions and port interfaces. Discord.js is mature, well-documented, and eliminates the OpenClaw dependency risk entirely. Consolidated ports reduce boilerplate without sacrificing mockability.

**Consequences**: Developers must exercise discipline not to shortcut-import across layers. A lint rule (`no-restricted-imports` or `eslint-plugin-boundaries`) should be added in Phase 1 to enforce this. Discord.js is a direct dependency that must be kept up to date.

**Follow-ups**: Evaluate package extraction after V1 ships if team size grows or separate deployment becomes necessary. Evaluate whether a bot framework (like Sapphire) adds value for V2 if command complexity grows.
