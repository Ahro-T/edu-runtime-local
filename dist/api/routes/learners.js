export function learnersRoutes(learnerService) {
    return async function (app) {
        app.post('/api/learners/upsert', {
            schema: {
                body: {
                    type: 'object',
                    required: ['discordUserId'],
                    properties: {
                        discordUserId: { type: 'string', minLength: 1 },
                    },
                },
            },
        }, async (request, reply) => {
            const learner = await learnerService.upsertLearner(request.body.discordUserId);
            reply.status(200).send({ learner });
        });
    };
}
//# sourceMappingURL=learners.js.map