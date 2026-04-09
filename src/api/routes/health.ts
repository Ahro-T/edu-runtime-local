import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    const response: { status: string; timestamp: string; openclaw?: { status: string } } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    const openclawUrl = process.env['OPENCLAW_GATEWAY_URL'];
    if (openclawUrl) {
      try {
        const res = await fetch(`${openclawUrl}/health`, { signal: AbortSignal.timeout(2000) });
        response.openclaw = { status: res.ok ? 'ok' : 'degraded' };
      } catch {
        response.openclaw = { status: 'unavailable' };
      }
    }

    reply.send(response);
  });
}
