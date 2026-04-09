import type { ReviewJob, ReviewJobStatus } from '../domain/learner/ReviewJob.js';

export interface ReviewJobStore {
  createReviewJob(job: ReviewJob): Promise<ReviewJob>;
  getPendingJobs(learnerId?: string): Promise<ReviewJob[]>;
  updateJobStatus(id: string, status: ReviewJobStatus): Promise<ReviewJob>;
}
