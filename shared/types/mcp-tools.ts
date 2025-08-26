/**
 * @fileoverview Shared MCP Tool Types and Constants
 * 
 * This file defines all MCP tool names, parameters, and response types shared
 * between the server and mobile client to ensure type safety and consistency.
 */

// MCP Tool Name Constants
export const MCP_TOOLS = {
  // Core Tide Management
  TIDE_CREATE: 'tide_create',
  TIDE_LIST: 'tide_list', 
  TIDE_FLOW: 'tide_flow',
  TIDE_ADD_ENERGY: 'tide_add_energy',
  TIDE_LINK_TASK: 'tide_link_task',
  TIDE_LIST_TASK_LINKS: 'tide_list_task_links',
  TIDE_GET_REPORT: 'tide_get_report',
  TIDE_GET_RAW_JSON: 'tide_get_raw_json',
  TIDES_GET_PARTICIPANTS: 'tides_get_participants',
  
  // Hierarchical Flow Tools
  TIDE_GET_OR_CREATE_DAILY: 'tide_get_or_create_daily',
  TIDE_START_HIERARCHICAL_FLOW: 'tide_start_hierarchical_flow',
  TIDE_GET_TODAYS_SUMMARY: 'tide_get_todays_summary',
  TIDE_LIST_CONTEXTS: 'tide_list_contexts',
  TIDE_SWITCH_CONTEXT: 'tide_switch_context',
} as const;

// Tool Parameter Types
export interface TideCreateParams {
  name: string;
  flow_type: 'daily' | 'weekly' | 'monthly' | 'project' | 'seasonal';
  description?: string;
}

export interface TideListParams {
  flow_type?: string;
  active_only?: boolean;
}

export interface TideFlowParams {
  tide_id: string;
  intensity?: 'gentle' | 'moderate' | 'strong';
  duration?: number;
  initial_energy?: string;
  work_context?: string;
}

export interface TideAddEnergyParams {
  tide_id: string;
  energy_level: string;
  context?: string;
}

export interface TideLinkTaskParams {
  tide_id: string;
  task_url: string;
  task_title: string;
  task_type?: string;
}

export interface TideListTaskLinksParams {
  tide_id: string;
}

export interface TideGetReportParams {
  tide_id: string;
  format?: 'json' | 'markdown' | 'csv';
}

export interface TideGetRawJsonParams {
  tide_id: string;
}

export interface TidesGetParticipantsParams {
  status_filter?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// Hierarchical Tool Parameters
export interface TideGetOrCreateDailyParams {
  timezone?: string;
  date?: string;
}

export interface TideStartHierarchicalFlowParams {
  intensity?: 'gentle' | 'moderate' | 'strong';
  duration?: number;
  initial_energy?: string;
  work_context?: string;
  date?: string;
}

export interface TideGetTodaysSummaryParams {
  date?: string;
}

export interface TideListContextsParams {
  date?: string;
  include_empty?: boolean;
}

export interface TideSwitchContextParams {
  context_type: 'daily' | 'weekly' | 'monthly' | 'project';
  date?: string;
}

// Response Types (common patterns)
export interface MCPSuccessResponse<T = any> {
  success: true;
  [key: string]: any;
}

export interface MCPErrorResponse {
  success: false;
  error: string;
}

export type MCPResponse<T = any> = MCPSuccessResponse<T> | MCPErrorResponse;

// Tide Data Types
export interface FlowType {
  id: string;
  name: string;
  flow_type: string;
  status: string;
  created_at: string;
  description?: string;
  flow_count?: number;
  last_flow?: string | null;
}

export interface TaskLink {
  id: string;
  task_url: string;
  task_title: string;
  task_type: string;
  linked_at: string;
}

export interface EnergyUpdate {
  id: string;
  tide_id: string;
  energy_level: string;
  context: string;
  timestamp: string;
}

export interface FlowSession {
  id: string;
  tide_id: string;
  intensity: string;
  duration: number;
  started_at: string;
  energy_level: string;
  work_context: string;
}

// Specific Response Types
export interface TideCreateResponse extends MCPSuccessResponse {
  tide_id: string;
  name: string;
  flow_type: string;
  created_at: string;
  status: string;
  description: string;
  next_flow: string | null;
}

export interface TideListResponse extends MCPSuccessResponse {
  tides: FlowType[];
  count: number;
}

export interface HierarchicalFlowResponse extends MCPSuccessResponse {
  session_id: string;
  date: string;
  intensity: string;
  duration: number;
  started_at: string;
  energy_level: string;
  work_context: string;
  contexts: Array<{
    context: string;
    tide_id: string;
    tide_name: string;
    session_id: string;
    created: boolean;
  }>;
  message: string;
}

// Type guard utilities
export function isMCPError(response: MCPResponse): response is MCPErrorResponse {
  return response.success === false;
}

export function isMCPSuccess<T>(response: MCPResponse<T>): response is MCPSuccessResponse<T> {
  return response.success === true;
}