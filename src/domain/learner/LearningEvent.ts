export type LearningEventType =
  | 'learner_created'
  | 'learner_updated'
  | 'session_started'
  | 'node_started'
  | 'submission_recorded'
  | 'submission_passed'
  | 'submission_failed'
  | 'remediation_assigned'
  | 'review_scheduled'
  | 'pillar_completed';

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  learnerId: string;
  sessionId: string;
  nodeId: string | null;
  timestamp: Date;
  payload: Record<string, unknown>;
}
