import { eq, and } from 'drizzle-orm';
import { learners, learnerSessions, nodeStates } from './schema.js';
import { AppError } from '../../domain/errors.js';
export class DrizzleLearnerStateStore {
    db;
    logger;
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }
    async upsertLearner(learner) {
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
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'upsertLearner returned no row');
        return this.mapLearner(row);
    }
    async getLearnerById(id) {
        const [row] = await this.db.select().from(learners).where(eq(learners.id, id));
        return row ? this.mapLearner(row) : null;
    }
    async getLearnerByDiscordId(discordUserId) {
        const [row] = await this.db
            .select()
            .from(learners)
            .where(eq(learners.discordUserId, discordUserId));
        return row ? this.mapLearner(row) : null;
    }
    async createSession(input) {
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
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'createSession returned no row');
        return this.mapSession(row);
    }
    async getSession(id) {
        const [row] = await this.db
            .select()
            .from(learnerSessions)
            .where(eq(learnerSessions.id, id));
        return row ? this.mapSession(row) : null;
    }
    async getActiveSession(learnerId, pillar) {
        const [row] = await this.db
            .select()
            .from(learnerSessions)
            .where(and(eq(learnerSessions.learnerId, learnerId), eq(learnerSessions.pillar, pillar), eq(learnerSessions.status, 'active')));
        return row ? this.mapSession(row) : null;
    }
    async updateSessionStatus(id, status, currentNodeId) {
        const updateValues = {
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
        if (!row)
            throw new AppError('SESSION_NOT_FOUND', `Session not found: ${id}`);
        return this.mapSession(row);
    }
    async getNodeState(learnerId, nodeId) {
        const [row] = await this.db
            .select()
            .from(nodeStates)
            .where(and(eq(nodeStates.learnerId, learnerId), eq(nodeStates.nodeId, nodeId)));
        return row ? this.mapNodeState(row) : null;
    }
    async upsertNodeState(nodeState) {
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
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'upsertNodeState returned no row');
        return this.mapNodeState(row);
    }
    async getNodeStatesForLearner(learnerId) {
        const rows = await this.db
            .select()
            .from(nodeStates)
            .where(eq(nodeStates.learnerId, learnerId));
        return rows.map((r) => this.mapNodeState(r));
    }
    async getNodeStatesForSession(sessionId) {
        // Node states are per (learner, node) — join via session's learnerId
        const [session] = await this.db
            .select()
            .from(learnerSessions)
            .where(eq(learnerSessions.id, sessionId));
        if (!session)
            return [];
        return this.getNodeStatesForLearner(session.learnerId);
    }
    mapLearner(row) {
        return {
            id: row.id,
            discordUserId: row.discordUserId,
            currentPillar: row.currentPillar ?? null,
            currentSessionId: row.currentSessionId ?? null,
        };
    }
    mapSession(row) {
        return {
            id: row.id,
            learnerId: row.learnerId,
            status: row.status,
            pillar: row.pillar,
            currentNodeId: row.currentNodeId ?? null,
            channelId: row.channelId,
            metadata: (row.metadata ?? {}),
            startedAt: row.startedAt,
            updatedAt: row.updatedAt,
        };
    }
    mapNodeState(row) {
        return {
            id: row.id,
            learnerId: row.learnerId,
            nodeId: row.nodeId,
            status: row.status,
            masteryLevel: row.masteryLevel,
            attemptCount: row.attemptCount,
            lastScore: row.lastScore ?? null,
            lastSubmissionId: row.lastSubmissionId ?? null,
            nextReviewAt: row.nextReviewAt ?? null,
            passedAt: row.passedAt ?? null,
            updatedAt: row.updatedAt,
        };
    }
}
//# sourceMappingURL=DrizzleLearnerStateStore.js.map