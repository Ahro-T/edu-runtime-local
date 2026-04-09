import { randomUUID } from 'crypto';
import { AppError } from '../domain/errors.js';
export class ReviewService {
    store;
    eventStore;
    logger;
    constructor({ learnerStateStore, learnerEventStore, logger }) {
        this.store = learnerStateStore;
        this.eventStore = learnerEventStore;
        this.logger = logger.child({ service: 'ReviewService' });
    }
    async scheduleReview(learnerId, nodeId, options = {}) {
        const log = this.logger.child({ learnerId, nodeId });
        // Verify learner exists
        const learner = await this.store.getLearnerById(learnerId);
        if (!learner)
            throw new AppError('LEARNER_NOT_FOUND', `Learner not found: ${learnerId}`);
        // Check for existing pending job (conflict check)
        const pending = await this.eventStore.getPendingJobs(learnerId);
        const conflict = pending.find((j) => j.nodeId === nodeId && j.status === 'pending');
        if (conflict) {
            throw new AppError('REVIEW_JOB_CONFLICT', `Review job already exists for learner ${learnerId} and node ${nodeId}`);
        }
        const scheduledFor = options.scheduledFor ?? new Date(Date.now() + 24 * 60 * 60 * 1000); // default: tomorrow
        const jobType = options.jobType ?? 'review';
        const job = {
            id: randomUUID(),
            learnerId,
            nodeId,
            jobType,
            status: 'pending',
            scheduledFor,
            payload: {},
        };
        const saved = await this.eventStore.createReviewJob(job);
        // Update NodeState with nextReviewAt
        const nodeState = await this.store.getNodeState(learnerId, nodeId);
        if (nodeState) {
            await this.store.upsertNodeState({
                ...nodeState,
                nextReviewAt: scheduledFor,
                updatedAt: new Date(),
            });
        }
        await this.eventStore.appendEvent({
            id: randomUUID(),
            type: 'review_scheduled',
            learnerId,
            sessionId: 'none',
            nodeId,
            timestamp: new Date(),
            payload: { jobId: saved.id, scheduledFor: scheduledFor.toISOString() },
        });
        log.info({ jobId: saved.id, scheduledFor }, 'Review scheduled');
        return saved;
    }
}
//# sourceMappingURL=ReviewService.js.map