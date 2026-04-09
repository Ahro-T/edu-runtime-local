import type { Submission } from '../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../domain/learner/SubmissionEvaluation.js';

export interface SubmissionStore {
  // Submission operations
  createSubmission(submission: Submission): Promise<Submission>;
  getSubmission(id: string): Promise<Submission | null>;
  getSubmissionsForNode(learnerId: string, nodeId: string): Promise<Submission[]>;

  // Evaluation operations
  createEvaluation(evaluation: SubmissionEvaluation): Promise<SubmissionEvaluation>;
  getEvaluationForSubmission(submissionId: string): Promise<SubmissionEvaluation | null>;
}
