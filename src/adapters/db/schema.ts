import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  unique,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const learners = pgTable('learners', {
  id: text('id').primaryKey(),
  discordUserId: text('discord_user_id').notNull().unique(),
  currentPillar: text('current_pillar'),
  currentSessionId: text('current_session_id'),
});

export const learnerSessions = pgTable('learner_sessions', {
  id: text('id').primaryKey(),
  learnerId: text('learner_id')
    .notNull()
    .references(() => learners.id),
  status: text('status').notNull(),
  pillar: text('pillar').notNull(),
  currentNodeId: text('current_node_id'),
  channelId: text('channel_id').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const nodeStates = pgTable(
  'node_states',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id')
      .notNull()
      .references(() => learners.id),
    nodeId: text('node_id').notNull(),
    status: text('status').notNull(),
    masteryLevel: text('mastery_level').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastScore: real('last_score'),
    lastSubmissionId: text('last_submission_id'),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    passedAt: timestamp('passed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('node_states_learner_node_unique').on(table.learnerId, table.nodeId)],
);

export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  learnerId: text('learner_id')
    .notNull()
    .references(() => learners.id),
  sessionId: text('session_id')
    .notNull()
    .references(() => learnerSessions.id),
  nodeId: text('node_id').notNull(),
  templateId: text('template_id').notNull(),
  rawAnswer: text('raw_answer').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
});

export const submissionEvaluations = pgTable('submission_evaluations', {
  submissionId: text('submission_id')
    .primaryKey()
    .references(() => submissions.id),
  evaluatorModel: text('evaluator_model').notNull(),
  result: text('result').notNull(),
  score: real('score').notNull(),
  rubricSlots: jsonb('rubric_slots').notNull().default([]),
  feedback: text('feedback').notNull(),
  missingPoints: jsonb('missing_points').notNull().default([]),
});

export const reviewJobs = pgTable(
  'review_jobs',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id')
      .notNull()
      .references(() => learners.id),
    nodeId: text('node_id').notNull(),
    jobType: text('job_type').notNull(),
    status: text('status').notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    payload: jsonb('payload').notNull().default({}),
  },
  (table) => [
    check(
      'review_jobs_job_type_check',
      sql`${table.jobType} IN ('review', 'retry', 'reminder')`,
    ),
    check(
      'review_jobs_status_check',
      sql`${table.status} IN ('pending', 'running', 'done', 'failed', 'cancelled')`,
    ),
  ],
);

export const learningEvents = pgTable('learning_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  learnerId: text('learner_id')
    .notNull()
    .references(() => learners.id),
  sessionId: text('session_id')
    .notNull()
    .references(() => learnerSessions.id),
  nodeId: text('node_id'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb('payload').notNull().default({}),
});
