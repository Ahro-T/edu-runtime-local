export async function healthRoutes(app) {
    app.get('/health', async (_request, reply) => {
        reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    });
}
//# sourceMappingURL=health.js.map