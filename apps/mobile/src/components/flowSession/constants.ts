// FlowSession constants and types
export type FlowIntensity = "gentle" | "moderate" | "strong";
export type FlowDuration = 15 | 25 | 30 | 45 | 60;

export interface FlowSessionSettings {
  intensity: FlowIntensity;
  duration: FlowDuration;
}

export interface FlowSessionState {
  isActive: boolean;
  sessionId: string | null;
  startTime: Date | null;
  elapsedTime: number;
  settings: FlowSessionSettings;
}

export interface FlowSessionTimerConfig {
  updateInterval: number; // milliseconds
  autoEndEnabled: boolean;
}

// Configuration constants
export const FLOW_SESSION_CONFIG = {
  DEFAULT_INTENSITY: "moderate" as FlowIntensity,
  DEFAULT_DURATION: 25 as FlowDuration,
  TIMER_UPDATE_INTERVAL: 1000, // 1 second
  AUTO_END_ENABLED: true,
} as const;

export const INTENSITY_OPTIONS: readonly FlowIntensity[] = [
  "gentle",
  "moderate",
  "strong",
] as const;

export const DURATION_OPTIONS: readonly FlowDuration[] = [
  15, 25, 30, 45, 60,
] as const;

// Alert message templates
export const FLOW_SESSION_MESSAGES = {
  FLOW_STARTED: (intensity: FlowIntensity, duration: FlowDuration) =>
    `Started ${intensity} intensity session for ${duration} minutes`,
  FLOW_ENDED: (minutes: number) =>
    `Flow session ended after ${minutes} minutes`,
  START_ERROR: "Failed to start flow session",
  END_ERROR: "Failed to end flow session properly",
  SESSION_COMPLETE_TITLE: "Session Complete",
  FLOW_STARTED_TITLE: "Flow Started",
  ERROR_TITLE: "Error",
} as const;

// Validation helpers
export const isValidIntensity = (value: any): value is FlowIntensity =>
  INTENSITY_OPTIONS.includes(value);

export const isValidDuration = (value: any): value is FlowDuration =>
  DURATION_OPTIONS.includes(value);

export const validateFlowSettings = (
  settings: Partial<FlowSessionSettings>
): settings is FlowSessionSettings => {
  return (
    settings.intensity !== undefined &&
    settings.duration !== undefined &&
    isValidIntensity(settings.intensity) &&
    isValidDuration(settings.duration)
  );
};
