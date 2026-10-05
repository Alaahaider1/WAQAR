/**
 * Environment variable validation — lazy getter pattern.
 *
 * Variables are validated when first accessed, not at module load.
 * This prevents build-time crashes during static page collection
 * while still failing fast at runtime for missing required values.
 */

function getEnv(key: string, required = true, fallback = ''): string {
  const value = process.env[key];
  if (required && (!value || value.trim() === '')) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
        `  Add it to .env.local (development) or your deployment environment.`
    );
  }
  return value?.trim() ?? fallback;
}

function makeEnv() {
  const cache: Record<string, string> = {};
  function get(key: string, required = true, fallback = ''): string {
    if (!(key in cache)) {
      cache[key] = getEnv(key, required, fallback);
    }
    return cache[key];
  }
  return {
    get NEXT_PUBLIC_SUPABASE_URL()      { return get('NEXT_PUBLIC_SUPABASE_URL') },
    get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return get('NEXT_PUBLIC_SUPABASE_ANON_KEY') },
    get SUPABASE_SERVICE_ROLE_KEY()     { return get('SUPABASE_SERVICE_ROLE_KEY') },
    get CLOUDINARY_CLOUD_NAME()         { return get('CLOUDINARY_CLOUD_NAME', false) },
    get CLOUDINARY_API_KEY()            { return get('CLOUDINARY_API_KEY', false) },
    get CLOUDINARY_API_SECRET()         { return get('CLOUDINARY_API_SECRET', false) },
    get NEXTAUTH_URL()                  { return get('NEXTAUTH_URL', false, 'http://localhost:3000') },
    get NODE_ENV()                      { return get('NODE_ENV', false, 'development') },
    get isDevelopment()                 { return this.NODE_ENV === 'development' },
    get isProduction()                  { return this.NODE_ENV === 'production' },
  };
}

export const env = makeEnv();

export const publicEnv = {
  get NEXT_PUBLIC_SUPABASE_URL()      { return env.NEXT_PUBLIC_SUPABASE_URL },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  get CLOUDINARY_CLOUD_NAME()         { return env.CLOUDINARY_CLOUD_NAME },
} as const;
