import type { FastifyInstance } from 'fastify';
import type { ContentService } from '../../services/ContentService.js';
import type { AdvancementService } from '../../services/AdvancementService.js';
import type { Pillar } from '../../domain/content/types.js';

interface CurrentNodeQuery {
  pillar: Pillar;
}

interface AdvanceNodeBody {
  learnerId: string;
  pillar: Pillar;
}

export function nodesRoutes(contentService: ContentService, advancementService: AdvancementService) {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Params: { learnerId: string }; Querystring: CurrentNodeQuery }>(
      '/api/learners/:learnerId/current-node',
      {
        schema: {
          params: {
            type: 'object',
            required: ['learnerId'],
            properties: { learnerId: { type: 'string' } },
          },
          querystring: {
            type: 'object',
            required: ['pillar'],
            properties: {
              pillar: { type: 'string', enum: ['agents', 'harnesses', 'openclaw'] },
            },
          },
        },
      },
      async (request, reply) => {
        const node = await contentService.getCurrentNode(request.params.learnerId, request.query.pillar);
        reply.send({ node });
      },
    );

    app.post<{ Body: AdvanceNodeBody }>('/api/nodes/advance', {
      schema: {
        body: {
          type: 'object',
          required: ['learnerId', 'pillar'],
          properties: {
            learnerId: { type: 'string', minLength: 1 },
            pillar: { type: 'string', enum: ['agents', 'harnesses', 'openclaw'] },
          },
        },
      },
    }, async (request, reply) => {
      const result = await advancementService.advanceNode(request.body.learnerId, request.body.pillar);
      reply.send(result);
    });
  };
}
