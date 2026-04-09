import { randomUUID } from 'crypto';
import { AppError } from '../domain/errors.js';
export class SubmissionService {
    store;
    eventStore;
    submissionStore;
    content;
    logger;
    constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger }) {
        this.store = learnerStateStore;
        this.eventStore = learnerEventStore;
        this.submissionStore = submissionStore;
        this.content = contentRepository;
        this.logger = logger.child({ service: 'SubmissionService' });
    }
    async recordSubmission(learnerId, sessionId, nodeId, rawAnswer) {
        const log = this.logger.child({ learnerId, sessionId, nodeId });
        // Verify session exists
        const session = await this.store.getSession(sessionId);
        if (!session)
            throw new AppError('SESSION_NOT_FOUND', `Session not found: ${sessionId}`);
        // Verify node exists and get template
        const node = await this.content.getNodeById(nodeId);
        if (!node)
            throw new AppError('NODE_NOT_FOUND', `Node not found: ${nodeId}`);
        const template = await this.content.getTemplateByNodeId(nodeId);
        if (!template)
            throw new AppError('TEMPLATE_NOT_FOUND', `No template for node: ${nodeId}`);
        const submission = {
            id: randomUUID(),
            learnerId,
            sessionId,
            nodeId,
            templateId: template.id,
            rawAnswer,
            submittedAt: new Date(),
        };
        const saved = await this.submissionStore.createSubmission(submission);
        // Increment attemptCount on NodeState
        const existingState = await this.store.getNodeState(learnerId, nodeId);
        const now = new Date();
        const nodeState = existingState ?? {
            id: randomUUID(),
            learnerId,
            nodeId,
            status: 'studying',
            masteryLevel: 'descriptive',
            attemptCount: 0,
            lastScore: null,
            lastSubmissionId: null,
            nextReviewAt: null,
            passedAt: null,
            updatedAt: now,
        };
        await this.store.upsertNodeState({
            ...nodeState,
            attemptCount: nodeState.attemptCount + 1,
            lastSubmissionId: saved.id,
            updatedAt: now,
        });
        await this.eventStore.appendEvent({
            id: randomUUID(),
            type: 'submission_recorded',
            learnerId,
            sessionId,
            nodeId,
            timestamp: new Date(),
            payload: { submissionId: saved.id },
        });
        log.info({ submissionId: saved.id }, 'Submission recorded');
        return saved;
    }
}
//# sourceMappingURL=SubmissionService.js.map