import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createLogger } from '../../logger.js';
const logger = createLogger('migrate');
export async function runMigrations(db, migrationsFolder) {
    logger.info({ migrationsFolder }, 'running migrations');
    await migrate(db, { migrationsFolder });
    logger.info('migrations complete');
}
//# sourceMappingURL=migrate.js.map