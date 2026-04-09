import type { FastifyInstance } from 'fastify';
import type { SubmissionService } from '../../services/SubmissionService.js';
import type { EvaluationService } from '../../services/EvaluationService.js';

interface RecordSubmissionBody {
  learnerId: string;
  sessionId: string;
  nodeId: string;
  rawAnswer: string;
}

export function submissionsRoutes(submissionService: SubmissionService, evaluationService: EvaluationService) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: RecordSubmissionBody }>('/api/submissions', {
      schema: {
        body: {
          type: 'object',
          required: ['learnerId', 'sessionId', 'nodeId', 'rawAnswer'],
          properties: {
            learnerId: { type: 'string', minLength: 1 },
            sessionId: { type: 'string', minLength: 1 },
            nodeId: { type: 'string', minLength: 1 },
            rawAnswer: { type: 'string', minLength: 1 },
          },
        },
      },
    }, async (request, reply) => {
      const { learnerId, sessionId, nodeId, rawAnswer } = request.body;
      const submission = await submissionService.recordSubmission(learnerId, sessionId, nodeId, rawAnswer);
      reply.status(201).send({ submission });
    });

    app.post<{ Params: { submissionId: string } }>('/api/submissions/:submissionId/evaluate', {
      schema: {
        params: {
          type: 'object',
          required: ['submissionId'],
          properties: { submissionId: { type: 'string' } },
        },
      },
    }, async (request, reply) => {
      const evaluation = await evaluationService.evaluateSubmission(request.params.submissionId);
      reply.send({ evaluation });
    });
  };
}
