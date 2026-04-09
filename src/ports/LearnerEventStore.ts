import type { LearningEvent } from '../domain/learner/LearningEvent.js';
import type { ReviewJob, ReviewJobStatus } from '../domain/learner/ReviewJob.js';

export interface LearnerEventStore {
  // Event operations
  appendEvent(event: LearningEvent): Promise<LearningEvent>;
  getEventsForLearner(learnerId: string): Promise<LearningEvent[]>;
  getEventsForSession(sessionId: string): Promise<LearningEvent[]>;

  // Review job operations
  createReviewJob(job: ReviewJob): Promise<ReviewJob>;
  getPendingJobs(learnerId?: string): Promise<ReviewJob[]>;
  updateJobStatus(id: string, status: ReviewJobStatus): Promise<ReviewJob>;
}
