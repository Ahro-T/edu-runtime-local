import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { Pillar } from '../domain/content/types.js';
export interface ContentServiceDeps {
    learnerStateStore: LearnerStateStore;
    contentRepository: ContentRepository;
    logger: Logger;
}
export declare class ContentService {
    private readonly store;
    private readonly content;
    private readonly logger;
    constructor({ learnerStateStore, contentRepository, logger }: ContentServiceDeps);
    getCurrentNode(learnerId: string, pillar: Pillar): Promise<KnowledgeNode>;
}
//# sourceMappingURL=ContentService.d.ts.map