export function nodesRoutes(contentService, advancementService) {
    return async function (app) {
        app.get('/api/learners/:learnerId/current-node', {
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
        }, async (request, reply) => {
            const node = await contentService.getCurrentNode(request.params.learnerId, request.query.pillar);
            reply.send({ node });
        });
        app.post('/api/nodes/advance', {
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
//# sourceMappingURL=nodes.js.map