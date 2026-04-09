import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { ReviewJob } from '../domain/learner/ReviewJob.js';
import { AppError } from '../domain/errors.js';

export interface ReviewServiceDeps {
  learnerStateStore: LearnerStateStore;
  learnerEventStore: LearnerEventStore;
  logger: Logger;
}

export interface ScheduleReviewOptions {
  scheduledFor?: Date;
  jobType?: 'review' | 'retry' | 'reminder';
}

export class ReviewService {
  private readonly store: LearnerStateStore;
  private readonly eventStore: LearnerEventStore;
  private readonly logger: Logger;

  constructor({ learnerStateStore, learnerEventStore, logger }: ReviewServiceDeps) {
    this.store = learnerStateStore;
    this.eventStore = learnerEventStore;
    this.logger = logger.child({ service: 'ReviewService' });
  }

  async scheduleReview(
    learnerId: string,
    nodeId: string,
    options: ScheduleReviewOptions = {},
  ): Promise<ReviewJob> {
    const log = this.logger.child({ learnerId, nodeId });

    // Verify learner exists
    const learner = await this.store.getLearnerById(learnerId);
    if (!learner) throw new AppError('LEARNER_NOT_FOUND', `Learner not found: ${learnerId}`);

    // Check for existing pending job (conflict check)
    const pending = await this.eventStore.getPendingJobs(learnerId);
    const conflict = pending.find((j) => j.nodeId === nodeId && j.status === 'pending');
    if (conflict) {
      throw new AppError('REVIEW_JOB_CONFLICT', `Review job already exists for learner ${learnerId} and node ${nodeId}`);
    }

    const scheduledFor = options.scheduledFor ?? new Date(Date.now() + 24 * 60 * 60 * 1000); // default: tomorrow
    const jobType = options.jobType ?? 'review';

    const job: ReviewJob = {
      id: randomUUID(),
      learnerId,
      nodeId,
      jobType,
      status: 'pending',
      scheduledFor,
      payload: {},
    };

    const saved = await this.eventStore.createReviewJob(job);

    // Update NodeState with nextReviewAt
    const nodeState = await this.store.getNodeState(learnerId, nodeId);
    if (nodeState) {
      await this.store.upsertNodeState({
        ...nodeState,
        nextReviewAt: scheduledFor,
        updatedAt: new Date(),
      });
    }

    await this.eventStore.appendEvent({
      id: randomUUID(),
      type: 'review_scheduled',
      learnerId,
      sessionId: 'none',
      nodeId,
      timestamp: new Date(),
      payload: { jobId: saved.id, scheduledFor: scheduledFor.toISOString() },
    });

    log.info({ jobId: saved.id, scheduledFor }, 'Review scheduled');
    return saved;
  }
}
