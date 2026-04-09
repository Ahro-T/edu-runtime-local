import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmissionService } from '../SubmissionService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../../ports/SubmissionStore.js';
import type { ContentRepository } from '../../ports/ContentRepository.js';
import type { LearnerSession } from '../../domain/learner/LearnerSession.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

const mockSession: LearnerSession = {
  id: 'session-1',
  learnerId: 'learner-1',
  pillar: 'agents',
  currentNodeId: 'node-1',
  channelId: 'ch-1',
  status: 'active',
  metadata: {},
  startedAt: new Date(),
  updatedAt: new Date(),
};

const mockNodeState: NodeState = {
  id: 'ns-1',
  learnerId: 'learner-1',
  nodeId: 'node-1',
  status: 'studying',
  masteryLevel: 'descriptive',
  attemptCount: 0,
  lastScore: null,
  lastSubmissionId: null,
  nextReviewAt: null,
  passedAt: null,
  updatedAt: new Date(),
};

function makeStores() {
  const stateStore: LearnerStateStore = {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => null),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => ({ ...s, status: 'active', metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getSession: vi.fn(async () => mockSession),
    getActiveSession: vi.fn(async () => mockSession),
    updateSessionStatus: vi.fn(async (id, status) => ({ ...mockSession, id, status })),
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

  const submissionStore: SubmissionStore = {
    createSubmission: vi.fn(async (s) => s),
    getSubmission: vi.fn(async () => null),
    getSubmissionsForNode: vi.fn(async () => []),
    createEvaluation: vi.fn(async (e) => e),
    getEvaluationForSubmission: vi.fn(async () => null),
  };

  const contentRepo: ContentRepository = {
    getNodeById: vi.fn(async () => ({
      id: 'node-1', pillar: 'agents', nodeType: 'concept', title: 'Test Node',
      summary: 'Summary', prerequisites: [], related: [], assessmentTemplateId: 'tpl-1',
      body: 'Body', masteryStageTarget: 'descriptive', teacherPromptMode: 'guided',
    })),
    getTemplateById: vi.fn(async () => null),
    getTemplateByNodeId: vi.fn(async () => ({
      id: 'tpl-1', nodeId: 'node-1', instructions: 'Instructions',
      requiredSlots: ['definition'], rubric: { pass: [], fail: [], remediation: [] },
    })),
    listNodesByPillar: vi.fn(async () => []),
    getPrerequisites: vi.fn(async () => []),
    getRelatedNodes: vi.fn(async () => []),
    validateContent: vi.fn(async () => []),
    exportSnapshot: vi.fn(async () => ({ nodes: [], templates: [], relations: [], exportedAt: new Date() })),
  };

  return { stateStore, eventStore, submissionStore, contentRepo };
}

describe('SubmissionService', () => {
  let service: SubmissionService;
  let stores: ReturnType<typeof makeStores>;

  beforeEach(() => {
    stores = makeStores();
    service = new SubmissionService({
      learnerStateStore: stores.stateStore,
      learnerEventStore: stores.eventStore,
      submissionStore: stores.submissionStore,
      contentRepository: stores.contentRepo,
      logger,
    });
  });

  it('creates a submission and returns it', async () => {
    const sub = await service.recordSubmission('learner-1', 'session-1', 'node-1', 'My answer');
    expect(sub.learnerId).toBe('learner-1');
    expect(sub.rawAnswer).toBe('My answer');
    expect(stores.submissionStore.createSubmission).toHaveBeenCalledOnce();
  });

  it('increments attemptCount on NodeState', async () => {
    await service.recordSubmission('learner-1', 'session-1', 'node-1', 'My answer');
    const upsertCall = vi.mocked(stores.stateStore.upsertNodeState).mock.calls[0][0];
    expect(upsertCall.attemptCount).toBe(1); // was 0, incremented to 1
  });

  it('sets lastSubmissionId on NodeState', async () => {
    const sub = await service.recordSubmission('learner-1', 'session-1', 'node-1', 'My answer');
    const upsertCall = vi.mocked(stores.stateStore.upsertNodeState).mock.calls[0][0];
    expect(upsertCall.lastSubmissionId).toBe(sub.id);
  });

  it('emits submission-recorded event', async () => {
    await service.recordSubmission('learner-1', 'session-1', 'node-1', 'My answer');
    expect(stores.eventStore.appendEvent).toHaveBeenCalledOnce();
    const event = vi.mocked(stores.eventStore.appendEvent).mock.calls[0][0];
    expect(event.type).toBe('submission_recorded');
  });

  it('throws SESSION_NOT_FOUND when session missing', async () => {
    vi.mocked(stores.stateStore.getSession).mockResolvedValue(null);
    await expect(
      service.recordSubmission('learner-1', 'bad-session', 'node-1', 'answer'),
    ).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('creates node state from scratch when none exists', async () => {
    vi.mocked(stores.stateStore.getNodeState).mockResolvedValue(null);
    await service.recordSubmission('learner-1', 'session-1', 'node-1', 'My answer');
    const upsertCall = vi.mocked(stores.stateStore.upsertNodeState).mock.calls[0][0];
    expect(upsertCall.attemptCount).toBe(1);
    expect(upsertCall.status).toBe('studying');
  });
});
