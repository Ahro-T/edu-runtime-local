import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { LearnerSession } from '../domain/learner/LearnerSession.js';
import type { Pillar } from '../domain/content/types.js';
export interface SessionServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    contentRepository: ContentRepository;
    logger: Logger;
}
export declare class SessionService {
    private readonly store;
    private readonly eventStore;
    private readonly content;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, contentRepository, logger }: SessionServiceDeps);
    startOrResume(learnerId: string, pillar: Pillar, channelId?: string): Promise<LearnerSession>;
}
//# sourceMappingURL=SessionService.d.ts.map