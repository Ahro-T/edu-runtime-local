import type { Logger } from 'pino';
import type { KnowledgeNode } from '../../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../../domain/content/AssessmentTemplate.js';
import type { Pillar } from '../../../domain/content/types.js';
import type { ContentRepository, ContentSnapshot } from '../../../ports/ContentRepository.js';
export declare class ObsidianContentRepository implements ContentRepository {
    private readonly vaultPath;
    private readonly logger;
    private nodes;
    private templates;
    private templatesByNodeId;
    private loaded;
    constructor(vaultPath: string, logger: Logger);
    private load;
    getNodeById(id: string): Promise<KnowledgeNode | null>;
    getTemplateById(id: string): Promise<AssessmentTemplate | null>;
    getTemplateByNodeId(nodeId: string): Promise<AssessmentTemplate | null>;
    listNodesByPillar(pillar: Pillar): Promise<KnowledgeNode[]>;
    getPrerequisites(nodeId: string): Promise<KnowledgeNode[]>;
    getRelatedNodes(nodeId: string): Promise<KnowledgeNode[]>;
    validateContent(): Promise<string[]>;
    exportSnapshot(): Promise<ContentSnapshot>;
}
//# sourceMappingURL=ObsidianContentRepository.d.ts.map