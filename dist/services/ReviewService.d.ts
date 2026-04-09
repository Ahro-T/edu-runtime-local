import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { ReviewJob } from '../domain/learner/ReviewJob.js';
export interface ReviewServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    logger: Logger;
}
export interface ScheduleReviewOptions {
    scheduledFor?: Date;
    jobType?: 'review' | 'retry' | 'reminder';
}
export declare class ReviewService {
    private readonly store;
    private readonly eventStore;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, logger }: ReviewServiceDeps);
    scheduleReview(learnerId: string, nodeId: string, options?: ScheduleReviewOptions): Promise<ReviewJob>;
}
//# sourceMappingURL=ReviewService.d.ts.map