import { AppError } from '../domain/errors.js';
export class ContentService {
    store;
    content;
    logger;
    constructor({ learnerStateStore, contentRepository, logger }) {
        this.store = learnerStateStore;
        this.content = contentRepository;
        this.logger = logger.child({ service: 'ContentService' });
    }
    async getCurrentNode(learnerId, pillar) {
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
//# sourceMappingURL=ContentService.js.map