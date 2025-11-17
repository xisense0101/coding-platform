import { z } from 'zod'

/**
 * Environment variables validation schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Judge0
  JUDGE0_API_URL: z.string().url().optional(),
  JUDGE0_API_KEY: z.string().optional(),

  // Mailjet
  MAILJET_API_KEY: z.string().optional(),
  MAILJET_API_SECRET: z.string().optional(),
  FROM_NAME: z.string().optional(),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // Feature flags
  ENABLE_PROCTORING: z.string().optional(),
  ENABLE_AI_FEATURES: z.string().optional(),
  ENABLE_ANALYTICS: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate and parse environment variables
 * This should be called at application startup
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ')
      throw new Error(`Missing or invalid environment variables: ${missingVars}`)
    }
    throw error
  }
}

/**
 * Get validated environment variables
 * Returns parsed and validated env vars, or throws if invalid
 */
export function getEnv(): Env {
  return validateEnv()
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof Pick<Env, 'ENABLE_PROCTORING' | 'ENABLE_AI_FEATURES' | 'ENABLE_ANALYTICS'>): boolean {
  const value = process.env[flag]
  return value === 'true' || value === '1'
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}
