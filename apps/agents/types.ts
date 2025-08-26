export interface Env {
  // Durable Object bindings
  HELLO_AGENT: DurableObjectNamespace;
  TIDE_AGENT?: DurableObjectNamespace;
  TIDE_PRODUCTIVITY_AGENT?: DurableObjectNamespace;
  
  // KV namespaces
  TIDES_KV?: KVNamespace;
  
  // Core Cloudflare configuration
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  ENVIRONMENT: string;
  CLOUDFLARE_API_TOKEN: string;
  DB: D1Database;
  TIDES_R2: R2Bucket;
  
  // Supabase configuration  
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  
  // AI bindings
  AI?: any;
  VECTORIZE?: any;
  AI_GATEWAY_URL?: string;
  AI_GATEWAY_TOKEN?: string;
}