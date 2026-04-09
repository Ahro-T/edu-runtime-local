import Fastify from 'fastify';
import type { Logger } from 'pino';
import { errorHandler } from './error-handler.js';
import { healthRoutes } from './routes/health.js';
import type { learnersRoutes } from './routes/learners.js';
import type { sessionsRoutes } from './routes/sessions.js';
import type { nodesRoutes } from './routes/nodes.js';
import type { submissionsRoutes } from './routes/submissions.js';
import type { reviewsRoutes } from './routes/reviews.js';
import type { dashboardRoutes } from './routes/dashboard.js';

export interface ApiRoutes {
  learners: ReturnType<typeof learnersRoutes>;
  sessions: ReturnType<typeof sessionsRoutes>;
  nodes: ReturnType<typeof nodesRoutes>;
  submissions: ReturnType<typeof submissionsRoutes>;
  reviews: ReturnType<typeof reviewsRoutes>;
  dashboard: ReturnType<typeof dashboardRoutes>;
}

export function createServer(routes: ApiRoutes, logger: Logger) {
  const app = Fastify({ loggerInstance: logger });

  app.setErrorHandler(errorHandler);

  app.register(healthRoutes);
  app.register(routes.learners);
  app.register(routes.sessions);
  app.register(routes.nodes);
  app.register(routes.submissions);
  app.register(routes.reviews);
  app.register(routes.dashboard);

  return app;
}
