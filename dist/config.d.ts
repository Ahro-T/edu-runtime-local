import { z } from 'zod';
declare const configSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    VLLM_URL: z.ZodString;
    VAULT_PATH: z.ZodString;
    DISCORD_TOKEN: z.ZodString;
    DISCORD_GUILD_ID: z.ZodString;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["trace", "debug", "info", "warn", "error", "fatal"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    DATABASE_URL: string;
    VLLM_URL: string;
    VAULT_PATH: string;
    DISCORD_TOKEN: string;
    DISCORD_GUILD_ID: string;
    PORT: number;
}, {
    DATABASE_URL: string;
    VLLM_URL: string;
    VAULT_PATH: string;
    DISCORD_TOKEN: string;
    DISCORD_GUILD_ID: string;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | undefined;
    PORT?: number | undefined;
}>;
export type Config = z.infer<typeof configSchema>;
export declare const config: Config;
export {};
//# sourceMappingURL=config.d.ts.map