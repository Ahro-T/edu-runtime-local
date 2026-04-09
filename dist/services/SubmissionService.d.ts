import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../ports/SubmissionStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { Submission } from '../domain/learner/Submission.js';
export interface SubmissionServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    submissionStore: SubmissionStore;
    contentRepository: ContentRepository;
    logger: Logger;
}
export declare class SubmissionService {
    private readonly store;
    private readonly eventStore;
    private readonly submissionStore;
    private readonly content;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger }: SubmissionServiceDeps);
    recordSubmission(learnerId: string, sessionId: string, nodeId: string, rawAnswer: string): Promise<Submission>;
}
//# sourceMappingURL=SubmissionService.d.ts.map