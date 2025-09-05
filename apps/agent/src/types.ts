/**
 * Type definitions for Tides Agent
 */

export interface Env {
  DB: D1Database;
  TIDES_R2: R2Bucket;
  TIDES_AUTH_KV: KVNamespace;
  AI: Ai;
  COORDINATOR: DurableObjectNamespace;
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  ENVIRONMENT: string;
}

export interface AgentRequest {
  api_key: string;
  tides_id: string;
  service?: string; // Optional - takes precedence over inference if present
}

export interface InsightsRequest extends AgentRequest {
  timeframe?: string;
  focus_areas?: string[];
}

export interface OptimizeRequest extends AgentRequest {
  preferences?: UserPreferences;
  constraints?: ScheduleConstraints;
}

export interface QuestionsRequest extends AgentRequest {
  question: string;
  context?: string;
}

export interface ChatRequest extends AgentRequest {
  question?: string;
  conversation_id?: string;
  previous_context?: {
    service?: string;
    response?: any;
  };
}

export interface ChatResponse {
  needs_clarification: boolean;
  message?: string;
  suggestions?: string[];
  conversation_id?: string;
  confidence?: number;
  follow_up?: {
    insights: string[];
    questions: string[];
    recommendations: string[];
  };
}

export interface PreferencesRequest extends AgentRequest {
  preferences?: UserPreferences;
}

export interface ReportsRequest extends AgentRequest {
  report_type: 'summary' | 'detailed' | 'analytics';
  period?: string;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    service: string;
    timestamp: string;
    processing_time_ms: number;
  };
}

export interface UserPreferences {
  work_hours?: {
    start: string;
    end: string;
  };
  break_duration?: number;
  focus_time_blocks?: number;
  notification_preferences?: {
    insights: boolean;
    optimization: boolean;
    reminders: boolean;
  };
}

export interface ScheduleConstraints {
  min_session_duration?: number;
  max_session_duration?: number;
  buffer_time?: number;
  priority_tasks?: string[];
}

export interface TideData {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface InsightsData {
  productivity_score: number;
  trends: {
    daily_average: number;
    weekly_pattern: number[];
    improvement_areas: string[];
  };
  recommendations: string[];
}

export interface OptimizationData {
  suggested_schedule: {
    time_blocks: Array<{
      start: string;
      end: string;
      activity: string;
      priority: number;
    }>;
  };
  efficiency_gains: {
    estimated_time_saved: number;
    focus_improvement: number;
  };
}