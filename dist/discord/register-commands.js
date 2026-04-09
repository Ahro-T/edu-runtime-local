/**
 * Registers all 7 slash commands with Discord via REST API.
 * Run as a standalone script or called on bot startup.
 */
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
const COMMANDS = [
    new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start or resume a learning session for a pillar')
        .addStringOption((opt) => opt
        .setName('pillar')
        .setDescription('The learning pillar to study')
        .setRequired(true)
        .addChoices({ name: 'Agents', value: 'agents' }, { name: 'Harnesses', value: 'harnesses' }, { name: 'OpenClaw', value: 'openclaw' })),
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show your learning dashboard'),
    new SlashCommandBuilder()
        .setName('explain')
        .setDescription('Get an explanation of the current node'),
    new SlashCommandBuilder()
        .setName('task')
        .setDescription('Get the assessment prompt for the current node'),
    new SlashCommandBuilder()
        .setName('next')
        .setDescription('Advance to the next node after passing the current one'),
    new SlashCommandBuilder()
        .setName('review')
        .setDescription('Schedule a spaced-repetition review for the current node'),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands and how to use the learning bot'),
].map((cmd) => cmd.toJSON());
export async function registerCommands(token, clientId, guildId, logger) {
    const log = logger.child({ service: 'register-commands' });
    const rest = new REST({ version: '10' }).setToken(token);
    log.info({ guildId, commandCount: COMMANDS.length }, 'Registering slash commands');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: COMMANDS,
    });
    log.info('Slash commands registered successfully');
}
//# sourceMappingURL=register-commands.js.map