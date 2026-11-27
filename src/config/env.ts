import { z } from 'zod';

/**
 * Every environment variable the service reads, validated once at startup.
 * The process refuses to boot with a clear message if anything is invalid,
 * instead of failing later at request time.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CATALOG_PATH: z.string().min(1).default('catalog/maintenance-catalog.json'),
  ANDROID_LATEST_VERSION: z.string().default('0.1.0'),
  ANDROID_MIN_SUPPORTED_VERSION: z.string().default('0.1.0'),
  ANDROID_DOWNLOAD_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}
