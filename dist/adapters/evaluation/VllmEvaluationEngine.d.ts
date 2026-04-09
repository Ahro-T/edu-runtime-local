import type { EvaluationEngine } from '../../ports/EvaluationEngine.js';
import type { Submission } from '../../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../../domain/learner/SubmissionEvaluation.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../domain/content/AssessmentTemplate.js';
export declare class VllmEvaluationEngine implements EvaluationEngine {
    private readonly vllmUrl;
    private readonly model;
    private readonly timeoutMs;
    constructor(options: {
        vllmUrl: string;
        model?: string;
        timeoutMs?: number;
    });
    evaluate(submission: Submission, node: KnowledgeNode, template: AssessmentTemplate): Promise<SubmissionEvaluation>;
    isAvailable(): Promise<boolean>;
    private callVllm;
}
//# sourceMappingURL=VllmEvaluationEngine.d.ts.map