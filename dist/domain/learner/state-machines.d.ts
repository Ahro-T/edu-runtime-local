import type { SessionStatus } from './LearnerSession.js';
import type { NodeStatus } from './NodeState.js';
export type SessionEvent = 'start' | 'pause' | 'resume' | 'complete' | 'abandon';
/**
 * Transition a session from its current status given an event.
 * Passing null as current simulates the initial `start` transition (none -> active).
 */
export declare function transitionSession(current: SessionStatus | null, event: SessionEvent): SessionStatus;
export type NodeStateEvent = 'start_study' | 'pass' | 'fail_remediation' | 'resume_study' | 'master' | 'review';
/**
 * Transition a node state from its current status given an event.
 */
export declare function transitionNodeState(current: NodeStatus, event: NodeStateEvent): NodeStatus;
//# sourceMappingURL=state-machines.d.ts.map