/**
 * Analysis-related types and interfaces
 */

export interface AnalysisRecord {
  timestamp: string;
  type: 'productivity_insights' | 'energy_optimization' | 'custom_analysis';
  tideId: string;
  confidence: number;
  implemented: boolean;
  insights?: string;
  userId: string;
}

export interface AnalysisResult {
  response: string;
  confidence: number;
  actionable: boolean;
  priority: number;
}

export interface TideInfo {
  id: string;
  name: string;
  flow_type: string;
  status?: string;
  created_at?: string;
  description?: string;
}

export interface SmartNotification {
  type: 'productivity_insight' | 'energy_optimization' | 'schedule_update' | 'custom_analysis';
  title: string;
  insights: string;
  priority?: number;
  timestamp: string;
  userId: string;
  tideId?: string;
}

export interface WebSocketMessage {
  type: 'welcome' | 'authenticated' | 'authenticate' | 'notification' | 'analysis_result' | 'error' | 'ping' | 'pong';
  [key: string]: any;
}

export interface UserSession {
  userId: string;
  connectedAt: string;
  lastActivity: string;
  preferences?: UserPreferences;
}

export interface MCPPromptArgs {
  tide_id: string;
  time_period?: string;
  analysis_question?: string;
  context?: string;
  output_format?: string;
  comparison_baseline?: string;
  target_schedule?: string;
  energy_goals?: string;
}

// Import UserPreferences from requests to avoid circular dependency
import type { UserPreferences } from './requests';