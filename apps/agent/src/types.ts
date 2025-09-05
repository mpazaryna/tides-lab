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
  message?: string;  // Support both question and message fields
  conversation_id?: string;
  context?: {
    recent_messages?: Array<{ role: string; content: string }>;
    user_time?: string;
  };
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

// Actual R2 tide data structure with rich time-series data
export interface FlowSession {
  id: string;                   // "session_TIMESTAMP_HASH"
  tide_id: string;             // Parent tide reference
  intensity: "gentle" | "moderate" | "strong";  // Work intensity
  duration: number;            // Session duration in minutes
  started_at: string;          // ISO timestamp
  energy_level?: string;       // Starting energy level
  work_context?: string;       // What specific work was done
}

export interface EnergyUpdate {
  id: string;                  // "energy_TIMESTAMP_HASH"
  tide_id: string;            // Parent tide reference
  energy_level: string;       // "1-10" scale or descriptive
  context?: string;           // What's affecting energy
  timestamp: string;          // ISO timestamp
}

export interface TaskLink {
  id: string;                  // "link_TIMESTAMP_HASH"
  tide_id: string;            // Parent tide reference
  task_url: string;           // URL to external task
  task_title: string;         // Display title
  task_type: string;          // System type (github_issue, linear_task, etc.)
  linked_at: string;          // ISO timestamp
}

export interface TideData {
  // Basic metadata
  id: string;                    // Format: "tide_TIMESTAMP_HASH"
  name: string;                  // Display name
  flow_type: "daily" | "weekly" | "monthly" | "project" | "seasonal";
  description?: string;          // Optional description
  created_at: string;           // ISO timestamp
  status: "active" | "completed" | "paused";
  
  // Rich nested data arrays (the real insights source)
  flow_sessions: FlowSession[];  // All focused work sessions
  energy_updates: EnergyUpdate[]; // All energy check-ins
  task_links: TaskLink[];       // All linked external tasks
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