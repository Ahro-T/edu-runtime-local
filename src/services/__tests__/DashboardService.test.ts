import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../DashboardService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../../ports/SubmissionStore.js';
import type { ContentRepository } from '../../ports/ContentRepository.js';
import type { Learner } from '../../domain/learner/Learner.js';
import type { LearnerSession } from '../../domain/learner/LearnerSession.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import { AppError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

const makeLearner = (): Learner => ({
  id: 'learner-1',
  discordUserId: 'discord-1',
  currentPillar: null,
  currentSessionId: null,
});

const makeSession = (pillar: LearnerSession['pillar'] = 'agents'): LearnerSession => ({
  id: 'session-1',
  learnerId: 'learner-1',
  status: 'active',
  pillar,
  currentNodeId: 'node-1',
  channelId: 'default',
  metadata: {},
  startedAt: new Date(),
  updatedAt: new Date(),
});

const makeNodeState = (nodeId: string, status: NodeState['status'] = 'studying'): NodeState => ({
  id: `ns-${nodeId}`,
  learnerId: 'learner-1',
  nodeId,
  status,
  masteryLevel: 'descriptive',
  attemptCount: 1,
  lastScore: null,
  lastSubmissionId: null,
  nextReviewAt: null,
  passedAt: null,
  updatedAt: new Date(),
});

function makeStateStore(overrides: Partial<LearnerStateStore> = {}): LearnerStateStore {
  return {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => makeLearner()),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async () => makeSession()),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async (learnerId, pillar) => pillar === 'agents' ? makeSession() : null),
    updateSessionStatus: vi.fn(async (id, status) => makeSession()),
    getNodeState: vi.fn(async () => null),
    upsertNodeState: vi.fn(async (ns) => ns),
    getNodeStatesForLearner: vi.fn(async () => [makeNodeState('node-1', 'passed'), makeNodeState('node-2', 'studying')]),
    getNodeStatesForSession: vi.fn(async () => []),
    ...overrides,
  };
}

function makeEventStore(overrides: Partial<LearnerEventStore> = {}): LearnerEventStore {
  return {
    appendEvent: vi.fn(async (e) => e),
    getEventsForLearner: vi.fn(async () => []),
    getEventsForSession: vi.fn(async () => []),
    createReviewJob: vi.fn(async (j) => j),
    getPendingJobs: vi.fn(async () => []),
    updateJobStatus: vi.fn(async (id, status) => ({ id, learnerId: '', nodeId: '', jobType: 'review' as const, status, scheduledFor: new Date(), payload: {} })),
    ...overrides,
  };
}

function makeSubmissionStore(overrides: Partial<SubmissionStore> = {}): SubmissionStore {
  return {
    createSubmission: vi.fn(async (s) => s),
    getSubmission: vi.fn(async () => null),
    getSubmissionsForNode: vi.fn(async () => []),
    createEvaluation: vi.fn(async (e) => e),
    getEvaluationForSubmission: vi.fn(async () => null),
    ...overrides,
  };
}

function makeContentRepo(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    getNodeById: vi.fn(async () => null),
    getTemplateById: vi.fn(async () => null),
    getTemplateByNodeId: vi.fn(async () => null),
    listNodesByPillar: vi.fn(async () => []),
    getPrerequisites: vi.fn(async () => []),
    getRelatedNodes: vi.fn(async () => []),
    validateContent: vi.fn(async () => []),
    exportSnapshot: vi.fn(async () => ({ nodes: [], templates: [], relations: [], exportedAt: new Date() })),
    ...overrides,
  };
}

describe('DashboardService', () => {
  let stateStore: LearnerStateStore;
  let eventStore: LearnerEventStore;
  let submissionStore: SubmissionStore;
  let contentRepo: ContentRepository;
  let service: DashboardService;

  beforeEach(() => {
    stateStore = makeStateStore();
    eventStore = makeEventStore();
    submissionStore = makeSubmissionStore();
    contentRepo = makeContentRepo();
    service = new DashboardService({ learnerStateStore: stateStore, learnerEventStore: eventStore, submissionStore, contentRepository: contentRepo, logger });
  });

  it('returns dashboard data for a learner', async () => {
    const dashboard = await service.getDashboard('learner-1');
    expect(dashboard.learner.id).toBe('learner-1');
    expect(dashboard.nodeStates).toHaveLength(2);
  });

  it('throws LEARNER_NOT_FOUND when learner does not exist', async () => {
    vi.mocked(stateStore.getLearnerById).mockResolvedValue(null);
    await expect(service.getDashboard('learner-x')).rejects.toThrow(AppError);
  });

  it('counts passed nodes correctly', async () => {
    const dashboard = await service.getDashboard('learner-1');
    expect(dashboard.passedNodes).toBe(1); // node-1 is passed, node-2 is studying
  });

  it('includes active sessions', async () => {
    const dashboard = await service.getDashboard('learner-1');
    expect(dashboard.activeSessions).toHaveLength(1);
    expect(dashboard.activeSessions[0].pillar).toBe('agents');
  });

  it('includes pending reviews', async () => {
    vi.mocked(eventStore.getPendingJobs).mockResolvedValue([
      { id: 'job-1', learnerId: 'learner-1', nodeId: 'node-1', jobType: 'review', status: 'pending', scheduledFor: new Date(), payload: {} },
    ]);
    const dashboard = await service.getDashboard('learner-1');
    expect(dashboard.pendingReviews).toHaveLength(1);
  });

  it('counts totalSubmissions from submissionStore', async () => {
    vi.mocked(submissionStore.getSubmissionsForNode).mockResolvedValue([
      { id: 'sub-1', learnerId: 'learner-1', sessionId: 'session-1', nodeId: 'node-1', templateId: 'tmpl-1', rawAnswer: 'a', submittedAt: new Date() },
    ]);
    const dashboard = await service.getDashboard('learner-1');
    // 2 nodeStates * 1 submission each = 2
    expect(dashboard.totalSubmissions).toBe(2);
  });
});
