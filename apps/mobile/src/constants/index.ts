// Environment configuration constants with type safety

interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
}

interface AppConfig {
  readonly supabase: SupabaseConfig;
  readonly api: {
    readonly defaultTimeout: number;
    readonly maxRetries: number;
  };
  readonly logging: {
    readonly enabled: boolean;
    readonly level: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Supabase configuration
export const SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://hcfxujzqlyaxvbetyano.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y',
} as const;

// API configuration
export const API_CONFIG = {
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3,
} as const;

// Logging configuration
export const LOGGING_CONFIG = {
  enabled: __DEV__,
  level: __DEV__ ? 'debug' : 'error',
} as const;

// Complete app configuration
export const APP_CONFIG: AppConfig = {
  supabase: SUPABASE_CONFIG,
  api: API_CONFIG,
  logging: LOGGING_CONFIG,
} as const;

