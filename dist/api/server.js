import Fastify from 'fastify';
import { errorHandler } from './error-handler.js';
import { healthRoutes } from './routes/health.js';
export function createServer(routes, logger) {
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
//# sourceMappingURL=server.js.map