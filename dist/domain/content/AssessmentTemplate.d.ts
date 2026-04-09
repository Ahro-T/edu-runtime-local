export interface RubricRule {
    slot: string;
    description: string;
    weight?: number;
}
export interface Rubric {
    passRules: RubricRule[];
    failRules: RubricRule[];
    remediationRules: RubricRule[];
}
export interface AssessmentTemplate {
    id: string;
    nodeId: string;
    instructions: string;
    requiredSlots: string[];
    rubric: Rubric;
}
//# sourceMappingURL=AssessmentTemplate.d.ts.map