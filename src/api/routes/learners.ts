import type { FastifyInstance } from 'fastify';
import type { LearnerService } from '../../services/LearnerService.js';

interface UpsertLearnerBody {
  discordUserId: string;
}

export function learnersRoutes(learnerService: LearnerService) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: UpsertLearnerBody }>('/api/learners/upsert', {
      schema: {
        body: {
          type: 'object',
          required: ['discordUserId'],
          properties: {
            discordUserId: { type: 'string', minLength: 1 },
          },
        },
      },
    }, async (request, reply) => {
      const learner = await learnerService.upsertLearner(request.body.discordUserId);
      reply.status(200).send({ learner });
    });
  };
}
