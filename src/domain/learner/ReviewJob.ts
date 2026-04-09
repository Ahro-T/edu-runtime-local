export type ReviewJobType = 'review' | 'retry' | 'reminder';

export type ReviewJobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface ReviewJob {
  id: string;
  learnerId: string;
  nodeId: string;
  jobType: ReviewJobType;
  status: ReviewJobStatus;
  scheduledFor: Date;
  payload: Record<string, unknown>;
}
