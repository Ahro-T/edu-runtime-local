import type { Logger } from 'pino';
import type { KnowledgeNode } from '../../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../../domain/content/AssessmentTemplate.js';
import type { ContentRelation } from '../../../domain/content/ContentRelation.js';
import type { Pillar } from '../../../domain/content/types.js';
import type { ContentRepository, ContentSnapshot } from '../../../ports/ContentRepository.js';
import { scanNodeFiles, scanTemplateFiles } from './vault-scanner.js';
import { parseNodeFile, parseTemplateFile } from './frontmatter-parser.js';
import { validateVault } from './validators.js';

export class ObsidianContentRepository implements ContentRepository {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private templates: Map<string, AssessmentTemplate> = new Map();
  private templatesByNodeId: Map<string, AssessmentTemplate> = new Map();
  private loaded = false;

  constructor(
    private readonly vaultPath: string,
    private readonly logger: Logger,
  ) {}

  private async load(): Promise<void> {
    if (this.loaded) return;

    this.logger.info({ vaultPath: this.vaultPath }, 'Loading Obsidian vault');

    const [nodeFiles, templateFiles] = await Promise.all([
      scanNodeFiles(this.vaultPath),
      scanTemplateFiles(this.vaultPath),
    ]);

    for (const { filePath, raw } of nodeFiles) {
      try {
        const parsed = parseNodeFile(raw, filePath);
        const fm = parsed.frontmatter;
        const node: KnowledgeNode = {
          id: fm.id,
          pillar: fm.pillar,
          nodeType: fm.node_type,
          title: fm.title,
          summary: fm.summary,
          prerequisites: fm.prerequisites,
          related: fm.related,
          assessmentTemplateId: fm.assessment_template,
          masteryStageTarget: fm.mastery_stage_target,
          teacherPromptMode: fm.teacher_prompt_mode,
          body: parsed.body,
        };
        this.nodes.set(node.id, node);
      } catch (err) {
        this.logger.error({ filePath, err }, 'Failed to parse node file');
        throw err;
      }
    }

    for (const { filePath, raw } of templateFiles) {
      try {
        const parsed = parseTemplateFile(raw, filePath);
        const fm = parsed.frontmatter;
        const tpl: AssessmentTemplate = {
          id: fm.id,
          nodeId: fm.nodeId,
          instructions: fm.instructions,
          requiredSlots: fm.requiredSlots,
          rubric: {
            passRules: fm.rubric.passRules.map(desc => ({ slot: '', description: desc })),
            failRules: fm.rubric.failRules.map(desc => ({ slot: '', description: desc })),
            remediationRules: fm.rubric.remediationRules.map(desc => ({ slot: '', description: desc })),
          },
        };
        this.templates.set(tpl.id, tpl);
        this.templatesByNodeId.set(tpl.nodeId, tpl);
      } catch (err) {
        this.logger.error({ filePath, err }, 'Failed to parse template file');
        throw err;
      }
    }

    this.loaded = true;
    this.logger.info(
      { nodeCount: this.nodes.size, templateCount: this.templates.size },
      'Vault loaded',
    );
  }

  async getNodeById(id: string): Promise<KnowledgeNode | null> {
    await this.load();
    return this.nodes.get(id) ?? null;
  }

  async getTemplateById(id: string): Promise<AssessmentTemplate | null> {
    await this.load();
    return this.templates.get(id) ?? null;
  }

  async getTemplateByNodeId(nodeId: string): Promise<AssessmentTemplate | null> {
    await this.load();
    return this.templatesByNodeId.get(nodeId) ?? null;
  }

  async listNodesByPillar(pillar: Pillar): Promise<KnowledgeNode[]> {
    await this.load();
    return Array.from(this.nodes.values()).filter(n => n.pillar === pillar);
  }

  async getPrerequisites(nodeId: string): Promise<KnowledgeNode[]> {
    await this.load();
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.prerequisites
      .map(id => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  async getRelatedNodes(nodeId: string): Promise<KnowledgeNode[]> {
    await this.load();
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.related
      .map(id => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  async validateContent(): Promise<string[]> {
    await this.load();
    return validateVault(
      Array.from(this.nodes.values()),
      Array.from(this.templates.values()),
    );
  }

  async exportSnapshot(): Promise<ContentSnapshot> {
    await this.load();

    const nodes = Array.from(this.nodes.values());
    const templates = Array.from(this.templates.values());

    // Build relations from prerequisites and related arrays
    const relations: ContentRelation[] = [];
    for (const node of nodes) {
      for (const prereqId of node.prerequisites) {
        relations.push({
          fromNodeId: prereqId,
          toNodeId: node.id,
          relationType: 'prerequisite-of',
        });
      }
      for (const relId of node.related) {
        relations.push({
          fromNodeId: node.id,
          toNodeId: relId,
          relationType: 'related-to',
        });
      }
    }

    return {
      nodes,
      templates,
      relations,
      exportedAt: new Date(),
    };
  }
}
