import Fastify from 'fastify';
import type { Logger } from 'pino';
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
export declare function createServer(routes: ApiRoutes, logger: Logger): Fastify.FastifyInstance<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>, import("node:http").IncomingMessage, import("node:http").ServerResponse<import("node:http").IncomingMessage>, Logger, Fastify.FastifyTypeProviderDefault> & PromiseLike<Fastify.FastifyInstance<import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>, import("node:http").IncomingMessage, import("node:http").ServerResponse<import("node:http").IncomingMessage>, Logger, Fastify.FastifyTypeProviderDefault>> & {
    __linterBrands: "SafePromiseLike";
};
//# sourceMappingURL=server.d.ts.map