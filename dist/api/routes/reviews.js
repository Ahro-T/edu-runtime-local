export function reviewsRoutes(reviewService) {
    return async function (app) {
        app.post('/api/reviews/schedule', {
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
            const options = {};
            if (scheduledFor)
                options.scheduledFor = new Date(scheduledFor);
            if (jobType)
                options.jobType = jobType;
            const job = await reviewService.scheduleReview(learnerId, nodeId, options);
            reply.status(201).send({ job });
        });
    };
}
//# sourceMappingURL=reviews.js.map