import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { Pillar } from '../domain/content/types.js';
import { AppError } from '../domain/errors.js';

export interface ContentServiceDeps {
  learnerStateStore: LearnerStateStore;
  contentRepository: ContentRepository;
  logger: Logger;
}

export class ContentService {
  private readonly store: LearnerStateStore;
  private readonly content: ContentRepository;
  private readonly logger: Logger;

  constructor({ learnerStateStore, contentRepository, logger }: ContentServiceDeps) {
    this.store = learnerStateStore;
    this.content = contentRepository;
    this.logger = logger.child({ service: 'ContentService' });
  }

  async getCurrentNode(learnerId: string, pillar: Pillar): Promise<KnowledgeNode> {
    const log = this.logger.child({ learnerId, pillar });

    const session = await this.store.getActiveSession(learnerId, pillar);
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', `No active session for learner ${learnerId} in pillar ${pillar}`);
    }

    if (!session.currentNodeId) {
      throw new AppError('NODE_NOT_FOUND', `Session has no current node`);
    }

    const node = await this.content.getNodeById(session.currentNodeId);
    if (!node) {
      throw new AppError('NODE_NOT_FOUND', `Node not found: ${session.currentNodeId}`);
    }

    log.debug({ nodeId: node.id, nodeTitle: node.title }, 'Current node resolved');
    return node;
  }
}
