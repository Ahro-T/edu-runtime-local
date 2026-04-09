import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { Pillar } from '../domain/content/types.js';
import { AppError } from '../domain/errors.js';

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

export class AdvancementService {
  private readonly store: LearnerStateStore;
  private readonly eventStore: LearnerEventStore;
  private readonly content: ContentRepository;
  private readonly logger: Logger;

  constructor({ learnerStateStore, learnerEventStore, contentRepository, logger }: AdvancementServiceDeps) {
    this.store = learnerStateStore;
    this.eventStore = learnerEventStore;
    this.content = contentRepository;
    this.logger = logger.child({ service: 'AdvancementService' });
  }

  async advanceNode(learnerId: string, pillar: Pillar): Promise<AdvancementResult> {
    const log = this.logger.child({ learnerId, pillar });

    const session = await this.store.getActiveSession(learnerId, pillar);
    if (!session) throw new AppError('SESSION_NOT_FOUND', `No active session for learner ${learnerId} in pillar ${pillar}`);

    if (!session.currentNodeId) {
      throw new AppError('NODE_NOT_FOUND', `Session has no current node`);
    }

    const currentNode = await this.content.getNodeById(session.currentNodeId);
    if (!currentNode) throw new AppError('NODE_NOT_FOUND', `Node not found: ${session.currentNodeId}`);

    // Get all nodes and all learner states in single queries
    const [allNodes, allStates] = await Promise.all([
      this.content.listNodesByPillar(pillar),
      this.store.getNodeStatesForLearner(learnerId),
    ]);

    const passedIds = new Set(
      allStates
        .filter((s) => s.status === 'passed' || s.status === 'mastered')
        .map((s) => s.nodeId),
    );

    // Find next node: a node whose prerequisites include the current node and are all passed
    const nextNode = allNodes.find((candidate) => {
      if (candidate.id === session.currentNodeId) return false;
      if (!candidate.prerequisites.includes(session.currentNodeId!)) return false;
      return candidate.prerequisites.every((pid) => passedIds.has(pid));
    }) ?? null;

    if (!nextNode) {
      // Pillar completed
      log.info('All nodes in pillar completed');
      await this.store.updateSessionStatus(session.id, 'completed', null);
      await this.eventStore.appendEvent({
        id: randomUUID(),
        type: 'pillar_completed',
        learnerId,
        sessionId: session.id,
        nodeId: session.currentNodeId,
        timestamp: new Date(),
        payload: { event: 'pillar-completed', pillar },
      });
      return { advanced: false, pillarCompleted: true, nextNode: null };
    }

    // Advance session to next node
    await this.store.updateSessionStatus(session.id, 'active', nextNode.id);

    // Initialize node state for next node if not exists
    const existingState = await this.store.getNodeState(learnerId, nextNode.id);
    if (!existingState) {
      await this.store.upsertNodeState({
        id: randomUUID(),
        learnerId,
        nodeId: nextNode.id,
        status: 'studying',
        masteryLevel: 'descriptive',
        attemptCount: 0,
        lastScore: null,
        lastSubmissionId: null,
        nextReviewAt: null,
        passedAt: null,
        updatedAt: new Date(),
      });
    }

    await this.eventStore.appendEvent({
      id: randomUUID(),
      type: 'node_started',
      learnerId,
      sessionId: session.id,
      nodeId: nextNode.id,
      timestamp: new Date(),
      payload: { event: 'node-advanced', previousNodeId: session.currentNodeId },
    });

    log.info({ nextNodeId: nextNode.id }, 'Advanced to next node');
    return { advanced: true, pillarCompleted: false, nextNode };
  }
}
