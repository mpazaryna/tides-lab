// Centralized domain model types

// User and authentication models
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

// Tide workflow models
export interface Tide {
  id: string;
  name: string;
  status: TideStatus;
  flow_type: FlowType;
  description?: string;
  energy_level?: number;
  flow_count?: number;
  last_flow?: string | null;
  created_at: string;
  updated_at: string;
}

export type TideStatus = 'active' | 'completed' | 'paused';
export type FlowType = 'daily' | 'weekly' | 'project' | 'seasonal';
export type FlowIntensity = 'gentle' | 'moderate' | 'strong';
export type EnergyLevel = 'low' | 'medium' | 'high' | 'completed';

// Flow session models
export interface FlowSession {
  id: string;
  tide_id: string;
  intensity: FlowIntensity;
  duration: number; // minutes
  started_at: string;
  ended_at?: string;
  energy_level?: EnergyLevel;
  work_context?: string;
}

// Task linking models
export interface TaskLink {
  id: string;
  tide_id: string;
  task_url: string;
  task_title: string;
  task_type: string;
  linked_at: string;
}

// Energy tracking models
export interface EnergyEntry {
  id: string;
  tide_id: string;
  energy_level: EnergyLevel;
  context?: string;
  timestamp: string;
}

// Participant models
export interface Participant {
  id: string;
  provider_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: ParticipantStatus;
  created_at: string;
}

export type ParticipantStatus = 'active' | 'inactive' | 'pending';

// Report models
export interface TideReport {
  tide_id: string;
  name: string;
  flow_type: FlowType;
  created_at: string;
  total_flows: number;
  total_duration: number;
  average_duration: number;
  energy_progression: EnergyLevel[];
  linked_tasks: number;
  last_flow: string | null;
}

// Generic response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}