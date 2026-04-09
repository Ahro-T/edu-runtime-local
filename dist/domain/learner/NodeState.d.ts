export type NodeStatus = 'unseen' | 'studying' | 'passed' | 'remediation' | 'mastered';
export type MasteryLevel = 'quiz' | 'descriptive' | 'explain' | 'apply';
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
//# sourceMappingURL=NodeState.d.ts.map