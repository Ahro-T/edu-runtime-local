/**
 * Dispatches Discord interactionCreate events to the correct command handler.
 */
import { handleStart } from './commands/start.js';
import { handleStatus } from './commands/status.js';
import { handleExplain } from './commands/explain.js';
import { handleTask } from './commands/task.js';
import { handleNext } from './commands/next.js';
import { handleReview } from './commands/review.js';
import { handleHelp } from './commands/help.js';
export function registerInteractionHandler(client, logger) {
    const log = logger.child({ service: 'interaction-handler' });
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        const { commandName } = interaction;
        log.info({ commandName, userId: interaction.user.id }, 'Slash command received');
        try {
            switch (commandName) {
                case 'start':
                    await handleStart(interaction, logger);
                    break;
                case 'status':
                    await handleStatus(interaction, logger);
                    break;
                case 'explain':
                    await handleExplain(interaction, logger);
                    break;
                case 'task':
                    await handleTask(interaction, logger);
                    break;
                case 'next':
                    await handleNext(interaction, logger);
                    break;
                case 'review':
                    await handleReview(interaction, logger);
                    break;
                case 'help':
                    await handleHelp(interaction, logger);
                    break;
                default:
                    log.warn({ commandName }, 'Unknown command received');
                    await interaction.reply({ content: 'Unknown command. Use `/help` to see available commands.', ephemeral: true });
            }
        }
        catch (err) {
            log.error({ err, commandName }, 'Unhandled error in interaction handler');
            const msg = 'An unexpected error occurred. Please try again.';
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(msg).catch(() => undefined);
            }
            else {
                await interaction.reply({ content: msg, ephemeral: true }).catch(() => undefined);
            }
        }
    });
}
//# sourceMappingURL=interaction-handler.js.map