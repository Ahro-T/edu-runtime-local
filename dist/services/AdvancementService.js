import { randomUUID } from 'crypto';
import { AppError } from '../domain/errors.js';
export class AdvancementService {
    store;
    eventStore;
    content;
    logger;
    constructor({ learnerStateStore, learnerEventStore, contentRepository, logger }) {
        this.store = learnerStateStore;
        this.eventStore = learnerEventStore;
        this.content = contentRepository;
        this.logger = logger.child({ service: 'AdvancementService' });
    }
    async advanceNode(learnerId, pillar) {
        const log = this.logger.child({ learnerId, pillar });
        const session = await this.store.getActiveSession(learnerId, pillar);
        if (!session)
            throw new AppError('SESSION_NOT_FOUND', `No active session for learner ${learnerId} in pillar ${pillar}`);
        if (!session.currentNodeId) {
            throw new AppError('NODE_NOT_FOUND', `Session has no current node`);
        }
        const currentNode = await this.content.getNodeById(session.currentNodeId);
        if (!currentNode)
            throw new AppError('NODE_NOT_FOUND', `Node not found: ${session.currentNodeId}`);
        // Get all nodes in pillar and find which ones have currentNodeId as a prerequisite
        const allNodes = await this.content.listNodesByPillar(pillar);
        // Find next node: a node whose prerequisites include the current node
        let nextNode = null;
        for (const candidate of allNodes) {
            if (candidate.id === session.currentNodeId)
                continue;
            const prereqs = await this.content.getPrerequisites(candidate.id);
            if (prereqs.some((p) => p.id === session.currentNodeId)) {
                // Check if all prerequisites of candidate are passed
                const allPrereqsPassed = await Promise.all(prereqs.map(async (p) => {
                    const state = await this.store.getNodeState(learnerId, p.id);
                    return state?.status === 'passed' || state?.status === 'mastered';
                }));
                if (allPrereqsPassed.every(Boolean)) {
                    nextNode = candidate;
                    break;
                }
            }
        }
        if (!nextNode) {
            // Pillar completed
            log.info('All nodes in pillar completed');
            await this.store.updateSessionStatus(session.id, 'completed', null);
            await this.eventStore.appendEvent({
                id: randomUUID(),
                type: 'session_started', // no pillar-completed event type; use session_started as proxy
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
//# sourceMappingURL=AdvancementService.js.map