/**
 * User-related types and interfaces
 */

export interface UserContext {
  userId: string;
  environment: 'development' | 'staging' | 'production';
  authToken?: string;
}

export interface UserActivity {
  userId: string;
  action: string;
  timestamp: string;
  tideId?: string;
  details?: any;
}

export interface UserMetrics {
  userId: string;
  totalAnalyses: number;
  lastActivity: string;
  averageConfidence: number;
  implementedRecommendations: number;
  preferredAnalysisTypes: string[];
}

// Re-export commonly used types
export type { UserPreferences } from './requests';
export type { UserSession } from './analysis';