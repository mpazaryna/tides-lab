// MCP (Model Context Protocol) JSON-RPC 2.0 types

export interface MCPRequest<T = any> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: T;
}

export interface MCPResponse<T = any> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// MCP method names
export enum MCPMethods {
  // Tide management
  TIDE_CREATE = 'tide_create',
  TIDE_LIST = 'tide_list',
  TIDE_FLOW = 'tide_flow',
  TIDE_ADD_ENERGY = 'tide_add_energy',
  TIDE_LINK_TASK = 'tide_link_task',
  TIDE_LIST_TASK_LINKS = 'tide_list_task_links',
  TIDE_GET_REPORT = 'tide_get_report',
  TIDES_GET_PARTICIPANTS = 'tides_get_participants',
  
  // System
  HEALTH_CHECK = 'health_check',
  LIST_TOOLS = 'list_tools',
}

// MCP error codes
export enum MCPErrorCodes {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // Custom error codes
  UNAUTHORIZED = -32001,
  NOT_FOUND = -32002,
  VALIDATION_ERROR = -32003,
}

// MCP method parameter types
export interface TideCreateParams {
  name: string;
  flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
  description?: string;
  initial_energy?: 'low' | 'medium' | 'high';
}

export interface TideListParams {
  status?: 'active' | 'completed' | 'paused';
  flow_type?: 'daily' | 'weekly' | 'project' | 'seasonal';
  limit?: number;
}

export interface TideFlowParams {
  tide_id: string;
  intensity: 'gentle' | 'moderate' | 'strong';
  duration: number;
  energy_level: 'low' | 'medium' | 'high';
  work_context?: string;
}

export interface TideAddEnergyParams {
  tide_id: string;
  energy_level: 'low' | 'medium' | 'high' | 'completed';
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

export interface TidesGetParticipantsParams {
  status?: 'active' | 'inactive';
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// Helper type for creating MCP requests
export type MCPRequestBuilder<T = any> = {
  createRequest(method: string, params?: T): MCPRequest<T>;
  parseResponse<R>(response: MCPResponse<R>): R;
  isError(response: MCPResponse): boolean;
};