import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../ports/SubmissionStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
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
  learnerEventStore: LearnerEventStore;
  submissionStore: SubmissionStore;
  contentRepository: ContentRepository;
  logger: Logger;
}

export class DashboardService {
  private readonly store: LearnerStateStore;
  private readonly eventStore: LearnerEventStore;
  private readonly submissionStore: SubmissionStore;
  private readonly logger: Logger;

  constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger }: DashboardServiceDeps) {
    this.store = learnerStateStore;
    this.eventStore = learnerEventStore;
    this.submissionStore = submissionStore;
    this.logger = logger.child({ service: 'DashboardService' });
  }

  async getDashboard(learnerId: string): Promise<DashboardData> {
    const log = this.logger.child({ learnerId });

    const learner = await this.store.getLearnerById(learnerId);
    if (!learner) throw new AppError('LEARNER_NOT_FOUND', `Learner not found: ${learnerId}`);

    const [nodeStates, pendingReviews] = await Promise.all([
      this.store.getNodeStatesForLearner(learnerId),
      this.eventStore.getPendingJobs(learnerId),
    ]);

    // Get active sessions across all pillars
    const pillars = ['agents', 'harnesses', 'openclaw'] as const;
    const sessionPromises = pillars.map((p) => this.store.getActiveSession(learnerId, p));
    const sessionsRaw = await Promise.all(sessionPromises);
    const activeSessions = sessionsRaw.filter((s): s is LearnerSession => s !== null);

    // Count total submissions for the learner (aggregate across all nodes)
    let totalSubmissions = 0;
    for (const ns of nodeStates) {
      const subs = await this.submissionStore.getSubmissionsForNode(learnerId, ns.nodeId);
      totalSubmissions += subs.length;
    }

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
