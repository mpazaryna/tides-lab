// Storage abstraction layer for Tides data
import type { Env as AgentEnv } from "@agents/types";

export interface Tide {
  id: string;
  name: string;
  flow_type: "daily" | "weekly" | "project" | "seasonal";
  description?: string;
  created_at: string;
  status: "active" | "completed" | "paused";
  flow_sessions: FlowSession[];
  energy_updates: EnergyUpdate[];
  task_links: TaskLink[];
}

export interface FlowSession {
  id: string;
  tide_id: string;
  intensity: "gentle" | "moderate" | "strong";
  duration: number;
  started_at: string;
  work_context?: string;
  energy_level?: string;
}

export interface EnergyUpdate {
  id: string;
  tide_id: string;
  energy_level: string;
  context?: string;
  timestamp: string;
}

export interface TaskLink {
  id: string;
  tide_id: string;
  task_url: string;
  task_title: string;
  task_type: string;
  linked_at: string;
}

export interface CreateTideInput {
  name: string;
  flow_type: "daily" | "weekly" | "project" | "seasonal";
  description?: string;
}

export interface TideFilter {
  flow_type?: string;
  active_only?: boolean;
}

// Storage interface that can be implemented by different backends
export interface TideStorage {
  // Tide operations
  createTide(input: CreateTideInput): Promise<Tide>;
  getTide(id: string): Promise<Tide | null>;
  listTides(filter?: TideFilter): Promise<Tide[]>;
  updateTide(id: string, updates: Partial<Tide>): Promise<Tide>;

  // Flow session operations
  addFlowSession(
    tideId: string,
    session: Omit<FlowSession, "id" | "tide_id">
  ): Promise<FlowSession>;
  getFlowSessions(tideId: string): Promise<FlowSession[]>;

  // Energy tracking operations
  addEnergyUpdate(
    tideId: string,
    update: Omit<EnergyUpdate, "id" | "tide_id">
  ): Promise<EnergyUpdate>;
  getEnergyUpdates(tideId: string): Promise<EnergyUpdate[]>;

  // Task linking operations
  addTaskLink(
    tideId: string,
    link: Omit<TaskLink, "id" | "tide_id">
  ): Promise<TaskLink>;
  getTaskLinks(tideId: string): Promise<TaskLink[]>;
  removeTaskLink(linkId: string): Promise<boolean>;
}

// Note: CloudflareKVStorage removed - using R2 REST API approach instead

// In-memory storage instance for fallback when R2/KV binding fails
let fallbackStorage: TideStorage | null = null;

// Factory function to create storage instance
export function createStorage(env: Env | AgentEnv): TideStorage {
  console.log("🔍 Storage selection debug:", {
    hasDB: !!env?.DB,
    hasApiToken: !!env?.CLOUDFLARE_API_TOKEN,
    hasAccountId: !!env?.CLOUDFLARE_ACCOUNT_ID,
    hasR2Bucket: !!env?.R2_BUCKET_NAME,
    hasTidesR2: !!(env as AgentEnv)?.TIDES_R2,
  });

  // First priority: D1 + R2 hybrid (if D1 is available)
  if (
    env?.DB &&
    env?.CLOUDFLARE_API_TOKEN &&
    env?.CLOUDFLARE_ACCOUNT_ID &&
    env?.R2_BUCKET_NAME
  ) {
    console.log("✅ Using D1R2HybridStorage (production storage)");
    const { D1R2HybridStorage } = require("./d1-r2");
    const { R2RestApiStorage } = require("./r2-rest");

    const r2Storage = new R2RestApiStorage({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      bucketName: env.R2_BUCKET_NAME,
      apiToken: env.CLOUDFLARE_API_TOKEN,
    });

    return new D1R2HybridStorage({
      db: env.DB,
      r2Storage,
    });
  }

  // Second priority: R2 REST API only (no multi-user support)
  if (
    env?.CLOUDFLARE_API_TOKEN &&
    env?.CLOUDFLARE_ACCOUNT_ID &&
    env?.R2_BUCKET_NAME
  ) {
    console.log(
      "⚠️ Using R2RestApiStorage (no D1 database - limited functionality)"
    );
    const { R2RestApiStorage } = require("./r2-rest");
    return new R2RestApiStorage({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      bucketName: env.R2_BUCKET_NAME,
      apiToken: env.CLOUDFLARE_API_TOKEN,
    });
  }

  // Third priority: R2 storage (requires working bindings)
  if ((env as AgentEnv)?.TIDES_R2) {
    console.log("⚠️ Using R2TideStorage (direct R2 bindings)");
    const { R2TideStorage } = require("./r2");
    return new R2TideStorage((env as AgentEnv).TIDES_R2);
  }

  // Fallback to persistent in-memory storage (survives across requests)
  if (!fallbackStorage) {
    console.error(
      "❌ CRITICAL: No storage backend available, using MockTideStorage fallback - THIS SHOULD NOT HAPPEN IN PRODUCTION"
    );
    const { MockTideStorage } = require("./mock");
    fallbackStorage = new MockTideStorage();
  }

  console.log("❌ Using MockTideStorage fallback - DATA WILL NOT PERSIST");
  return fallbackStorage!;
}
