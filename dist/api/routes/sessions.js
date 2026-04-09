export function sessionsRoutes(sessionService) {
    return async function (app) {
        app.post('/api/sessions/start-or-resume', {
            schema: {
                body: {
                    type: 'object',
                    required: ['learnerId', 'pillar'],
                    properties: {
                        learnerId: { type: 'string', minLength: 1 },
                        pillar: { type: 'string', enum: ['agents', 'harnesses', 'openclaw'] },
                        channelId: { type: 'string' },
                    },
                },
            },
        }, async (request, reply) => {
            const { learnerId, pillar, channelId } = request.body;
            const session = await sessionService.startOrResume(learnerId, pillar, channelId);
            reply.status(200).send({ session });
        });
    };
}
//# sourceMappingURL=sessions.js.map