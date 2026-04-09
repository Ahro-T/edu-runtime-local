/**
 * Discord bot entry point.
 * Starts the Discord.js client and registers all event handlers.
 * The bot calls the Runtime API only — never imports services or repositories.
 */

import { createLogger } from '../logger.js';
import { config } from '../config.js';
import { createDiscordClient } from './client.js';
import { registerCommands } from './register-commands.js';
import { registerInteractionHandler } from './interaction-handler.js';
import { registerMessageHandler } from './message-handler.js';

const logger = createLogger('discord-bot');

async function startBot(): Promise<void> {
  logger.info('Starting Discord bot');

  const client = createDiscordClient();

  // Register event handlers before login
  registerInteractionHandler(client, logger);
  registerMessageHandler(client, logger);

  client.once('ready', async (readyClient) => {
    logger.info({ tag: readyClient.user.tag }, 'Discord bot ready');

    // Register slash commands on startup
    try {
      await registerCommands(
        config.DISCORD_TOKEN,
        readyClient.user.id,
        config.DISCORD_GUILD_ID,
        logger,
      );
    } catch (err) {
      logger.error({ err }, 'Failed to register slash commands — bot will continue but commands may be stale');
    }
  });

  client.on('error', (err) => {
    logger.error({ err }, 'Discord client error');
  });

  await client.login(config.DISCORD_TOKEN);
}

startBot().catch((err) => {
  console.error('Fatal error starting Discord bot:', err);
  process.exit(1);
});
