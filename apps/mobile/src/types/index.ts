// Central export point for all type definitions

// Domain models
export * from './models';

// API types
export * from './api';

// MCP protocol types
export * from './mcp';

// Re-export commonly used types for convenience
export type {
  // Models
  User,
  Tide,
  FlowSession,
  TaskLink,
  EnergyEntry,
  Participant,
  TideReport,
  
  // Enums and unions
  TideStatus,
  FlowType,
  FlowIntensity,
  EnergyLevel,
  ParticipantStatus,
  
  // Generic types
  ApiResponse,
} from './models';

export type {
  // API responses
  BaseResponse,
  TideCreateResponse,
  TideListResponse,
  FlowSessionResponse,
  EnergyUpdateResponse,
  TaskLinkResponse,
  TaskLinksListResponse,
  TideReportResponse,
  ParticipantsResponse,
  AuthResponse,
  HttpError,
  ServiceResult,
  ServiceError,
} from './api';

// Compatibility aliases for backward compatibility  
import type { EnergyUpdateResponse, TaskLinksListResponse } from './api';
export type EnergyUpdate = EnergyUpdateResponse;
export type TaskLinksResponse = TaskLinksListResponse;

export type {
  // MCP types
  MCPRequest,
  MCPResponse,
  MCPError,
} from './mcp';