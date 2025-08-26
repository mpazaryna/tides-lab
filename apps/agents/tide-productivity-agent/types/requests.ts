/**
 * Request and response interfaces for TideProductivityAgent API
 */

import type { UserPreferences, Optimization } from "./preferences";

export interface InsightsRequest {
  userId: string;
  timeframe?: "24h" | "7d" | "30d";
  tideIds?: string[];
}

export interface InsightsResponse {
  success: boolean;
  insights?: string;
  error?: string;
}

export interface OptimizeRequest {
  userId: string;
  preferences: UserPreferences;
  tideIds?: string[];
}

export interface OptimizeResponse {
  success: boolean;
  optimizations?: Optimization[];
  error?: string;
}

export interface QuestionRequest {
  userId: string;
  question: string;
  tideId?: string;
  context?: string;
}

export interface QuestionResponse {
  success: boolean;
  result?: any;
  analysis?: string;
  error?: string;
  debug?: {
    mcpServerInitialized: boolean;
    aiAvailable: boolean;
    tideId: string;
  };
}

export interface PreferencesRequest {
  userId: string;
  preferences?: UserPreferences;
}

export interface PreferencesResponse {
  success: boolean;
  preferences?: UserPreferences | null;
  error?: string;
}

export interface StatusResponse {
  status: "healthy" | "degraded" | "error";
  agentId: string;
  connectedClients: number;
  timestamp: string;
  uptime?: number;
}
