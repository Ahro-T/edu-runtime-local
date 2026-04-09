/**
 * Registers all 7 slash commands with Discord via REST API.
 * Run as a standalone script or called on bot startup.
 */
import type { Logger } from 'pino';
export declare function registerCommands(token: string, clientId: string, guildId: string, logger: Logger): Promise<void>;
//# sourceMappingURL=register-commands.d.ts.map