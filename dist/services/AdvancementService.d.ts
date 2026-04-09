import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { Pillar } from '../domain/content/types.js';
export interface AdvancementResult {
    advanced: boolean;
    pillarCompleted: boolean;
    nextNode: KnowledgeNode | null;
}
export interface AdvancementServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    contentRepository: ContentRepository;
    logger: Logger;
}
export declare class AdvancementService {
    private readonly store;
    private readonly eventStore;
    private readonly content;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, contentRepository, logger }: AdvancementServiceDeps);
    advanceNode(learnerId: string, pillar: Pillar): Promise<AdvancementResult>;
}
//# sourceMappingURL=AdvancementService.d.ts.map