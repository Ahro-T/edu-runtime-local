import type { FastifyInstance } from 'fastify';
import type { SessionService } from '../../services/SessionService.js';
import type { Pillar } from '../../domain/content/types.js';

interface StartOrResumeBody {
  learnerId: string;
  pillar: Pillar;
  channelId?: string;
}

export function sessionsRoutes(sessionService: SessionService) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: StartOrResumeBody }>('/api/sessions/start-or-resume', {
      schema: {
        body: {
          type: 'object',
          required: ['learnerId', 'pillar'],
          properties: {
            learnerId: { type: 'string', minLength: 1 },
            pillar: { type: 'string', enum: ['agents', 'harnesses', 'openclaw'] },
            channelId: { type: 'string' },
          },
        },
      },
    }, async (request, reply) => {
      const { learnerId, pillar, channelId } = request.body;
      const session = await sessionService.startOrResume(learnerId, pillar, channelId);
      reply.status(200).send({ session });
    });
  };
}
