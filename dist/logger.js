import pino from 'pino';
const rootLogger = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level(label) {
            return { level: label };
        },
    },
});
export function createLogger(service) {
    return rootLogger.child({ service });
}
export function createRequestLogger(service, requestId, learnerId) {
    const fields = { service, requestId };
    if (learnerId !== undefined) {
        fields['learnerId'] = learnerId;
    }
    return rootLogger.child(fields);
}
export default rootLogger;
//# sourceMappingURL=logger.js.map