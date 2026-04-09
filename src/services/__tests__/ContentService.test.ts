import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentService } from '../ContentService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { ContentRepository } from '../../ports/ContentRepository.js';
import type { LearnerSession } from '../../domain/learner/LearnerSession.js';
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

const mockNode = {
  id: 'node-1', pillar: 'agents' as const, nodeType: 'concept' as const, title: 'Test Node',
  summary: 'Summary', prerequisites: [], related: [], assessmentTemplateId: 'tpl-1',
  body: 'Body', masteryStageTarget: 'descriptive' as const, teacherPromptMode: 'guided' as const,
};

function makeStores() {
  const stateStore: LearnerStateStore = {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => null),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => ({ ...s, status: 'active', metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async () => mockSession),
    updateSessionStatus: vi.fn(async (id, status) => ({ ...mockSession, id, status })),
    getNodeState: vi.fn(async () => null),
    upsertNodeState: vi.fn(async (ns) => ns),
    getNodeStatesForLearner: vi.fn(async () => []),
    getNodeStatesForSession: vi.fn(async () => []),
  };

  const contentRepo: ContentRepository = {
    getNodeById: vi.fn(async () => mockNode),
    getTemplateById: vi.fn(async () => null),
    getTemplateByNodeId: vi.fn(async () => null),
    listNodesByPillar: vi.fn(async () => [mockNode]),
    getPrerequisites: vi.fn(async () => []),
    getRelatedNodes: vi.fn(async () => []),
    validateContent: vi.fn(async () => []),
    exportSnapshot: vi.fn(async () => ({ nodes: [], templates: [], relations: [], exportedAt: new Date() })),
  };

  return { stateStore, contentRepo };
}

describe('ContentService', () => {
  let service: ContentService;
  let stores: ReturnType<typeof makeStores>;

  beforeEach(() => {
    stores = makeStores();
    service = new ContentService({
      learnerStateStore: stores.stateStore,
      contentRepository: stores.contentRepo,
      logger,
    });
  });

  it('returns the current node for an active session', async () => {
    const node = await service.getCurrentNode('learner-1', 'agents');
    expect(node.id).toBe('node-1');
    expect(node.title).toBe('Test Node');
  });

  it('throws SESSION_NOT_FOUND when no active session', async () => {
    vi.mocked(stores.stateStore.getActiveSession).mockResolvedValue(null);
    await expect(service.getCurrentNode('learner-1', 'agents')).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('throws NODE_NOT_FOUND when session has no currentNodeId', async () => {
    vi.mocked(stores.stateStore.getActiveSession).mockResolvedValue({ ...mockSession, currentNodeId: null });
    await expect(service.getCurrentNode('learner-1', 'agents')).rejects.toMatchObject({ code: 'NODE_NOT_FOUND' });
  });

  it('throws NODE_NOT_FOUND when node not in repo', async () => {
    vi.mocked(stores.contentRepo.getNodeById).mockResolvedValue(null);
    await expect(service.getCurrentNode('learner-1', 'agents')).rejects.toMatchObject({ code: 'NODE_NOT_FOUND' });
  });
});
