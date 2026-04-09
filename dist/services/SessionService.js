import { randomUUID } from 'crypto';
import { AppError } from '../domain/errors.js';
import { transitionSession } from '../domain/learner/state-machines.js';
export class SessionService {
    store;
    eventStore;
    content;
    logger;
    constructor({ learnerStateStore, learnerEventStore, contentRepository, logger }) {
        this.store = learnerStateStore;
        this.eventStore = learnerEventStore;
        this.content = contentRepository;
        this.logger = logger.child({ service: 'SessionService' });
    }
    async startOrResume(learnerId, pillar, channelId = 'default') {
        const log = this.logger.child({ learnerId, pillar });
        const learner = await this.store.getLearnerById(learnerId);
        if (!learner)
            throw new AppError('LEARNER_NOT_FOUND', `Learner not found: ${learnerId}`);
        // Check for existing active session for this pillar
        const existing = await this.store.getActiveSession(learnerId, pillar);
        if (existing) {
            log.info({ sessionId: existing.id }, 'Resuming existing session');
            await this.eventStore.appendEvent({
                id: randomUUID(),
                type: 'session_started',
                learnerId,
                sessionId: existing.id,
                nodeId: existing.currentNodeId,
                timestamp: new Date(),
                payload: { event: 'session-resumed', pillar },
            });
            return existing;
        }
        // Find first node in the pillar for a new session
        const nodes = await this.content.listNodesByPillar(pillar);
        if (nodes.length === 0) {
            throw new AppError('NODE_NOT_FOUND', `No nodes found for pillar: ${pillar}`);
        }
        // Start with the first node (no prerequisites)
        const rootNode = nodes.find((n) => {
            // A root node has no prerequisites in the graph
            return true; // will use first node sorted by prereq chain
        }) ?? nodes[0];
        // Find node with no prerequisites (entry point)
        let entryNode = nodes[0];
        const allPrereqIds = new Set();
        for (const node of nodes) {
            const prereqs = await this.content.getPrerequisites(node.id);
            // nodes that ARE prerequisites of others are not entry points
            for (const p of prereqs)
                allPrereqIds.add(node.id);
        }
        // Actually: find node that is NOT a prerequisite of anything = entry point
        // Simpler: find node whose id doesn't appear as a prereq target
        // Entry node = has no prerequisites itself
        const nodesWithPrereqs = new Set();
        for (const node of nodes) {
            const prereqs = await this.content.getPrerequisites(node.id);
            if (prereqs.length > 0)
                nodesWithPrereqs.add(node.id);
        }
        entryNode = nodes.find((n) => !nodesWithPrereqs.has(n.id)) ?? nodes[0];
        if (!entryNode) {
            throw new AppError('NODE_NOT_FOUND', `No entry node found for pillar: ${pillar}`);
        }
        // Apply state machine: null -> active
        transitionSession(null, 'start');
        const session = await this.store.createSession({
            id: randomUUID(),
            learnerId,
            pillar,
            channelId,
            currentNodeId: entryNode.id,
            metadata: {},
        });
        // Update learner's currentPillar and currentSessionId
        await this.store.upsertLearner({
            ...learner,
            currentPillar: pillar,
            currentSessionId: session.id,
        });
        log.info({ sessionId: session.id, currentNodeId: entryNode.id }, 'Session started');
        await this.eventStore.appendEvent({
            id: randomUUID(),
            type: 'session_started',
            learnerId,
            sessionId: session.id,
            nodeId: entryNode.id,
            timestamp: new Date(),
            payload: { event: 'session-started', pillar },
        });
        return session;
    }
}
//# sourceMappingURL=SessionService.js.map