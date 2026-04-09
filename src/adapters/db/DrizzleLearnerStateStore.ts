import { eq, and } from 'drizzle-orm';
import type { DbClient } from './connection.js';
import { learners, learnerSessions, nodeStates } from './schema.js';
import type { LearnerStateStore, CreateSessionInput } from '../../ports/LearnerStateStore.js';
import type { Learner } from '../../domain/learner/Learner.js';
import type { LearnerSession, SessionStatus } from '../../domain/learner/LearnerSession.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import type { Pillar } from '../../domain/content/types.js';
import type { Logger } from '../../logger.js';
import { AppError } from '../../domain/errors.js';

export class DrizzleLearnerStateStore implements LearnerStateStore {
  constructor(
    private readonly db: DbClient,
    private readonly logger: Logger,
  ) {}

  async upsertLearner(learner: Learner): Promise<Learner> {
    const [row] = await this.db
      .insert(learners)
      .values({
        id: learner.id,
        discordUserId: learner.discordUserId,
        currentPillar: learner.currentPillar,
        currentSessionId: learner.currentSessionId,
      })
      .onConflictDoUpdate({
        target: learners.id,
        set: {
          currentPillar: learner.currentPillar,
          currentSessionId: learner.currentSessionId,
        },
      })
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', 'upsertLearner returned no row');
    return this.mapLearner(row);
  }

  async getLearnerById(id: string): Promise<Learner | null> {
    const [row] = await this.db.select().from(learners).where(eq(learners.id, id));
    return row ? this.mapLearner(row) : null;
  }

  async getLearnerByDiscordId(discordUserId: string): Promise<Learner | null> {
    const [row] = await this.db
      .select()
      .from(learners)
      .where(eq(learners.discordUserId, discordUserId));
    return row ? this.mapLearner(row) : null;
  }

  async createSession(input: CreateSessionInput): Promise<LearnerSession> {
    const [row] = await this.db
      .insert(learnerSessions)
      .values({
        id: input.id,
        learnerId: input.learnerId,
        status: 'active',
        pillar: input.pillar,
        currentNodeId: input.currentNodeId ?? null,
        channelId: input.channelId,
        metadata: input.metadata ?? {},
      })
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', 'createSession returned no row');
    return this.mapSession(row);
  }

  async getSession(id: string): Promise<LearnerSession | null> {
    const [row] = await this.db
      .select()
      .from(learnerSessions)
      .where(eq(learnerSessions.id, id));
    return row ? this.mapSession(row) : null;
  }

  async getActiveSession(learnerId: string, pillar: Pillar): Promise<LearnerSession | null> {
    const [row] = await this.db
      .select()
      .from(learnerSessions)
      .where(
        and(
          eq(learnerSessions.learnerId, learnerId),
          eq(learnerSessions.pillar, pillar),
          eq(learnerSessions.status, 'active'),
        ),
      );
    return row ? this.mapSession(row) : null;
  }

  async updateSessionStatus(
    id: string,
    status: SessionStatus,
    currentNodeId?: string | null,
  ): Promise<LearnerSession> {
    const updateValues: Partial<typeof learnerSessions.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };
    if (currentNodeId !== undefined) {
      updateValues.currentNodeId = currentNodeId;
    }
    const [row] = await this.db
      .update(learnerSessions)
      .set(updateValues)
      .where(eq(learnerSessions.id, id))
      .returning();
    if (!row) throw new AppError('SESSION_NOT_FOUND', `Session not found: ${id}`);
    return this.mapSession(row);
  }

  async getNodeState(learnerId: string, nodeId: string): Promise<NodeState | null> {
    const [row] = await this.db
      .select()
      .from(nodeStates)
      .where(and(eq(nodeStates.learnerId, learnerId), eq(nodeStates.nodeId, nodeId)));
    return row ? this.mapNodeState(row) : null;
  }

  async upsertNodeState(nodeState: NodeState): Promise<NodeState> {
    const [row] = await this.db
      .insert(nodeStates)
      .values({
        id: nodeState.id,
        learnerId: nodeState.learnerId,
        nodeId: nodeState.nodeId,
        status: nodeState.status,
        masteryLevel: nodeState.masteryLevel,
        attemptCount: nodeState.attemptCount,
        lastScore: nodeState.lastScore,
        lastSubmissionId: nodeState.lastSubmissionId,
        nextReviewAt: nodeState.nextReviewAt,
        passedAt: nodeState.passedAt,
        updatedAt: nodeState.updatedAt,
      })
      .onConflictDoUpdate({
        target: [nodeStates.learnerId, nodeStates.nodeId],
        set: {
          status: nodeState.status,
          masteryLevel: nodeState.masteryLevel,
          attemptCount: nodeState.attemptCount,
          lastScore: nodeState.lastScore,
          lastSubmissionId: nodeState.lastSubmissionId,
          nextReviewAt: nodeState.nextReviewAt,
          passedAt: nodeState.passedAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', 'upsertNodeState returned no row');
    return this.mapNodeState(row);
  }

  async getNodeStatesForLearner(learnerId: string): Promise<NodeState[]> {
    const rows = await this.db
      .select()
      .from(nodeStates)
      .where(eq(nodeStates.learnerId, learnerId));
    return rows.map((r) => this.mapNodeState(r));
  }

  async getNodeStatesForSession(sessionId: string): Promise<NodeState[]> {
    // Node states are per (learner, node) — join via session's learnerId
    const [session] = await this.db
      .select()
      .from(learnerSessions)
      .where(eq(learnerSessions.id, sessionId));
    if (!session) return [];
    return this.getNodeStatesForLearner(session.learnerId);
  }

  private mapLearner(row: typeof learners.$inferSelect): Learner {
    return {
      id: row.id,
      discordUserId: row.discordUserId,
      currentPillar: (row.currentPillar as Pillar | null) ?? null,
      currentSessionId: row.currentSessionId ?? null,
    };
  }

  private mapSession(row: typeof learnerSessions.$inferSelect): LearnerSession {
    return {
      id: row.id,
      learnerId: row.learnerId,
      status: row.status as SessionStatus,
      pillar: row.pillar as Pillar,
      currentNodeId: row.currentNodeId ?? null,
      channelId: row.channelId,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      startedAt: row.startedAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapNodeState(row: typeof nodeStates.$inferSelect): NodeState {
    return {
      id: row.id,
      learnerId: row.learnerId,
      nodeId: row.nodeId,
      status: row.status as NodeState['status'],
      masteryLevel: row.masteryLevel as NodeState['masteryLevel'],
      attemptCount: row.attemptCount,
      lastScore: row.lastScore ?? null,
      lastSubmissionId: row.lastSubmissionId ?? null,
      nextReviewAt: row.nextReviewAt ?? null,
      passedAt: row.passedAt ?? null,
      updatedAt: row.updatedAt,
    };
  }
}
