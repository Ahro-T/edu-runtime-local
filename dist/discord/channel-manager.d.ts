/**
 * Manages {pillar}-study-{learner} channels in the Discord guild.
 */
import { type Guild, type TextChannel } from 'discord.js';
import type { Logger } from 'pino';
export declare class ChannelManager {
    private readonly logger;
    constructor(logger: Logger);
    /**
     * Returns the channel name pattern for a learner+pillar combo.
     */
    channelName(pillar: string, discordUsername: string): string;
    /**
     * Finds or creates the study channel for a learner.
     * Returns the TextChannel.
     */
    findOrCreate(guild: Guild, pillar: string, discordUsername: string): Promise<TextChannel>;
    /**
     * Checks whether a given channel name matches the study channel pattern.
     */
    isStudyChannel(channelName: string): boolean;
    /**
     * Extracts the pillar from a study channel name.
     */
    pillarFromChannelName(channelName: string): string | null;
}
//# sourceMappingURL=channel-manager.d.ts.map