import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Logger } from '../../logger.js';
import * as schema from './schema.js';

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

export interface ConnectionOptions {
  connectionString: string;
  logger?: Logger;
  poolMax?: number;
}

export function createConnection(options: ConnectionOptions): DbClient {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    max: options.poolMax ?? 10,
  });

  return drizzle(pool, {
    schema,
    logger: options.logger
      ? {
          logQuery(query: string, params: unknown[]) {
            options.logger!.debug({ query, params }, 'db query');
          },
        }
      : false,
  });
}
