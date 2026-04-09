import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewService } from '../ReviewService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { Learner } from '../../domain/learner/Learner.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import type { ReviewJob } from '../../domain/learner/ReviewJob.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

const mockLearner: Learner = {
  id: 'learner-1',
  discordUserId: 'discord-1',
  currentPillar: 'agents',
  currentSessionId: 'session-1',
};

const mockNodeState: NodeState = {
  id: 'ns-1',
  learnerId: 'learner-1',
  nodeId: 'node-1',
  status: 'passed',
  masteryLevel: 'descriptive',
  attemptCount: 1,
  lastScore: 0.8,
  lastSubmissionId: 'sub-1',
  nextReviewAt: null,
  passedAt: new Date(),
  updatedAt: new Date(),
};

function makeStores() {
  const stateStore: LearnerStateStore = {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => mockLearner),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => ({ ...s, status: 'active', metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async () => null),
    updateSessionStatus: vi.fn(async (id, status) => ({ id, learnerId: '', pillar: 'agents', currentNodeId: null, channelId: '', status, metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getNodeState: vi.fn(async () => mockNodeState),
    upsertNodeState: vi.fn(async (ns) => ns),
    getNodeStatesForLearner: vi.fn(async () => []),
    getNodeStatesForSession: vi.fn(async () => []),
  };

  const eventStore: LearnerEventStore = {
    appendEvent: vi.fn(async (e) => e),
    getEventsForLearner: vi.fn(async () => []),
    getEventsForSession: vi.fn(async () => []),
    createReviewJob: vi.fn(async (j) => j),
    getPendingJobs: vi.fn(async () => []),
    updateJobStatus: vi.fn(async (id, status) => ({ id, learnerId: '', nodeId: '', jobType: 'review' as const, status, scheduledFor: new Date(), payload: {} })),
  };

  return { stateStore, eventStore };
}

describe('ReviewService', () => {
  let service: ReviewService;
  let stores: ReturnType<typeof makeStores>;

  beforeEach(() => {
    stores = makeStores();
    service = new ReviewService({
      learnerStateStore: stores.stateStore,
      learnerEventStore: stores.eventStore,
      logger,
    });
  });

  it('schedules a review job', async () => {
    const job = await service.scheduleReview('learner-1', 'node-1');
    expect(job.learnerId).toBe('learner-1');
    expect(job.nodeId).toBe('node-1');
    expect(job.status).toBe('pending');
    expect(stores.eventStore.createReviewJob).toHaveBeenCalledOnce();
  });

  it('emits review_scheduled event', async () => {
    await service.scheduleReview('learner-1', 'node-1');
    const event = vi.mocked(stores.eventStore.appendEvent).mock.calls[0][0];
    expect(event.type).toBe('review_scheduled');
  });

  it('updates nextReviewAt on NodeState', async () => {
    const scheduledFor = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await service.scheduleReview('learner-1', 'node-1', { scheduledFor });
    const upsert = vi.mocked(stores.stateStore.upsertNodeState).mock.calls[0][0];
    expect(upsert.nextReviewAt).toEqual(scheduledFor);
  });

  it('throws LEARNER_NOT_FOUND when learner missing', async () => {
    vi.mocked(stores.stateStore.getLearnerById).mockResolvedValue(null);
    await expect(service.scheduleReview('bad-learner', 'node-1')).rejects.toMatchObject({ code: 'LEARNER_NOT_FOUND' });
  });

  it('throws REVIEW_JOB_CONFLICT when job already pending', async () => {
    const existingJob: ReviewJob = {
      id: 'job-1', learnerId: 'learner-1', nodeId: 'node-1',
      jobType: 'review', status: 'pending', scheduledFor: new Date(), payload: {},
    };
    vi.mocked(stores.eventStore.getPendingJobs).mockResolvedValue([existingJob]);
    await expect(service.scheduleReview('learner-1', 'node-1')).rejects.toMatchObject({ code: 'REVIEW_JOB_CONFLICT' });
  });

  it('uses custom jobType when provided', async () => {
    const job = await service.scheduleReview('learner-1', 'node-1', { jobType: 'reminder' });
    expect(job.jobType).toBe('reminder');
  });
});
