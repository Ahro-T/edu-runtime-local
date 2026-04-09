import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { DbClient } from './connection.js';
import { createLogger } from '../../logger.js';

const logger = createLogger('migrate');

export async function runMigrations(db: DbClient, migrationsFolder: string): Promise<void> {
  logger.info({ migrationsFolder }, 'running migrations');
  await migrate(db, { migrationsFolder });
  logger.info('migrations complete');
}
