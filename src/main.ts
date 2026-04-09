import { createLogger } from './logger.js';
import { config } from './config.js';
import { createConnection } from './adapters/db/connection.js';
import { buildCompositionRoot } from './composition-root.js';
import { createServer } from './api/server.js';
import { ObsidianContentRepository } from './adapters/content/obsidian/ObsidianContentRepository.js';

const logger = createLogger('main');

async function main() {
  logger.info({ port: config.PORT, logLevel: config.LOG_LEVEL }, 'Starting edu-runtime-v1');

  // Database connection
  const db = createConnection({
    connectionString: config.DATABASE_URL,
    logger,
  });

  // Content repository — single instance shared with composition root
  const contentRepository = new ObsidianContentRepository(config.VAULT_PATH, logger);
  const validationErrors = await contentRepository.validateContent();
  if (validationErrors.length > 0) {
    logger.error({ errors: validationErrors }, 'Content validation failed on startup');
    process.exit(1);
  }
  logger.info('Content validation passed');

  // Build composition root
  const { routes } = buildCompositionRoot({
    db,
    contentRepository,
    llmUrl: config.LLM_URL,
    llmModel: config.LLM_MODEL,
    logger,
  });

  // Create and start server
  const server = createServer(routes, logger);

  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info({ port: config.PORT }, 'Server started');
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
