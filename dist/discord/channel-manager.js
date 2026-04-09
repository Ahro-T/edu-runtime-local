/**
 * Manages {pillar}-study-{learner} channels in the Discord guild.
 */
import { ChannelType, } from 'discord.js';
export class ChannelManager {
    logger;
    constructor(logger) {
        this.logger = logger.child({ service: 'ChannelManager' });
    }
    /**
     * Returns the channel name pattern for a learner+pillar combo.
     */
    channelName(pillar, discordUsername) {
        // Sanitize username: lowercase, replace non-alphanumeric with dash
        const sanitized = discordUsername.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return `${pillar}-study-${sanitized}`;
    }
    /**
     * Finds or creates the study channel for a learner.
     * Returns the TextChannel.
     */
    async findOrCreate(guild, pillar, discordUsername) {
        const name = this.channelName(pillar, discordUsername);
        const log = this.logger.child({ channelName: name, guildId: guild.id });
        const existing = guild.channels.cache.find((ch) => ch.name === name && ch.type === ChannelType.GuildText);
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
        return channel;
    }
    /**
     * Checks whether a given channel name matches the study channel pattern.
     */
    isStudyChannel(channelName) {
        return /^(agents|harnesses|openclaw)-study-.+$/.test(channelName);
    }
    /**
     * Extracts the pillar from a study channel name.
     */
    pillarFromChannelName(channelName) {
        const match = /^(agents|harnesses|openclaw)-study-.+$/.exec(channelName);
        return match?.[1] ?? null;
    }
}
//# sourceMappingURL=channel-manager.js.map