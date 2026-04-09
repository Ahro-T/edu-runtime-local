import pino from 'pino';
export type Logger = pino.Logger;
declare const rootLogger: pino.Logger<never, boolean>;
export declare function createLogger(service: string): Logger;
export declare function createRequestLogger(service: string, requestId: string, learnerId?: string): Logger;
export default rootLogger;
//# sourceMappingURL=logger.d.ts.map