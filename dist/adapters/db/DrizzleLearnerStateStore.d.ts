import type { DbClient } from './connection.js';
import type { LearnerStateStore, CreateSessionInput } from '../../ports/LearnerStateStore.js';
import type { Learner } from '../../domain/learner/Learner.js';
import type { LearnerSession, SessionStatus } from '../../domain/learner/LearnerSession.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import type { Pillar } from '../../domain/content/types.js';
import type { Logger } from '../../logger.js';
export declare class DrizzleLearnerStateStore implements LearnerStateStore {
    private readonly db;
    private readonly logger;
    constructor(db: DbClient, logger: Logger);
    upsertLearner(learner: Learner): Promise<Learner>;
    getLearnerById(id: string): Promise<Learner | null>;
    getLearnerByDiscordId(discordUserId: string): Promise<Learner | null>;
    createSession(input: CreateSessionInput): Promise<LearnerSession>;
    getSession(id: string): Promise<LearnerSession | null>;
    getActiveSession(learnerId: string, pillar: Pillar): Promise<LearnerSession | null>;
    updateSessionStatus(id: string, status: SessionStatus, currentNodeId?: string | null): Promise<LearnerSession>;
    getNodeState(learnerId: string, nodeId: string): Promise<NodeState | null>;
    upsertNodeState(nodeState: NodeState): Promise<NodeState>;
    getNodeStatesForLearner(learnerId: string): Promise<NodeState[]>;
    getNodeStatesForSession(sessionId: string): Promise<NodeState[]>;
    private mapLearner;
    private mapSession;
    private mapNodeState;
}
//# sourceMappingURL=DrizzleLearnerStateStore.d.ts.map