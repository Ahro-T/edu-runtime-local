import type { FastifyInstance } from 'fastify';
import type { DashboardService } from '../../services/DashboardService.js';

export function dashboardRoutes(dashboardService: DashboardService) {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Params: { learnerId: string } }>('/api/learners/:learnerId/dashboard', {
      schema: {
        params: {
          type: 'object',
          required: ['learnerId'],
          properties: { learnerId: { type: 'string' } },
        },
      },
    }, async (request, reply) => {
      const dashboard = await dashboardService.getDashboard(request.params.learnerId);
      reply.send({ dashboard });
    });
  };
}
