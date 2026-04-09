import { drizzle } from 'drizzle-orm/node-postgres';
import type { Logger } from '../../logger.js';
import * as schema from './schema.js';
export type DbClient = ReturnType<typeof drizzle<typeof schema>>;
export interface ConnectionOptions {
    connectionString: string;
    logger?: Logger;
    poolMax?: number;
}
export declare function createConnection(options: ConnectionOptions): DbClient;
//# sourceMappingURL=connection.d.ts.map