import type { Pillar } from '../content/types.js';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export interface LearnerSession {
    id: string;
    learnerId: string;
    status: SessionStatus;
    pillar: Pillar;
    currentNodeId: string | null;
    channelId: string;
    metadata: Record<string, unknown>;
    startedAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=LearnerSession.d.ts.map