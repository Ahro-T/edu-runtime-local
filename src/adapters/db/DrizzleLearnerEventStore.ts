import { eq } from 'drizzle-orm';
import type { DbClient } from './connection.js';
import { learningEvents } from './schema.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { LearningEvent, LearningEventType } from '../../domain/learner/LearningEvent.js';
import type { Logger } from '../../logger.js';
import { AppError } from '../../domain/errors.js';

export class DrizzleLearnerEventStore implements LearnerEventStore {
  constructor(
    private readonly db: DbClient,
    private readonly logger: Logger,
  ) {}

  async appendEvent(event: LearningEvent): Promise<LearningEvent> {
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
    if (!row) throw new AppError('INTERNAL_ERROR', 'appendEvent returned no row');
    return this.mapEvent(row);
  }

  async getEventsForLearner(learnerId: string): Promise<LearningEvent[]> {
    const rows = await this.db
      .select()
      .from(learningEvents)
      .where(eq(learningEvents.learnerId, learnerId));
    return rows.map((r) => this.mapEvent(r));
  }

  async getEventsForSession(sessionId: string): Promise<LearningEvent[]> {
    const rows = await this.db
      .select()
      .from(learningEvents)
      .where(eq(learningEvents.sessionId, sessionId));
    return rows.map((r) => this.mapEvent(r));
  }

  private mapEvent(row: typeof learningEvents.$inferSelect): LearningEvent {
    return {
      id: row.id,
      type: row.type as LearningEventType,
      learnerId: row.learnerId,
      sessionId: row.sessionId,
      nodeId: row.nodeId ?? null,
      timestamp: row.timestamp,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    };
  }
}
