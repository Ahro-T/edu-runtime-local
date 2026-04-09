import type { Learner } from '../domain/learner/Learner.js';
import type { LearnerSession, SessionStatus } from '../domain/learner/LearnerSession.js';
import type { NodeState } from '../domain/learner/NodeState.js';
import type { Pillar } from '../domain/content/types.js';
export interface CreateSessionInput {
    id: string;
    learnerId: string;
    pillar: Pillar;
    channelId: string;
    currentNodeId?: string | null;
    metadata?: Record<string, unknown>;
}
export interface LearnerStateStore {
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
}
//# sourceMappingURL=LearnerStateStore.d.ts.map