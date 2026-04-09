export interface AppErrorDefinition {
  code: string;
  httpStatus: number;
  retryable: boolean;
  messageTemplate: string;
}

export const ERROR_CODES = {
  LEARNER_NOT_FOUND: {
    code: 'LEARNER_NOT_FOUND',
    httpStatus: 404,
    retryable: false,
    messageTemplate: 'Learner not found: {id}',
  },
  SESSION_NOT_FOUND: {
    code: 'SESSION_NOT_FOUND',
    httpStatus: 404,
    retryable: false,
    messageTemplate: 'Session not found: {id}',
  },
  NODE_NOT_FOUND: {
    code: 'NODE_NOT_FOUND',
    httpStatus: 404,
    retryable: false,
    messageTemplate: 'Knowledge node not found: {id}',
  },
  TEMPLATE_NOT_FOUND: {
    code: 'TEMPLATE_NOT_FOUND',
    httpStatus: 404,
    retryable: false,
    messageTemplate: 'Assessment template not found: {id}',
  },
  INVALID_TRANSITION: {
    code: 'INVALID_TRANSITION',
    httpStatus: 422,
    retryable: false,
    messageTemplate: 'Invalid state transition from {from} to {to}',
  },
  EVALUATION_UNAVAILABLE: {
    code: 'EVALUATION_UNAVAILABLE',
    httpStatus: 503,
    retryable: true,
    messageTemplate: 'Evaluation engine is currently unavailable',
  },
  CONTENT_VALIDATION_FAILED: {
    code: 'CONTENT_VALIDATION_FAILED',
    httpStatus: 422,
    retryable: false,
    messageTemplate: 'Content validation failed: {reason}',
  },
  SUBMISSION_DUPLICATE: {
    code: 'SUBMISSION_DUPLICATE',
    httpStatus: 409,
    retryable: false,
    messageTemplate: 'Duplicate submission detected for node {nodeId}',
  },
  REVIEW_JOB_CONFLICT: {
    code: 'REVIEW_JOB_CONFLICT',
    httpStatus: 409,
    retryable: false,
    messageTemplate: 'Review job already exists for learner {learnerId} and node {nodeId}',
  },
  PILLAR_REQUIRED: {
    code: 'PILLAR_REQUIRED',
    httpStatus: 400,
    retryable: false,
    messageTemplate: 'A pillar must be specified to start a session',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    httpStatus: 401,
    retryable: false,
    messageTemplate: 'Unauthorized: {reason}',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    httpStatus: 500,
    retryable: true,
    messageTemplate: 'An internal error occurred: {reason}',
  },
} as const satisfies Record<string, AppErrorDefinition>;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message?: string) {
    const def = ERROR_CODES[code];
    super(message ?? def.messageTemplate);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = def.httpStatus;
    this.retryable = def.retryable;
  }
}
