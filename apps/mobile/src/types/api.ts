// API request and response types

import type { 
  Tide, 
  TaskLink, 
  Participant, 
  TideReport,
  FlowIntensity,
  EnergyLevel,
  FlowType,
  TideStatus
} from './models';

// Base response structure
export interface BaseResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// Tide API responses
export interface TideCreateResponse extends BaseResponse {
  tide_id?: string;
  name?: string;
  flow_type?: FlowType;
  created_at?: string;
  status?: TideStatus;
  description?: string;
  next_flow?: string;
}

export interface TideListResponse extends BaseResponse {
  tides: Tide[];
  count: number;
}

export interface FlowSessionResponse extends BaseResponse {
  session_id?: string;
  tide_id?: string;
  intensity?: FlowIntensity;
  duration?: number;
  started_at?: string;
  energy_level?: EnergyLevel;
  work_context?: string;
}

export interface EnergyUpdateResponse extends BaseResponse {
  energy_id?: string;
  tide_id?: string;
  energy_level?: EnergyLevel;
  context?: string;
  timestamp?: string;
}

export interface TaskLinkResponse extends BaseResponse {
  link_id?: string;
  tide_id?: string;
  task_url?: string;
  task_title?: string;
  task_type?: string;
  linked_at?: string;
}

export interface TaskLinksListResponse extends BaseResponse {
  tide_id?: string;
  links: TaskLink[];
  count: number;
}

export interface TideReportResponse extends BaseResponse {
  format?: 'json' | 'markdown' | 'csv';
  report?: TideReport;
  content?: string;
}

export interface ParticipantsResponse extends BaseResponse {
  participants: Participant[];
  count: number;
  filters_applied: {
    status: string;
    date_from: string | null;
    date_to: string | null;
    limit: number;
  };
}

// Auth API types
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest extends SignInRequest {
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse extends BaseResponse {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  authToken?: string;
}

// HTTP client types
export interface HttpRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// Service method return types
export type ServiceResult<T> = Promise<T | null>;
export type ServiceError = { error: string; details?: any };