import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { Learner } from '../domain/learner/Learner.js';
export interface LearnerServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    logger: Logger;
}
export declare class LearnerService {
    private readonly store;
    private readonly eventStore;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, logger }: LearnerServiceDeps);
    upsertLearner(discordUserId: string): Promise<Learner>;
}
//# sourceMappingURL=LearnerService.d.ts.map