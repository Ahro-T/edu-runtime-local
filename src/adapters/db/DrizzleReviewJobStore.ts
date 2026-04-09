import { eq } from 'drizzle-orm';
import type { DbClient } from './connection.js';
import { reviewJobs } from './schema.js';
import type { ReviewJobStore } from '../../ports/ReviewJobStore.js';
import type { ReviewJob, ReviewJobStatus, ReviewJobType } from '../../domain/learner/ReviewJob.js';
import type { Logger } from '../../logger.js';
import { AppError } from '../../domain/errors.js';

export class DrizzleReviewJobStore implements ReviewJobStore {
  constructor(
    private readonly db: DbClient,
    private readonly logger: Logger,
  ) {}

  async createReviewJob(job: ReviewJob): Promise<ReviewJob> {
    const [row] = await this.db
      .insert(reviewJobs)
      .values({
        id: job.id,
        learnerId: job.learnerId,
        nodeId: job.nodeId,
        jobType: job.jobType,
        status: job.status,
        scheduledFor: job.scheduledFor,
        payload: job.payload,
      })
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', 'createReviewJob returned no row');
    return this.mapJob(row);
  }

  async getPendingJobs(learnerId?: string): Promise<ReviewJob[]> {
    const query = this.db
      .select()
      .from(reviewJobs)
      .where(
        learnerId
          ? eq(reviewJobs.learnerId, learnerId)
          : eq(reviewJobs.status, 'pending'),
      );
    const rows = await query;
    return rows.map((r) => this.mapJob(r));
  }

  async updateJobStatus(id: string, status: ReviewJobStatus): Promise<ReviewJob> {
    const [row] = await this.db
      .update(reviewJobs)
      .set({ status })
      .where(eq(reviewJobs.id, id))
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', `Review job not found: ${id}`);
    return this.mapJob(row);
  }

  private mapJob(row: typeof reviewJobs.$inferSelect): ReviewJob {
    return {
      id: row.id,
      learnerId: row.learnerId,
      nodeId: row.nodeId,
      jobType: row.jobType as ReviewJobType,
      status: row.status as ReviewJobStatus,
      scheduledFor: row.scheduledFor,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    };
  }
}
