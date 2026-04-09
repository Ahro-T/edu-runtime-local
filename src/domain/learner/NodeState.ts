export type NodeStatus = 'unseen' | 'studying' | 'passed' | 'remediation' | 'mastered';

import type { MasteryStageTarget } from '../content/types.js';

export type MasteryLevel = MasteryStageTarget;

export interface NodeState {
  id: string;
  learnerId: string;
  nodeId: string;
  status: NodeStatus;
  masteryLevel: MasteryLevel;
  attemptCount: number;
  lastScore: number | null;
  lastSubmissionId: string | null;
  nextReviewAt: Date | null;
  passedAt: Date | null;
  updatedAt: Date;
}
