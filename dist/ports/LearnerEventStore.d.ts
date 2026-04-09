import type { LearningEvent } from '../domain/learner/LearningEvent.js';
import type { ReviewJob, ReviewJobStatus } from '../domain/learner/ReviewJob.js';
export interface LearnerEventStore {
    appendEvent(event: LearningEvent): Promise<LearningEvent>;
    getEventsForLearner(learnerId: string): Promise<LearningEvent[]>;
    getEventsForSession(sessionId: string): Promise<LearningEvent[]>;
    createReviewJob(job: ReviewJob): Promise<ReviewJob>;
    getPendingJobs(learnerId?: string): Promise<ReviewJob[]>;
    updateJobStatus(id: string, status: ReviewJobStatus): Promise<ReviewJob>;
}
//# sourceMappingURL=LearnerEventStore.d.ts.map