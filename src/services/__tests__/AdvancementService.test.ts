import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancementService } from '../AdvancementService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { ContentRepository } from '../../ports/ContentRepository.js';
import type { LearnerSession } from '../../domain/learner/LearnerSession.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';
import { AppError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

const makeSession = (overrides: Partial<LearnerSession> = {}): LearnerSession => ({
  id: 'session-1',
  learnerId: 'learner-1',
  status: 'active',
  pillar: 'agents',
  currentNodeId: 'node-1',
  channelId: 'default',
  metadata: {},
  startedAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeNode = (id: string): KnowledgeNode => ({
  id,
  pillar: 'agents',
  nodeType: 'concept',
  title: `Node ${id}`,
  summary: 'summary',
  prerequisites: [],
  related: [],
  assessmentTemplateId: `tmpl-${id}`,
  body: 'body',
  masteryStageTarget: 'descriptive',
  teacherPromptMode: 'socratic',
});

const makeNodeState = (nodeId: string, status: NodeState['status'] = 'passed'): NodeState => ({
  id: `ns-${nodeId}`,
  learnerId: 'learner-1',
  nodeId,
  status,
  masteryLevel: 'descriptive',
  attemptCount: 1,
  lastScore: 0.9,
  lastSubmissionId: 'sub-1',
  nextReviewAt: null,
  passedAt: status === 'passed' ? new Date() : null,
  updatedAt: new Date(),
});

function makeStateStore(overrides: Partial<LearnerStateStore> = {}): LearnerStateStore {
  return {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => null),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => makeSession()),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async () => makeSession()),
    updateSessionStatus: vi.fn(async (id, status, nodeId) => makeSession({ id, status, currentNodeId: nodeId ?? null })),
    getNodeState: vi.fn(async (learnerId, nodeId) => makeNodeState(nodeId, 'passed')),
    upsertNodeState: vi.fn(async (ns) => ns),
    getNodeStatesForLearner: vi.fn(async () => []),
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

function makeContentRepo(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    getNodeById: vi.fn(async (id) => makeNode(id)),
    getTemplateById: vi.fn(async () => null),
    getTemplateByNodeId: vi.fn(async () => null),
    listNodesByPillar: vi.fn(async () => [makeNode('node-1'), makeNode('node-2')]),
    getPrerequisites: vi.fn(async (id) => id === 'node-2' ? [makeNode('node-1')] : []),
    getRelatedNodes: vi.fn(async () => []),
    validateContent: vi.fn(async () => []),
    exportSnapshot: vi.fn(async () => ({ nodes: [], templates: [], relations: [], exportedAt: new Date() })),
    ...overrides,
  };
}

describe('AdvancementService', () => {
  let stateStore: LearnerStateStore;
  let eventStore: LearnerEventStore;
  let contentRepo: ContentRepository;
  let service: AdvancementService;

  beforeEach(() => {
    stateStore = makeStateStore();
    eventStore = makeEventStore();
    contentRepo = makeContentRepo();
    service = new AdvancementService({ learnerStateStore: stateStore, learnerEventStore: eventStore, contentRepository: contentRepo, logger });
  });

  it('throws SESSION_NOT_FOUND when no active session', async () => {
    vi.mocked(stateStore.getActiveSession).mockResolvedValue(null);
    await expect(service.advanceNode('learner-1', 'agents')).rejects.toThrow(AppError);
  });

  it('advances to next node when current node is passed', async () => {
    const result = await service.advanceNode('learner-1', 'agents');
    expect(result.advanced).toBe(true);
    expect(result.pillarCompleted).toBe(false);
    expect(result.nextNode?.id).toBe('node-2');
  });

  it('marks pillar completed when no next node exists', async () => {
    // node-1 has no successors
    vi.mocked(contentRepo.listNodesByPillar).mockResolvedValue([makeNode('node-1')]);
    vi.mocked(contentRepo.getPrerequisites).mockResolvedValue([]);

    const result = await service.advanceNode('learner-1', 'agents');
    expect(result.pillarCompleted).toBe(true);
    expect(result.advanced).toBe(false);
    expect(stateStore.updateSessionStatus).toHaveBeenCalledWith('session-1', 'completed', null);
  });

  it('emits node_started event on advance', async () => {
    await service.advanceNode('learner-1', 'agents');
    const event = vi.mocked(eventStore.appendEvent).mock.calls[0][0];
    expect(event.type).toBe('node_started');
  });

  it('initializes NodeState for next node if not exists', async () => {
    vi.mocked(stateStore.getNodeState).mockImplementation(async (learnerId, nodeId) => {
      if (nodeId === 'node-2') return null;
      return makeNodeState(nodeId);
    });

    await service.advanceNode('learner-1', 'agents');
    expect(stateStore.upsertNodeState).toHaveBeenCalledOnce();
  });

  it('does not initialize NodeState for next node if already exists', async () => {
    vi.mocked(stateStore.getNodeState).mockResolvedValue(makeNodeState('node-1'));
    await service.advanceNode('learner-1', 'agents');
    expect(stateStore.upsertNodeState).not.toHaveBeenCalled();
  });
});
