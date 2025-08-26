/**
 * Enhanced Agent Service Types
 * 
 * Comprehensive type definitions for the reliable agent endpoint connection system.
 * Extends existing chat types with advanced connection management capabilities.
 */

// ======================== Core Agent Types ========================

export interface AgentMessage {
  id: string;
  type: "request" | "response" | "thinking" | "tool_call" | "system";
  content: string;
  timestamp: Date;
  agentId?: string;
  userId?: string;
  toolCalls?: ToolCall[];
  thinking?: boolean;
  metadata?: AgentMessageMetadata;
}

export interface AgentMessageMetadata {
  conversationId?: string;
  parentMessageId?: string;
  connectionId?: string;
  processingTime?: number;
  retryCount?: number;
  fallbackUsed?: boolean;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  status: "pending" | "executing" | "completed" | "failed";
  result?: any;
  error?: string;
  executionTime?: number;
}

// ======================== Connection Management ========================

export type ConnectionState = 
  | "disconnected"
  | "connecting" 
  | "connected"
  | "reconnecting"
  | "degraded"
  | "failed";

export interface ConnectionStatus {
  state: ConnectionState;
  connectionId: string;
  endpoint: string;
  lastConnected?: Date;
  lastError?: Date;
  errorCount: number;
  latency?: number;
  isHealthy: boolean;
  metadata: {
    uptime?: number;
    reconnectionAttempts: number;
    lastHealthCheck: Date;
    capabilities?: string[];
  };
}

export interface ConnectionPool {
  primary: ConnectionStatus;
  fallbacks: ConnectionStatus[];
  activeConnection: string;
  healthyConnections: string[];
  totalConnections: number;
}

// ======================== Health Monitoring ========================

export interface HealthMetrics {
  availability: number; // 0-1 percentage
  responseTime: number; // milliseconds
  errorRate: number; // 0-1 percentage
  throughput: number; // requests per second
  lastUpdated: Date;
  trends: {
    availability7d: number;
    responseTime7d: number;
    errorRate24h: number;
  };
}

export interface HealthCheck {
  id: string;
  endpoint: string;
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  timestamp: Date;
  details?: {
    httpStatus?: number;
    errorMessage?: string;
    agentVersion?: string;
    capabilities?: string[];
  };
}

// ======================== Circuit Breaker ========================

export type CircuitBreakerState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  minimumThroughput: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

// ======================== Request Management ========================

export interface QueuedRequest {
  id: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  endpoint: string;
  payload?: any;
  headers?: Record<string, string>;
  priority: "low" | "normal" | "high" | "critical";
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  callback?: (result: any, error?: Error) => void;
}

export interface RequestQueueMetrics {
  queueSize: number;
  processedToday: number;
  failedToday: number;
  averageProcessingTime: number;
  oldestRequest?: Date;
}

// ======================== Natural Language Processing ========================

export interface ParsedCommand {
  intent: CommandIntent;
  confidence: number;
  parameters: Record<string, any>;
  originalText: string;
  alternatives?: ParsedCommand[];
}

export type CommandIntent = 
  | "create_tide"
  | "list_tides" 
  | "start_flow"
  | "add_energy"
  | "get_report"
  | "link_task"
  | "get_insights"
  | "optimize_tide"
  | "question"
  | "unknown";

export interface IntentPattern {
  intent: CommandIntent;
  patterns: RegExp[];
  requiredParams: string[];
  optionalParams: string[];
  examples: string[];
}

// ======================== Configuration ========================

export interface AgentServiceConfig {
  // Connection settings
  primaryEndpoint: string;
  fallbackEndpoints?: string[];
  webSocketEndpoint?: string;
  
  // Timeout and retry settings
  timeoutMs: number;
  retryAttempts: number;
  retryDelay: number;
  
  // Connection pool settings
  maxConnections: number;
  connectionTimeout: number;
  keepAliveInterval: number;
  
  // Health monitoring
  healthCheckInterval: number;
  healthCheckTimeout: number;
  degradationThreshold: number;
  
  // Circuit breaker settings
  circuitBreaker: CircuitBreakerConfig;
  
  // Queue settings
  maxQueueSize: number;
  queuePersistence: boolean;
  queueProcessingInterval: number;
  
  // Feature flags
  enableWebSocket: boolean;
  enableConnectionPooling: boolean;
  enableRequestQueuing: boolean;
  enableFallbacks: boolean;
  enableNLParsing: boolean;
}

// ======================== Service Responses ========================

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
  };
  metadata?: {
    processingTime: number;
    connectionId: string;
    fallbackUsed: boolean;
    queuePosition?: number;
  };
}

export interface AgentStatus {
  status: "healthy" | "degraded" | "unhealthy";
  agentId: string;
  version: string;
  uptime: number;
  connectedClients: number;
  capabilities: string[];
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  timestamp: Date;
}

// ======================== Event Types ========================

export type AgentEvent = 
  | "connection_established"
  | "connection_lost" 
  | "connection_degraded"
  | "connection_recovered"
  | "message_received"
  | "message_sent"
  | "health_check_passed"
  | "health_check_failed"
  | "circuit_breaker_opened"
  | "circuit_breaker_closed"
  | "fallback_activated"
  | "queue_full"
  | "request_queued"
  | "request_processed";

export interface AgentEventData {
  event: AgentEvent;
  timestamp: Date;
  connectionId?: string;
  details?: any;
  error?: Error;
}

// ======================== Fallback Strategy ========================

export interface FallbackOption {
  type: "mcp_direct" | "cached_response" | "default_message" | "offline_queue";
  priority: number;
  enabled: boolean;
  config?: any;
}

export interface FallbackResult {
  success: boolean;
  source: "mcp" | "cache" | "default" | "queue";
  data?: any;
  message?: string;
  limitations?: string[];
}

// ======================== Cache Management ========================

export interface CachedResponse {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  hits: number;
  source: string;
}

export interface CacheMetrics {
  hitRate: number;
  totalSize: number;
  evictionCount: number;
  oldestEntry?: Date;
}

// ======================== Export Types ========================

// Re-export for backward compatibility
export type { 
  AgentServiceConfig as LegacyAgentServiceConfig,
  AgentMessage as LegacyAgentMessage 
} from './chat';

// Main exports
export type EnhancedAgentService = {
  // Connection management
  getConnectionStatus(): ConnectionPool;
  getHealthMetrics(): HealthMetrics;
  testConnection(endpoint?: string): Promise<boolean>;
  
  // Message handling with reliability
  sendMessage(message: string, options?: {
    timeout?: number;
    priority?: "low" | "normal" | "high";
    fallbackAllowed?: boolean;
  }): Promise<AgentResponse<AgentMessage>>;
  
  // Natural language processing
  parseCommand(text: string): ParsedCommand;
  executeCommand(command: ParsedCommand): Promise<AgentResponse>;
  
  // Queue management
  getQueueMetrics(): RequestQueueMetrics;
  clearQueue(): Promise<void>;
  retryFailedRequests(): Promise<number>;
  
  // Configuration
  updateConfig(config: Partial<AgentServiceConfig>): void;
  getConfig(): AgentServiceConfig;
  
  // Event handling
  on(event: AgentEvent, callback: (data: AgentEventData) => void): () => void;
  off(event: AgentEvent, callback: (data: AgentEventData) => void): void;
};