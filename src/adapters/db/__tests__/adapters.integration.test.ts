import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from '../schema.js';
import { DrizzleLearnerStateStore } from '../DrizzleLearnerStateStore.js';
import { DrizzleSubmissionStore } from '../DrizzleSubmissionStore.js';
import { DrizzleLearnerEventStore } from '../DrizzleLearnerEventStore.js';
import { createLogger } from '../../../logger.js';
import type { Learner } from '../../../domain/learner/Learner.js';
import type { NodeState } from '../../../domain/learner/NodeState.js';
import type { Submission } from '../../../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../../../domain/learner/SubmissionEvaluation.js';
import type { ReviewJob } from '../../../domain/learner/ReviewJob.js';
import type { LearningEvent } from '../../../domain/learner/LearningEvent.js';

let container: StartedPostgreSqlContainer;
let pool: pg.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

const logger = createLogger('test');

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
      session_id TEXT NOT NULL REFERENCES learner_sessions(id),
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
}, 60000);

afterAll(async () => {
  await pool.end();
  await container.stop();
}, 30000);

// ---- LearnerStateStore tests ----

describe('DrizzleLearnerStateStore', () => {
  let store: DrizzleLearnerStateStore;

  beforeAll(() => {
    store = new DrizzleLearnerStateStore(db as any, logger);
  });

  const learner: Learner = {
    id: 'learner-1',
    discordUserId: 'discord-111',
    currentPillar: 'agents',
    currentSessionId: null,
  };

  it('upserts and retrieves a learner by id', async () => {
    const result = await store.upsertLearner(learner);
    expect(result.id).toBe('learner-1');
    expect(result.discordUserId).toBe('discord-111');
    expect(result.currentPillar).toBe('agents');
  });

  it('retrieves learner by discord user id', async () => {
    const result = await store.getLearnerByDiscordId('discord-111');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('learner-1');
  });

  it('returns null for unknown learner', async () => {
    const result = await store.getLearnerById('no-such-learner');
    expect(result).toBeNull();
  });

  it('creates a session', async () => {
    const session = await store.createSession({
      id: 'session-1',
      learnerId: 'learner-1',
      pillar: 'agents',
      channelId: 'channel-abc',
    });
    expect(session.id).toBe('session-1');
    expect(session.status).toBe('active');
    expect(session.pillar).toBe('agents');
  });

  it('gets active session', async () => {
    const session = await store.getActiveSession('learner-1', 'agents');
    expect(session).not.toBeNull();
    expect(session!.id).toBe('session-1');
  });

  it('updates session status', async () => {
    const updated = await store.updateSessionStatus('session-1', 'paused');
    expect(updated.status).toBe('paused');
  });

  it('upserts and retrieves node state', async () => {
    const nodeState: NodeState = {
      id: 'ns-1',
      learnerId: 'learner-1',
      nodeId: 'node-alpha',
      status: 'studying',
      masteryLevel: 'descriptive',
      attemptCount: 1,
      lastScore: null,
      lastSubmissionId: null,
      nextReviewAt: null,
      passedAt: null,
      updatedAt: new Date(),
    };
    const result = await store.upsertNodeState(nodeState);
    expect(result.nodeId).toBe('node-alpha');
    expect(result.status).toBe('studying');
  });

  it('retrieves node states for learner', async () => {
    const states = await store.getNodeStatesForLearner('learner-1');
    expect(states.length).toBeGreaterThanOrEqual(1);
  });

  it('upserts same node state updating fields', async () => {
    const updated: NodeState = {
      id: 'ns-1',
      learnerId: 'learner-1',
      nodeId: 'node-alpha',
      status: 'passed',
      masteryLevel: 'explain',
      attemptCount: 2,
      lastScore: 0.9,
      lastSubmissionId: null,
      nextReviewAt: null,
      passedAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await store.upsertNodeState(updated);
    expect(result.status).toBe('passed');
    expect(result.attemptCount).toBe(2);
  });
});

// ---- SubmissionStore tests ----

describe('DrizzleSubmissionStore', () => {
  let store: DrizzleSubmissionStore;

  beforeAll(() => {
    store = new DrizzleSubmissionStore(db as any, logger);
  });

  const submission: Submission = {
    id: 'sub-1',
    learnerId: 'learner-1',
    sessionId: 'session-1',
    nodeId: 'node-alpha',
    templateId: 'tmpl-1',
    rawAnswer: 'My answer here',
    submittedAt: new Date(),
  };

  it('creates and retrieves a submission', async () => {
    const result = await store.createSubmission(submission);
    expect(result.id).toBe('sub-1');
    expect(result.rawAnswer).toBe('My answer here');

    const fetched = await store.getSubmission('sub-1');
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe('sub-1');
  });

  it('returns null for unknown submission', async () => {
    const result = await store.getSubmission('no-such');
    expect(result).toBeNull();
  });

  it('gets submissions for node', async () => {
    const results = await store.getSubmissionsForNode('learner-1', 'node-alpha');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  const evaluation: SubmissionEvaluation = {
    submissionId: 'sub-1',
    evaluatorModel: 'mistral-7b',
    result: 'pass',
    score: 0.85,
    rubricSlots: [{ slot: 'definition', score: 0.9, feedback: 'Good' }],
    feedback: 'Well done',
    missingPoints: [],
  };

  it('creates and retrieves an evaluation', async () => {
    const result = await store.createEvaluation(evaluation);
    expect(result.submissionId).toBe('sub-1');
    expect(result.evaluatorModel).toBe('mistral-7b');
    expect(result.result).toBe('pass');

    const fetched = await store.getEvaluationForSubmission('sub-1');
    expect(fetched).not.toBeNull();
    expect(fetched!.score).toBe(0.85);
  });

  it('returns null for unevaluated submission', async () => {
    const result = await store.getEvaluationForSubmission('no-such');
    expect(result).toBeNull();
  });
});

// ---- LearnerEventStore tests ----

describe('DrizzleLearnerEventStore', () => {
  let store: DrizzleLearnerEventStore;

  beforeAll(() => {
    store = new DrizzleLearnerEventStore(db as any, logger);
  });

  const event: LearningEvent = {
    id: 'evt-1',
    type: 'session_started',
    learnerId: 'learner-1',
    sessionId: 'session-1',
    nodeId: null,
    timestamp: new Date(),
    payload: { pillar: 'agents' },
  };

  it('appends and retrieves events for learner', async () => {
    await store.appendEvent(event);
    const events = await store.getEventsForLearner('learner-1');
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]!.type).toBe('session_started');
  });

  it('gets events for session', async () => {
    const events = await store.getEventsForSession('session-1');
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  const job: ReviewJob = {
    id: 'job-1',
    learnerId: 'learner-1',
    nodeId: 'node-alpha',
    jobType: 'review',
    status: 'pending',
    scheduledFor: new Date(Date.now() + 86400000),
    payload: {},
  };

  it('creates and retrieves pending review jobs', async () => {
    await store.createReviewJob(job);
    const jobs = await store.getPendingJobs('learner-1');
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    expect(jobs[0]!.jobType).toBe('review');
  });

  it('updates job status', async () => {
    const updated = await store.updateJobStatus('job-1', 'done');
    expect(updated.status).toBe('done');
  });
});
