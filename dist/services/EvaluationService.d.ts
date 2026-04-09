import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../ports/SubmissionStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { EvaluationEngine } from '../ports/EvaluationEngine.js';
import type { SubmissionEvaluation } from '../domain/learner/SubmissionEvaluation.js';
export interface EvaluationServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    submissionStore: SubmissionStore;
    contentRepository: ContentRepository;
    evaluationEngine: EvaluationEngine;
    logger: Logger;
}
export declare class EvaluationService {
    private readonly store;
    private readonly eventStore;
    private readonly submissionStore;
    private readonly content;
    private readonly engine;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, evaluationEngine, logger }: EvaluationServiceDeps);
    evaluateSubmission(submissionId: string): Promise<SubmissionEvaluation>;
}
//# sourceMappingURL=EvaluationService.d.ts.map