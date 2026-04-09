import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearnerService } from '../LearnerService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { Learner } from '../../domain/learner/Learner.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

function makeLearnerStateStore(overrides: Partial<LearnerStateStore> = {}): LearnerStateStore {
  return {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => null),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => ({ ...s, status: 'active', metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async () => null),
    updateSessionStatus: vi.fn(async (id, status) => ({ id, learnerId: '', status, pillar: 'agents', channelId: '', currentNodeId: null, metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getNodeState: vi.fn(async () => null),
    upsertNodeState: vi.fn(async (ns) => ns),
    getNodeStatesForLearner: vi.fn(async () => []),
    getNodeStatesForSession: vi.fn(async () => []),
    ...overrides,
  };
}

function makeLearnerEventStore(overrides: Partial<LearnerEventStore> = {}): LearnerEventStore {
  return {
    appendEvent: vi.fn(async (e) => e),
    getEventsForLearner: vi.fn(async () => []),
    getEventsForSession: vi.fn(async () => []),
    createReviewJob: vi.fn(async (j) => j),
    getPendingJobs: vi.fn(async () => []),
    updateJobStatus: vi.fn(async (id, status) => ({ id, learnerId: '', nodeId: '', jobType: 'review', status, scheduledFor: new Date(), payload: {} })),
    ...overrides,
  };
}

describe('LearnerService', () => {
  let service: LearnerService;
  let stateStore: LearnerStateStore;
  let eventStore: LearnerEventStore;

  beforeEach(() => {
    stateStore = makeLearnerStateStore();
    eventStore = makeLearnerEventStore();
    service = new LearnerService({ learnerStateStore: stateStore, learnerEventStore: eventStore, logger });
  });

  it('creates a new learner when none exists', async () => {
    const learner = await service.upsertLearner('discord-123');
    expect(learner.discordUserId).toBe('discord-123');
    expect(stateStore.upsertLearner).toHaveBeenCalledOnce();
    expect(eventStore.appendEvent).toHaveBeenCalledOnce();
  });

  it('updates an existing learner when found', async () => {
    const existing: Learner = { id: 'learner-1', discordUserId: 'discord-123', currentPillar: null, currentSessionId: null };
    vi.mocked(stateStore.getLearnerByDiscordId).mockResolvedValue(existing);

    const learner = await service.upsertLearner('discord-123');
    expect(learner.id).toBe('learner-1');
    expect(stateStore.upsertLearner).toHaveBeenCalledWith(existing);
  });

  it('emits an event after creating learner', async () => {
    await service.upsertLearner('discord-456');
    expect(eventStore.appendEvent).toHaveBeenCalledOnce();
    const call = vi.mocked(eventStore.appendEvent).mock.calls[0][0];
    expect(call.payload).toMatchObject({ event: 'learner-created', discordUserId: 'discord-456' });
  });

  it('emits an event after updating learner', async () => {
    const existing: Learner = { id: 'learner-2', discordUserId: 'discord-789', currentPillar: null, currentSessionId: null };
    vi.mocked(stateStore.getLearnerByDiscordId).mockResolvedValue(existing);

    await service.upsertLearner('discord-789');
    const call = vi.mocked(eventStore.appendEvent).mock.calls[0][0];
    expect(call.payload).toMatchObject({ event: 'learner-updated' });
  });
});
