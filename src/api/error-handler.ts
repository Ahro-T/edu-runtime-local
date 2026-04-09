import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../domain/errors.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
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
  if ('statusCode' in error && typeof (error as FastifyError).statusCode === 'number') {
    const fe = error as FastifyError;
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
