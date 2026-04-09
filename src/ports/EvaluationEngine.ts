import type { Submission } from '../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../domain/learner/SubmissionEvaluation.js';
import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../domain/content/AssessmentTemplate.js';

export interface EvaluationEngine {
  evaluate(
    submission: Submission,
    node: KnowledgeNode,
    template: AssessmentTemplate,
  ): Promise<SubmissionEvaluation>;
  isAvailable(): Promise<boolean>;
}
