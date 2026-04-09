import { AppError } from '../errors.js';
const SESSION_TRANSITIONS = {
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
export function transitionSession(current, event) {
    if (current === null) {
        if (event === 'start')
            return 'active';
        throw new AppError('INVALID_TRANSITION', `Invalid session transition: cannot apply '${event}' to initial state`);
    }
    const next = SESSION_TRANSITIONS[current][event];
    if (next === undefined) {
        throw new AppError('INVALID_TRANSITION', `Invalid session transition: '${event}' not allowed from '${current}'`);
    }
    return next;
}
const NODE_TRANSITIONS = {
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
export function transitionNodeState(current, event) {
    const next = NODE_TRANSITIONS[current][event];
    if (next === undefined) {
        throw new AppError('INVALID_TRANSITION', `Invalid node state transition: '${event}' not allowed from '${current}'`);
    }
    return next;
}
//# sourceMappingURL=state-machines.js.map