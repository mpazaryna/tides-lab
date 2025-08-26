// Shared type definitions for MCP communication
// These should be copied into each app as needed, not imported

export interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id: string | number;
}

export interface MCPResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

export interface TideWorkflow {
  id: string;
  title: string;
  description: string;
  energy_level: number;
  flow_state: "incoming" | "peak" | "outgoing";
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}