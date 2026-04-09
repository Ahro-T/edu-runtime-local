import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../ports/SubmissionStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { Learner } from '../domain/learner/Learner.js';
import type { LearnerSession } from '../domain/learner/LearnerSession.js';
import type { NodeState } from '../domain/learner/NodeState.js';
import type { ReviewJob } from '../domain/learner/ReviewJob.js';
export interface DashboardData {
    learner: Learner;
    activeSessions: LearnerSession[];
    nodeStates: NodeState[];
    pendingReviews: ReviewJob[];
    totalSubmissions: number;
    passedNodes: number;
}
export interface DashboardServiceDeps {
    learnerStateStore: LearnerStateStore;
    learnerEventStore: LearnerEventStore;
    submissionStore: SubmissionStore;
    contentRepository: ContentRepository;
    logger: Logger;
}
export declare class DashboardService {
    private readonly store;
    private readonly eventStore;
    private readonly submissionStore;
    private readonly logger;
    constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger }: DashboardServiceDeps);
    getDashboard(learnerId: string): Promise<DashboardData>;
}
//# sourceMappingURL=DashboardService.d.ts.map