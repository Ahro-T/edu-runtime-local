import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../SessionService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { ContentRepository } from '../../ports/ContentRepository.js';
import type { Learner } from '../../domain/learner/Learner.js';
import type { LearnerSession } from '../../domain/learner/LearnerSession.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';
import { AppError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

const makeLearner = (overrides: Partial<Learner> = {}): Learner => ({
  id: 'learner-1',
  discordUserId: 'discord-1',
  currentPillar: null,
  currentSessionId: null,
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

function makeStateStore(overrides: Partial<LearnerStateStore> = {}): LearnerStateStore {
  return {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => makeLearner()),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => makeSession({ id: s.id, learnerId: s.learnerId, pillar: s.pillar, currentNodeId: s.currentNodeId ?? null })),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async () => null),
    updateSessionStatus: vi.fn(async (id, status) => makeSession({ id, status })),
    getNodeState: vi.fn(async () => null),
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
    getNodeById: vi.fn(async () => null),
    getTemplateById: vi.fn(async () => null),
    getTemplateByNodeId: vi.fn(async () => null),
    listNodesByPillar: vi.fn(async () => [makeNode('node-1')]),
    getPrerequisites: vi.fn(async () => []),
    getRelatedNodes: vi.fn(async () => []),
    validateContent: vi.fn(async () => []),
    exportSnapshot: vi.fn(async () => ({ nodes: [], templates: [], relations: [], exportedAt: new Date() })),
    ...overrides,
  };
}

describe('SessionService', () => {
  let stateStore: LearnerStateStore;
  let eventStore: LearnerEventStore;
  let contentRepo: ContentRepository;
  let service: SessionService;

  beforeEach(() => {
    stateStore = makeStateStore();
    eventStore = makeEventStore();
    contentRepo = makeContentRepo();
    service = new SessionService({ learnerStateStore: stateStore, learnerEventStore: eventStore, contentRepository: contentRepo, logger });
  });

  it('throws LEARNER_NOT_FOUND when learner does not exist', async () => {
    vi.mocked(stateStore.getLearnerById).mockResolvedValue(null);
    await expect(service.startOrResume('learner-x', 'agents')).rejects.toThrow(AppError);
  });

  it('resumes existing session when active session found', async () => {
    const existing = makeSession();
    vi.mocked(stateStore.getActiveSession).mockResolvedValue(existing);

    const session = await service.startOrResume('learner-1', 'agents');
    expect(session.id).toBe('session-1');
    expect(stateStore.createSession).not.toHaveBeenCalled();
    const event = vi.mocked(eventStore.appendEvent).mock.calls[0][0];
    expect(event.payload).toMatchObject({ event: 'session-resumed' });
  });

  it('creates new session when no active session exists', async () => {
    vi.mocked(stateStore.getActiveSession).mockResolvedValue(null);
    vi.mocked(contentRepo.listNodesByPillar).mockResolvedValue([makeNode('node-1')]);
    vi.mocked(contentRepo.getPrerequisites).mockResolvedValue([]);

    const session = await service.startOrResume('learner-1', 'agents');
    expect(stateStore.createSession).toHaveBeenCalledOnce();
    const event = vi.mocked(eventStore.appendEvent).mock.calls[0][0];
    expect(event.payload).toMatchObject({ event: 'session-started' });
  });

  it('throws NODE_NOT_FOUND when no nodes exist for pillar', async () => {
    vi.mocked(stateStore.getActiveSession).mockResolvedValue(null);
    vi.mocked(contentRepo.listNodesByPillar).mockResolvedValue([]);
    await expect(service.startOrResume('learner-1', 'agents')).rejects.toThrow(AppError);
  });

  it('selects entry node (one with no prerequisites)', async () => {
    const node1 = makeNode('node-1');
    const node2 = makeNode('node-2');
    vi.mocked(stateStore.getActiveSession).mockResolvedValue(null);
    vi.mocked(contentRepo.listNodesByPillar).mockResolvedValue([node1, node2]);
    // node2 has node1 as prereq — so node1 is the entry point
    vi.mocked(contentRepo.getPrerequisites).mockImplementation(async (id) =>
      id === 'node-2' ? [node1] : [],
    );

    await service.startOrResume('learner-1', 'agents');
    const createCall = vi.mocked(stateStore.createSession).mock.calls[0][0];
    expect(createCall.currentNodeId).toBe('node-1');
  });
});
