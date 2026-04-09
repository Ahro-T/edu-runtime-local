import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
export function createConnection(options) {
    const pool = new pg.Pool({
        connectionString: options.connectionString,
        max: options.poolMax ?? 10,
    });
    return drizzle(pool, {
        schema,
        logger: options.logger
            ? {
                logQuery(query, params) {
                    options.logger.debug({ query, params }, 'db query');
                },
            }
            : false,
    });
}
//# sourceMappingURL=connection.js.map