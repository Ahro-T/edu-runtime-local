import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { ReviewJobStore } from '../ports/ReviewJobStore.js';
import type { SubmissionStore } from '../ports/SubmissionStore.js';
import type { Learner } from '../domain/learner/Learner.js';
import type { LearnerSession } from '../domain/learner/LearnerSession.js';
import type { NodeState } from '../domain/learner/NodeState.js';
import type { ReviewJob } from '../domain/learner/ReviewJob.js';
import { AppError } from '../domain/errors.js';

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
  reviewJobStore: ReviewJobStore;
  submissionStore: SubmissionStore;
  logger: Logger;
}

export class DashboardService {
  private readonly store: LearnerStateStore;
  private readonly reviewJobStore: ReviewJobStore;
  private readonly submissionStore: SubmissionStore;
  private readonly logger: Logger;

  constructor({ learnerStateStore, reviewJobStore, submissionStore, logger }: DashboardServiceDeps) {
    this.store = learnerStateStore;
    this.reviewJobStore = reviewJobStore;
    this.submissionStore = submissionStore;
    this.logger = logger.child({ service: 'DashboardService' });
  }

  async getDashboard(learnerId: string): Promise<DashboardData> {
    const log = this.logger.child({ learnerId });

    const learner = await this.store.getLearnerById(learnerId);
    if (!learner) throw new AppError('LEARNER_NOT_FOUND', `Learner not found: ${learnerId}`);

    const [nodeStates, pendingReviews, totalSubmissions] = await Promise.all([
      this.store.getNodeStatesForLearner(learnerId),
      this.reviewJobStore.getPendingJobs(learnerId),
      this.submissionStore.countSubmissionsForLearner(learnerId),
    ]);

    // Get active sessions across all pillars
    const pillars = ['agents', 'harnesses', 'openclaw'] as const;
    const sessionPromises = pillars.map((p) => this.store.getActiveSession(learnerId, p));
    const sessionsRaw = await Promise.all(sessionPromises);
    const activeSessions = sessionsRaw.filter((s): s is LearnerSession => s !== null);

    const passedNodes = nodeStates.filter(
      (ns) => ns.status === 'passed' || ns.status === 'mastered',
    ).length;

    log.debug({ passedNodes, totalSubmissions }, 'Dashboard assembled');
    return {
      learner,
      activeSessions,
      nodeStates,
      pendingReviews,
      totalSubmissions,
      passedNodes,
    };
  }
}
