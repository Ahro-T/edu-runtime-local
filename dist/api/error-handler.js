import { AppError } from '../domain/errors.js';
export function errorHandler(error, request, reply) {
    if (error instanceof AppError) {
        reply.status(error.httpStatus).send({
            error: {
                code: error.code,
                message: error.message,
                retryable: error.retryable,
            },
        });
        return;
    }
    // Fastify validation errors (statusCode 400)
    if ('statusCode' in error && typeof error.statusCode === 'number') {
        const fe = error;
        reply.status(fe.statusCode ?? 400).send({
            error: {
                code: 'VALIDATION_ERROR',
                message: fe.message,
                retryable: false,
            },
        });
        return;
    }
    request.log.error({ err: error }, 'Unhandled error');
    reply.status(500).send({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred',
            retryable: true,
        },
    });
}
//# sourceMappingURL=error-handler.js.map