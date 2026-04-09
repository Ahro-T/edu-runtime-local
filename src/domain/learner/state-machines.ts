import { AppError } from '../errors.js';
import type { SessionStatus } from './LearnerSession.js';
import type { NodeStatus } from './NodeState.js';

// ---- Session state machine ----

export type SessionEvent =
  | 'start'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'abandon';

const SESSION_TRANSITIONS: Record<SessionStatus, Partial<Record<SessionEvent, SessionStatus>>> = {
  // none -> active is represented as null -> active (handled separately)
  active: {
    pause: 'paused',
    complete: 'completed',
    abandon: 'abandoned',
  },
  paused: {
    resume: 'active',
    abandon: 'abandoned',
  },
  completed: {},
  abandoned: {},
};

/**
 * Transition a session from its current status given an event.
 * Passing null as current simulates the initial `start` transition (none -> active).
 */
export function transitionSession(
  current: SessionStatus | null,
  event: SessionEvent,
): SessionStatus {
  if (current === null) {
    if (event === 'start') return 'active';
    throw new AppError(
      'INVALID_TRANSITION',
      `Invalid session transition: cannot apply '${event}' to initial state`,
    );
  }

  const next = SESSION_TRANSITIONS[current][event];
  if (next === undefined) {
    throw new AppError(
      'INVALID_TRANSITION',
      `Invalid session transition: '${event}' not allowed from '${current}'`,
    );
  }
  return next;
}

// ---- NodeState state machine ----

export type NodeStateEvent =
  | 'start_study'
  | 'pass'
  | 'fail_remediation'
  | 'resume_study'
  | 'master'
  | 'review';

const NODE_TRANSITIONS: Record<NodeStatus, Partial<Record<NodeStateEvent, NodeStatus>>> = {
  unseen: {
    start_study: 'studying',
  },
  studying: {
    pass: 'passed',
    fail_remediation: 'remediation',
  },
  passed: {
    master: 'mastered',
    review: 'studying',
  },
  remediation: {
    resume_study: 'studying',
  },
  mastered: {
    review: 'studying',
  },
};

/**
 * Transition a node state from its current status given an event.
 */
export function transitionNodeState(current: NodeStatus, event: NodeStateEvent): NodeStatus {
  const next = NODE_TRANSITIONS[current][event];
  if (next === undefined) {
    throw new AppError(
      'INVALID_TRANSITION',
      `Invalid node state transition: '${event}' not allowed from '${current}'`,
    );
  }
  return next;
}
