/**
 * Discord.js Client setup with required gateway intents.
 */

import { Client, GatewayIntentBits } from 'discord.js';

export function createDiscordClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
}
