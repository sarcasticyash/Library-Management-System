import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, 'PORT must be between 1 and 65535'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/lms_db'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .default('dev_jwt_secret_must_be_at_least_32_characters_long_for_security'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long')
    .default('dev_refresh_secret_must_be_at_least_32_chars_long'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z
    .string()
    .default('12')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 10 && val <= 14, 'BCRYPT_SALT_ROUNDS must be between 10 and 14'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error(
      '❌ FATAL: Invalid environment variable configuration:',
      JSON.stringify(formattedErrors, null, 2),
    );
    throw new Error('Environment configuration validation failed');
  }

  return result.data;
};

export const env = parseEnv();
export type EnvConfig = z.infer<typeof envSchema>;
