import pg from 'pg';
import { createLogger } from '../../logger.js';

const logger = createLogger('ensure-schema');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS learners (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  current_pillar TEXT,
  current_session_id TEXT
);

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
);

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
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  session_id TEXT NOT NULL REFERENCES learner_sessions(id),
  node_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  raw_answer TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submission_evaluations (
  submission_id TEXT PRIMARY KEY REFERENCES submissions(id),
  evaluator_model TEXT NOT NULL,
  result TEXT NOT NULL,
  score REAL NOT NULL,
  rubric_slots JSONB NOT NULL DEFAULT '[]',
  feedback TEXT NOT NULL,
  missing_points JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS review_jobs (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  node_id TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('review', 'retry', 'reminder')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  session_id TEXT NOT NULL,
  node_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'
);
`;

export async function ensureSchema(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    logger.info('Ensuring database schema exists...');
    await client.query(SCHEMA_SQL);
    logger.info('Schema ready');
  } finally {
    await client.end();
  }
}

// Run standalone: node dist/adapters/db/ensure-schema.js
const isMain = process.argv[1]?.endsWith('ensure-schema.js');
if (isMain) {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  ensureSchema(url)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Schema creation failed:', err);
      process.exit(1);
    });
}
