import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { Learner } from '../domain/learner/Learner.js';

export interface LearnerServiceDeps {
  learnerStateStore: LearnerStateStore;
  learnerEventStore: LearnerEventStore;
  logger: Logger;
}

export class LearnerService {
  private readonly store: LearnerStateStore;
  private readonly eventStore: LearnerEventStore;
  private readonly logger: Logger;

  constructor({ learnerStateStore, learnerEventStore, logger }: LearnerServiceDeps) {
    this.store = learnerStateStore;
    this.eventStore = learnerEventStore;
    this.logger = logger.child({ service: 'LearnerService' });
  }

  async upsertLearner(discordUserId: string): Promise<Learner> {
    const log = this.logger.child({ discordUserId });
    const existing = await this.store.getLearnerByDiscordId(discordUserId);

    if (existing) {
      log.debug({ learnerId: existing.id }, 'Learner already exists, updating');
      const updated = await this.store.upsertLearner(existing);
      await this.eventStore.appendEvent({
        id: randomUUID(),
        type: 'session_started', // reuse closest available type; learner-updated is a meta-event
        learnerId: updated.id,
        sessionId: updated.currentSessionId ?? 'none',
        nodeId: null,
        timestamp: new Date(),
        payload: { event: 'learner-updated', discordUserId },
      });
      log.info({ learnerId: updated.id }, 'Learner updated');
      return updated;
    }

    const learner: Learner = {
      id: randomUUID(),
      discordUserId,
      currentPillar: null,
      currentSessionId: null,
    };

    const created = await this.store.upsertLearner(learner);
    await this.eventStore.appendEvent({
      id: randomUUID(),
      type: 'session_started', // closest available; learner-created is a meta-event
      learnerId: created.id,
      sessionId: 'none',
      nodeId: null,
      timestamp: new Date(),
      payload: { event: 'learner-created', discordUserId },
    });
    log.info({ learnerId: created.id }, 'Learner created');
    return created;
  }
}
