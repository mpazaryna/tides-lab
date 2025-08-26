/**
 * User preferences types - extracted to avoid circular dependencies
 */

export interface UserPreferences {
  preferredTimeBlocks?: string;
  energyGoals?: string[];
  notificationFrequency?: "hourly" | "daily" | "weekly";
  analysisDepth?: "basic" | "detailed" | "comprehensive";
  autoImplement?: boolean;
  confidenceThreshold?: number;
}

export interface Optimization {
  tideId: string;
  recommendations: string;
  confidence: number;
  autoImplemented?: boolean;
  error?: string;
}