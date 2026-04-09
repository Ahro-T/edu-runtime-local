import type { FastifyInstance } from 'fastify';
import type { ReviewService } from '../../services/ReviewService.js';

interface ScheduleReviewBody {
  learnerId: string;
  nodeId: string;
  scheduledFor?: string;
  jobType?: 'review' | 'retry' | 'reminder';
}

export function reviewsRoutes(reviewService: ReviewService) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: ScheduleReviewBody }>('/api/reviews/schedule', {
      schema: {
        body: {
          type: 'object',
          required: ['learnerId', 'nodeId'],
          properties: {
            learnerId: { type: 'string', minLength: 1 },
            nodeId: { type: 'string', minLength: 1 },
            scheduledFor: { type: 'string', format: 'date-time' },
            jobType: { type: 'string', enum: ['review', 'retry', 'reminder'] },
          },
        },
      },
    }, async (request, reply) => {
      const { learnerId, nodeId, scheduledFor, jobType } = request.body;
      const options: Parameters<typeof reviewService.scheduleReview>[2] = {};
      if (scheduledFor) options.scheduledFor = new Date(scheduledFor);
      if (jobType) options.jobType = jobType;
      const job = await reviewService.scheduleReview(learnerId, nodeId, options);
      reply.status(201).send({ job });
    });
  };
}
