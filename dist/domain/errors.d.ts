export interface AppErrorDefinition {
    code: string;
    httpStatus: number;
    retryable: boolean;
    messageTemplate: string;
}
export declare const ERROR_CODES: {
    readonly LEARNER_NOT_FOUND: {
        readonly code: "LEARNER_NOT_FOUND";
        readonly httpStatus: 404;
        readonly retryable: false;
        readonly messageTemplate: "Learner not found: {id}";
    };
    readonly SESSION_NOT_FOUND: {
        readonly code: "SESSION_NOT_FOUND";
        readonly httpStatus: 404;
        readonly retryable: false;
        readonly messageTemplate: "Session not found: {id}";
    };
    readonly NODE_NOT_FOUND: {
        readonly code: "NODE_NOT_FOUND";
        readonly httpStatus: 404;
        readonly retryable: false;
        readonly messageTemplate: "Knowledge node not found: {id}";
    };
    readonly TEMPLATE_NOT_FOUND: {
        readonly code: "TEMPLATE_NOT_FOUND";
        readonly httpStatus: 404;
        readonly retryable: false;
        readonly messageTemplate: "Assessment template not found: {id}";
    };
    readonly INVALID_TRANSITION: {
        readonly code: "INVALID_TRANSITION";
        readonly httpStatus: 422;
        readonly retryable: false;
        readonly messageTemplate: "Invalid state transition from {from} to {to}";
    };
    readonly EVALUATION_UNAVAILABLE: {
        readonly code: "EVALUATION_UNAVAILABLE";
        readonly httpStatus: 503;
        readonly retryable: true;
        readonly messageTemplate: "Evaluation engine is currently unavailable";
    };
    readonly CONTENT_VALIDATION_FAILED: {
        readonly code: "CONTENT_VALIDATION_FAILED";
        readonly httpStatus: 422;
        readonly retryable: false;
        readonly messageTemplate: "Content validation failed: {reason}";
    };
    readonly SUBMISSION_DUPLICATE: {
        readonly code: "SUBMISSION_DUPLICATE";
        readonly httpStatus: 409;
        readonly retryable: false;
        readonly messageTemplate: "Duplicate submission detected for node {nodeId}";
    };
    readonly REVIEW_JOB_CONFLICT: {
        readonly code: "REVIEW_JOB_CONFLICT";
        readonly httpStatus: 409;
        readonly retryable: false;
        readonly messageTemplate: "Review job already exists for learner {learnerId} and node {nodeId}";
    };
    readonly PILLAR_REQUIRED: {
        readonly code: "PILLAR_REQUIRED";
        readonly httpStatus: 400;
        readonly retryable: false;
        readonly messageTemplate: "A pillar must be specified to start a session";
    };
    readonly UNAUTHORIZED: {
        readonly code: "UNAUTHORIZED";
        readonly httpStatus: 401;
        readonly retryable: false;
        readonly messageTemplate: "Unauthorized: {reason}";
    };
    readonly INTERNAL_ERROR: {
        readonly code: "INTERNAL_ERROR";
        readonly httpStatus: 500;
        readonly retryable: true;
        readonly messageTemplate: "An internal error occurred: {reason}";
    };
};
export type ErrorCode = keyof typeof ERROR_CODES;
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly httpStatus: number;
    readonly retryable: boolean;
    constructor(code: ErrorCode, message?: string);
}
//# sourceMappingURL=errors.d.ts.map