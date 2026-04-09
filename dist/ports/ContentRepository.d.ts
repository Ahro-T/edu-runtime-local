import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../domain/content/AssessmentTemplate.js';
import type { ContentRelation } from '../domain/content/ContentRelation.js';
import type { Pillar } from '../domain/content/types.js';
export interface ContentSnapshot {
    nodes: KnowledgeNode[];
    templates: AssessmentTemplate[];
    relations: ContentRelation[];
    exportedAt: Date;
}
export interface ContentRepository {
    getNodeById(id: string): Promise<KnowledgeNode | null>;
    getTemplateById(id: string): Promise<AssessmentTemplate | null>;
    getTemplateByNodeId(nodeId: string): Promise<AssessmentTemplate | null>;
    listNodesByPillar(pillar: Pillar): Promise<KnowledgeNode[]>;
    getPrerequisites(nodeId: string): Promise<KnowledgeNode[]>;
    getRelatedNodes(nodeId: string): Promise<KnowledgeNode[]>;
    validateContent(): Promise<string[]>;
    exportSnapshot(): Promise<ContentSnapshot>;
}
//# sourceMappingURL=ContentRepository.d.ts.map