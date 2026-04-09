import type { DbClient } from './connection.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { LearningEvent } from '../../domain/learner/LearningEvent.js';
import type { ReviewJob, ReviewJobStatus } from '../../domain/learner/ReviewJob.js';
import type { Logger } from '../../logger.js';
export declare class DrizzleLearnerEventStore implements LearnerEventStore {
    private readonly db;
    private readonly logger;
    constructor(db: DbClient, logger: Logger);
    appendEvent(event: LearningEvent): Promise<LearningEvent>;
    getEventsForLearner(learnerId: string): Promise<LearningEvent[]>;
    getEventsForSession(sessionId: string): Promise<LearningEvent[]>;
    createReviewJob(job: ReviewJob): Promise<ReviewJob>;
    getPendingJobs(learnerId?: string): Promise<ReviewJob[]>;
    updateJobStatus(id: string, status: ReviewJobStatus): Promise<ReviewJob>;
    private mapEvent;
    private mapJob;
}
//# sourceMappingURL=DrizzleLearnerEventStore.d.ts.map