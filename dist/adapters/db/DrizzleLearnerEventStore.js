import { eq } from 'drizzle-orm';
import { learningEvents, reviewJobs } from './schema.js';
import { AppError } from '../../domain/errors.js';
export class DrizzleLearnerEventStore {
    db;
    logger;
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }
    async appendEvent(event) {
        const [row] = await this.db
            .insert(learningEvents)
            .values({
            id: event.id,
            type: event.type,
            learnerId: event.learnerId,
            sessionId: event.sessionId,
            nodeId: event.nodeId,
            timestamp: event.timestamp,
            payload: event.payload,
        })
            .returning();
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'appendEvent returned no row');
        return this.mapEvent(row);
    }
    async getEventsForLearner(learnerId) {
        const rows = await this.db
            .select()
            .from(learningEvents)
            .where(eq(learningEvents.learnerId, learnerId));
        return rows.map((r) => this.mapEvent(r));
    }
    async getEventsForSession(sessionId) {
        const rows = await this.db
            .select()
            .from(learningEvents)
            .where(eq(learningEvents.sessionId, sessionId));
        return rows.map((r) => this.mapEvent(r));
    }
    async createReviewJob(job) {
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
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'createReviewJob returned no row');
        return this.mapJob(row);
    }
    async getPendingJobs(learnerId) {
        const query = this.db
            .select()
            .from(reviewJobs)
            .where(learnerId
            ? eq(reviewJobs.learnerId, learnerId)
            : eq(reviewJobs.status, 'pending'));
        const rows = await query;
        return rows.map((r) => this.mapJob(r));
    }
    async updateJobStatus(id, status) {
        const [row] = await this.db
            .update(reviewJobs)
            .set({ status })
            .where(eq(reviewJobs.id, id))
            .returning();
        if (!row)
            throw new AppError('INTERNAL_ERROR', `Review job not found: ${id}`);
        return this.mapJob(row);
    }
    mapEvent(row) {
        return {
            id: row.id,
            type: row.type,
            learnerId: row.learnerId,
            sessionId: row.sessionId,
            nodeId: row.nodeId ?? null,
            timestamp: row.timestamp,
            payload: (row.payload ?? {}),
        };
    }
    mapJob(row) {
        return {
            id: row.id,
            learnerId: row.learnerId,
            nodeId: row.nodeId,
            jobType: row.jobType,
            status: row.status,
            scheduledFor: row.scheduledFor,
            payload: (row.payload ?? {}),
        };
    }
}
//# sourceMappingURL=DrizzleLearnerEventStore.js.map