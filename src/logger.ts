import pino from 'pino';

export type Logger = pino.Logger;

const rootLogger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

export function createLogger(service: string): Logger {
  return rootLogger.child({ service });
}

export function createRequestLogger(
  service: string,
  requestId: string,
  learnerId?: string,
): Logger {
  const fields: Record<string, string> = { service, requestId };
  if (learnerId !== undefined) {
    fields['learnerId'] = learnerId;
  }
  return rootLogger.child(fields);
}

export default rootLogger;
