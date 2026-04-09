/**
 * Manages {pillar}-study-{learner} channels in the Discord guild.
 */

import {
  ChannelType,
  type Guild,
  type TextChannel,
} from 'discord.js';
import type { Logger } from 'pino';

export class ChannelManager {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ service: 'ChannelManager' });
  }

  /**
   * Returns the channel name pattern for a learner+pillar combo.
   */
  channelName(pillar: string, discordUsername: string): string {
    // Sanitize username: lowercase, replace non-alphanumeric with dash
    const sanitized = discordUsername.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `${pillar}-study-${sanitized}`;
  }

  /**
   * Finds or creates the study channel for a learner.
   * Returns the TextChannel.
   */
  async findOrCreate(guild: Guild, pillar: string, discordUsername: string): Promise<TextChannel> {
    const name = this.channelName(pillar, discordUsername);
    const log = this.logger.child({ channelName: name, guildId: guild.id });

    const existing = guild.channels.cache.find(
      (ch) => ch.name === name && ch.type === ChannelType.GuildText,
    ) as TextChannel | undefined;

    if (existing) {
      log.debug('Found existing study channel');
      return existing;
    }

    log.info('Creating new study channel');
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      topic: `Study channel for ${pillar} — ${discordUsername}`,
    });

    return channel as TextChannel;
  }

  /**
   * Checks whether a given channel name matches the study channel pattern.
   */
  isStudyChannel(channelName: string): boolean {
    return /^(agents|harnesses|openclaw)-study-.+$/.test(channelName);
  }

  /**
   * Extracts the pillar from a study channel name.
   */
  pillarFromChannelName(channelName: string): string | null {
    const match = /^(agents|harnesses|openclaw)-study-.+$/.exec(channelName);
    return match?.[1] ?? null;
  }
}
