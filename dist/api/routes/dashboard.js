export function dashboardRoutes(dashboardService) {
    return async function (app) {
        app.get('/api/learners/:learnerId/dashboard', {
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
//# sourceMappingURL=dashboard.js.map