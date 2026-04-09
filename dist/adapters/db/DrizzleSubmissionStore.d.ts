import type { DbClient } from './connection.js';
import type { SubmissionStore } from '../../ports/SubmissionStore.js';
import type { Submission } from '../../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../../domain/learner/SubmissionEvaluation.js';
import type { Logger } from '../../logger.js';
export declare class DrizzleSubmissionStore implements SubmissionStore {
    private readonly db;
    private readonly logger;
    constructor(db: DbClient, logger: Logger);
    createSubmission(submission: Submission): Promise<Submission>;
    getSubmission(id: string): Promise<Submission | null>;
    getSubmissionsForNode(learnerId: string, nodeId: string): Promise<Submission[]>;
    createEvaluation(evaluation: SubmissionEvaluation): Promise<SubmissionEvaluation>;
    getEvaluationForSubmission(submissionId: string): Promise<SubmissionEvaluation | null>;
    private mapSubmission;
    private mapEvaluation;
}
//# sourceMappingURL=DrizzleSubmissionStore.d.ts.map