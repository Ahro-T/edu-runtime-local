/**
 * Smoke test 3: submit with vLLM down -> verify submission persisted, no state transition
 *
 * Uses real Postgres (Testcontainers) + real ObsidianContentRepository + mocked vLLM (unavailable).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../adapters/db/schema.js';
import { DrizzleLearnerStateStore } from '../adapters/db/DrizzleLearnerStateStore.js';
import { DrizzleSubmissionStore } from '../adapters/db/DrizzleSubmissionStore.js';
import { DrizzleLearnerEventStore } from '../adapters/db/DrizzleLearnerEventStore.js';
import { ObsidianContentRepository } from '../adapters/content/obsidian/ObsidianContentRepository.js';
import type { EvaluationEngine } from '../ports/EvaluationEngine.js';
import { LearnerService } from '../services/LearnerService.js';
import { SessionService } from '../services/SessionService.js';
import { SubmissionService } from '../services/SubmissionService.js';
import { EvaluationService } from '../services/EvaluationService.js';
import { createLogger } from '../logger.js';
import { AppError } from '../domain/errors.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT_PATH = path.resolve(__dirname, '../../vault');

let container: StartedPostgreSqlContainer;
let pool: pg.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

const logger = createLogger('smoke-test-3');

async function createSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS learners (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL UNIQUE,
      current_pillar TEXT,
      current_session_id TEXT
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS learner_sessions (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      status TEXT NOT NULL,
      pillar TEXT NOT NULL,
      current_node_id TEXT,
      channel_id TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS node_states (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      node_id TEXT NOT NULL,
      status TEXT NOT NULL,
      mastery_level TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_score REAL,
      last_submission_id TEXT,
      next_review_at TIMESTAMPTZ,
      passed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (learner_id, node_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      session_id TEXT NOT NULL REFERENCES learner_sessions(id),
      node_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      raw_answer TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS submission_evaluations (
      submission_id TEXT PRIMARY KEY REFERENCES submissions(id),
      evaluator_model TEXT NOT NULL,
      result TEXT NOT NULL,
      score REAL NOT NULL,
      rubric_slots JSONB NOT NULL DEFAULT '[]',
      feedback TEXT NOT NULL,
      missing_points JSONB NOT NULL DEFAULT '[]'
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS review_jobs (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      node_id TEXT NOT NULL,
      job_type TEXT NOT NULL CHECK (job_type IN ('review', 'retry', 'reminder')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed', 'cancelled')),
      scheduled_for TIMESTAMPTZ NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS learning_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      session_id TEXT NOT NULL,
      node_id TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payload JSONB NOT NULL DEFAULT '{}'
    )
  `);
}

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  pool = new pg.Pool({ connectionString: container.getConnectionUri() });
  db = drizzle(pool, { schema });
  await createSchema();
}, 90000);

afterAll(async () => {
  await pool.end();
  await container.stop();
}, 30000);

describe('Smoke: degraded mode — vLLM down', () => {
  it('persists submission but does not transition NodeState when vLLM is unavailable', async () => {
    // --- Wire up stores ---
    const stateStore = new DrizzleLearnerStateStore(db as any, logger);
    const submissionStore = new DrizzleSubmissionStore(db as any, logger);
    const eventStore = new DrizzleLearnerEventStore(db as any, logger);
    const contentRepo = new ObsidianContentRepository(VAULT_PATH, logger);

    // vLLM is DOWN
    const unavailableEngine: EvaluationEngine = {
      evaluate: vi.fn(async () => { throw new Error('Connection refused'); }),
      isAvailable: vi.fn(async () => false),
    };

    // --- Wire services ---
    const learnerService = new LearnerService({ learnerStateStore: stateStore, learnerEventStore: eventStore, logger });
    const sessionService = new SessionService({ learnerStateStore: stateStore, learnerEventStore: eventStore, contentRepository: contentRepo, logger });
    const submissionService = new SubmissionService({ learnerStateStore: stateStore, learnerEventStore: eventStore, submissionStore, contentRepository: contentRepo, logger });
    const evaluationService = new EvaluationService({ learnerStateStore: stateStore, learnerEventStore: eventStore, submissionStore, contentRepository: contentRepo, evaluationEngine: unavailableEngine, logger });

    // 1. Setup learner + session
    const learner = await learnerService.upsertLearner('discord-smoke-3');
    const session = await sessionService.startOrResume(learner.id, 'agents', 'channel-smoke-3');
    const nodeId = session.currentNodeId!;

    // 2. Record submission — should succeed even with vLLM down
    const submission = await submissionService.recordSubmission(
      learner.id, session.id, nodeId,
      'My answer about the agent core loop.',
    );
    expect(submission.id).toBeTruthy();

    // 3. Verify submission is persisted in DB
    const persisted = await submissionStore.getSubmission(submission.id);
    expect(persisted).not.toBeNull();
    expect(persisted!.rawAnswer).toBe('My answer about the agent core loop.');

    // 4. NodeState before evaluation attempt
    const nodeStateBefore = await stateStore.getNodeState(learner.id, nodeId);
    expect(nodeStateBefore).not.toBeNull();
    const statusBefore = nodeStateBefore!.status;

    // 5. Attempt evaluation — should throw EVALUATION_UNAVAILABLE
    let evalError: AppError | null = null;
    try {
      await evaluationService.evaluateSubmission(submission.id);
    } catch (err) {
      evalError = err as AppError;
    }
    expect(evalError).not.toBeNull();
    expect(evalError!.code).toBe('EVALUATION_UNAVAILABLE');
    expect(evalError!.retryable).toBe(true);

    // 6. NodeState must NOT have changed (no state transition on degraded eval)
    const nodeStateAfter = await stateStore.getNodeState(learner.id, nodeId);
    expect(nodeStateAfter!.status).toBe(statusBefore);
    expect(nodeStateAfter!.passedAt).toBeNull();

    // 7. No evaluation record should be persisted
    const evalRecord = await submissionStore.getEvaluationForSubmission(submission.id);
    expect(evalRecord).toBeNull();
  }, 90000);
});
