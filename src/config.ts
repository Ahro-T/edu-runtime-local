import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  VLLM_URL: z.string().min(1, 'VLLM_URL is required'),
  VAULT_PATH: z.string().min(1, 'VAULT_PATH is required'),
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_GUILD_ID: z.string().min(1, 'DISCORD_GUILD_ID is required'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`);
    throw new Error(`Configuration validation failed:\n${missing.join('\n')}`);
  }
  return result.data;
}

export const config: Config = loadConfig();
