// Server Environment Types for Tides Mobile App

export type ServerEnvironmentId =
  | "env001"
  | "env002"
  | "env003"
  | "env006"
  | "mason-c32";

export interface ServerEnvironment {
  id: ServerEnvironmentId;
  name: string;
  description: string;
  url: string;
  environment: string;
  features: string[];
  isDefault?: boolean;
}

export interface ServerEnvironmentState {
  currentEnvironment: ServerEnvironmentId;
  environments: Record<ServerEnvironmentId, ServerEnvironment>;
  isLoading: boolean;
  error: string | null;
  lastSwitched: string | null;
}

export type ServerEnvironmentAction =
  | { type: "SET_ENVIRONMENT"; payload: ServerEnvironmentId }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "ENVIRONMENT_SWITCHED";
      payload: { environmentId: ServerEnvironmentId; timestamp: string };
    }
  | { type: "RESET_STATE" };

export const SERVER_ENVIRONMENTS: Record<
  ServerEnvironmentId,
  ServerEnvironment
> = {
  env001: {
    id: "env001",
    name: "Production",
    description: "Production environment with full D1 and AI capabilities",
    url: "https://tides-001.mpazbot.workers.dev",
    environment: "development", // As per wrangler.jsonc vars.ENVIRONMENT
    features: ["D1 Database", "Durable Objects", "AI Binding", "R2 Storage"],
  },
  env002: {
    id: "env002",
    name: "Staging",
    description: "Staging environment with demo mode and dual databases",
    url: "https://tides-002.mpazbot.workers.dev",
    environment: "staging",
    features: [
      "D1 Database",
      "Supabase DB",
      "KV Storage",
      "Demo Mode",
      "Durable Objects",
    ],
  },
  env003: {
    id: "env003",
    name: "Development",
    description: "Development environment for testing new features",
    url: "https://tides-003.mpazbot.workers.dev",
    environment: "production", // As per wrangler.jsonc vars.ENVIRONMENT
    features: ["D1 Database", "Durable Objects", "AI Binding"],
  },
  env006: {
    id: "env006",
    name: "Mason Development (Working)",
    description: "Mason's development environment with complete auth setup",
    url: "https://tides-006.mpazbot.workers.dev",
    environment: "mason-development",
    features: ["D1 Database", "API Key Registration", "Supabase Auth", "Durable Objects", "Working MCP Flow"],
    isDefault: true,
  },
  "mason-c32": {
    id: "mason-c32",
    name: "Mason C32 (Legacy)",
    description: "Previous working implementation on Mason C32 infrastructure",
    url: "https://supabase-tides-demo-1.mason-c32.workers.dev",
    environment: "custom",
    features: ["MCP Tools", "Supabase Integration", "Legacy Environment"],
  },
};

export const DEFAULT_ENVIRONMENT: ServerEnvironmentId = "env006";
