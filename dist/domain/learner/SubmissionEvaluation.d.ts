export type EvaluationResult = 'pass' | 'fail' | 'remediation';
export interface RubricSlotResult {
    slot: string;
    score: number;
    feedback: string;
}
export interface SubmissionEvaluation {
    submissionId: string;
    evaluatorModel: string;
    result: EvaluationResult;
    score: number;
    rubricSlots: RubricSlotResult[];
    feedback: string;
    missingPoints: string[];
}
//# sourceMappingURL=SubmissionEvaluation.d.ts.map