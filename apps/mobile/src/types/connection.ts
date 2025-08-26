/**
 * Connection Configuration Types
 * 
 * Comprehensive configuration interfaces for agent connection management,
 * retry policies, health monitoring, and resilience features.
 */

// ======================== Base Connection Configuration ========================

export interface ConnectionEndpoint {
  url: string;
  type: "primary" | "fallback" | "websocket";
  priority: number;
  timeout: number;
  maxConcurrentRequests: number;
  enabled: boolean;
  metadata?: {
    region?: string;
    version?: string;
    capabilities?: string[];
    tags?: string[];
  };
}

export interface ConnectionPoolConfig {
  // Pool sizing
  minConnections: number;
  maxConnections: number;
  maxIdleConnections: number;
  
  // Connection lifecycle
  connectionTimeout: number;
  keepAliveTimeout: number;
  idleTimeout: number;
  maxConnectionAge: number;
  
  // Load balancing
  strategy: "round_robin" | "least_connections" | "weighted" | "random";
  weights?: Record<string, number>;
  
  // Health management
  healthCheckInterval: number;
  unhealthyThreshold: number;
  recoveryThreshold: number;
  
  // Cleanup and maintenance
  cleanupInterval: number;
  connectionRetryDelay: number;
  maxRetryAttempts: number;
}

// ======================== Retry and Resilience Configuration ========================

export interface RetryPolicy {
  // Basic retry settings
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  
  // Retry conditions
  retryableStatusCodes: number[];
  retryableErrors: string[];
  nonRetryableErrors: string[];
  
  // Advanced retry features
  jitterEnabled: boolean;
  exponentialBackoff: boolean;
  resetTimeoutOnRetry: boolean;
  
  // Per-operation overrides
  operationOverrides?: Record<string, Partial<RetryPolicy>>;
}

export interface TimeoutConfig {
  // Request timeouts
  connectionTimeout: number;
  requestTimeout: number;
  responseTimeout: number;
  
  // Specialized timeouts
  healthCheckTimeout: number;
  authenticationTimeout: number;
  streamingTimeout: number;
  
  // WebSocket timeouts
  wsConnectionTimeout: number;
  wsPingInterval: number;
  wsPongTimeout: number;
  
  // Queue timeouts
  queueItemTimeout: number;
  queueProcessingTimeout: number;
}

// ======================== Health Monitoring Configuration ========================

export interface HealthCheckConfig {
  // Check intervals
  interval: number;
  initialDelay: number;
  
  // Check parameters
  endpoint: string;
  method: "GET" | "POST" | "HEAD";
  expectedStatus: number[];
  timeout: number;
  
  // Response validation
  validateResponse?: {
    requiredFields?: string[];
    expectedValues?: Record<string, any>;
    minimumResponseSize?: number;
  };
  
  // Failure handling
  consecutiveFailureThreshold: number;
  degradationThreshold: number;
  recoveryThreshold: number;
  
  // Advanced options
  enableLatencyTracking: boolean;
  enableResponseValidation: boolean;
  failOnTimeout: boolean;
}

export interface MetricsConfig {
  // Collection settings
  enabled: boolean;
  collectionInterval: number;
  retentionPeriod: number;
  
  // Metrics to track
  trackLatency: boolean;
  trackThroughput: boolean;
  trackErrorRates: boolean;
  trackQueueMetrics: boolean;
  
  // Aggregation settings
  aggregationWindow: number;
  percentiles: number[];
  
  // Storage settings
  maxDataPoints: number;
  compressionEnabled: boolean;
}

// ======================== Circuit Breaker Configuration ========================

export interface CircuitBreakerConfig {
  // Failure detection
  failureRateThreshold: number;
  minimumThroughput: number;
  slidingWindowSize: number;
  slidingWindowType: "count" | "time";
  
  // State transitions
  openStateTimeout: number;
  halfOpenMaxCalls: number;
  
  // Advanced features
  slowCallRateThreshold?: number;
  slowCallDuration?: number;
  enableSlowCallDetection: boolean;
  
  // Monitoring
  recordExceptions: string[];
  ignoreExceptions: string[];
}

// ======================== Queue Configuration ========================

export interface QueueConfig {
  // Basic queue settings
  maxSize: number;
  defaultTimeout: number;
  processingInterval: number;
  
  // Priority settings
  enablePriority: boolean;
  priorityLevels: ("low" | "normal" | "high" | "critical")[];
  
  // Persistence settings
  persistent: boolean;
  persistenceKey?: string;
  maxPersistentSize?: number;
  
  // Processing settings
  batchSize: number;
  maxConcurrentProcessing: number;
  processingTimeout: number;
  
  // Retry settings for queued items
  itemRetryPolicy: RetryPolicy;
  
  // Cleanup settings
  cleanupInterval: number;
  maxAge: number;
}

// ======================== Cache Configuration ========================

export interface CacheConfig {
  // Basic cache settings
  enabled: boolean;
  maxSize: number;
  defaultTTL: number;
  
  // Cache strategies
  strategy: "lru" | "lfu" | "ttl" | "fifo";
  
  // Per-operation TTL overrides
  ttlOverrides?: Record<string, number>;
  
  // Invalidation settings
  autoInvalidateOnError: boolean;
  invalidateOnStatusCodes: number[];
  
  // Storage settings
  persistent: boolean;
  persistenceKey?: string;
  compressionEnabled: boolean;
  
  // Cleanup settings
  cleanupInterval: number;
  maxMemoryUsage: number;
}

// ======================== Fallback Configuration ========================

export interface FallbackConfig {
  // Fallback enablement
  enabled: boolean;
  strategy: "sequential" | "parallel" | "weighted";
  
  // MCP direct fallback
  mcpFallback: {
    enabled: boolean;
    timeout: number;
    priority: number;
  };
  
  // Cache fallback
  cacheFallback: {
    enabled: boolean;
    maxAge: number;
    priority: number;
  };
  
  // Default response fallback
  defaultFallback: {
    enabled: boolean;
    responses: Record<string, any>;
    priority: number;
  };
  
  // Queue fallback for offline scenarios
  queueFallback: {
    enabled: boolean;
    priority: number;
    maxQueueTime: number;
  };
  
  // Fallback chain timeout
  totalTimeout: number;
  enablePartialResults: boolean;
}

// ======================== Security Configuration ========================

export interface SecurityConfig {
  // Authentication
  authMethod: "bearer" | "api_key" | "oauth" | "custom";
  tokenRefreshThreshold: number;
  
  // TLS/SSL settings
  tlsVersion?: string;
  certificateValidation: boolean;
  allowSelfSigned: boolean;
  
  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
    window: number;
  };
  
  // Request signing
  requestSigning?: {
    enabled: boolean;
    algorithm: string;
    keyRotationInterval: number;
  };
}

// ======================== Development and Debugging Configuration ========================

export interface DebugConfig {
  // Logging levels
  logLevel: "debug" | "info" | "warn" | "error";
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
  enableMetricsLogging: boolean;
  
  // Request tracing
  enableTracing: boolean;
  traceHeaders: string[];
  
  // Performance monitoring  
  enablePerformanceLogging: boolean;
  slowRequestThreshold: number;
  
  // Mock and testing
  mockMode?: "disabled" | "fallback" | "primary";
  mockResponses?: Record<string, any>;
  
  // Debug utilities
  enableConnectionDiagnostics: boolean;
  enableHealthCheckDetails: boolean;
}

// ======================== Main Configuration Interface ========================

export interface EnhancedAgentConnectionConfig {
  // Core connection settings
  endpoints: ConnectionEndpoint[];
  poolConfig: ConnectionPoolConfig;
  
  // Resilience and reliability
  retryPolicy: RetryPolicy;
  timeouts: TimeoutConfig;
  circuitBreaker: CircuitBreakerConfig;
  
  // Monitoring and health
  healthCheck: HealthCheckConfig;
  metrics: MetricsConfig;
  
  // Queue and cache
  queue: QueueConfig;
  cache: CacheConfig;
  
  // Fallback strategies
  fallback: FallbackConfig;
  
  // Security and auth
  security: SecurityConfig;
  
  // Development and debugging
  debug?: DebugConfig;
  
  // Feature flags
  features: {
    enableConnectionPooling: boolean;
    enableCircuitBreaker: boolean;
    enableRequestQueue: boolean;
    enableCache: boolean;
    enableFallbacks: boolean;
    enableMetrics: boolean;
    enableHealthChecks: boolean;
  };
}

// ======================== Default Configurations ========================

export const DEFAULT_CONNECTION_CONFIG: EnhancedAgentConnectionConfig = {
  endpoints: [],
  
  poolConfig: {
    minConnections: 1,
    maxConnections: 5,
    maxIdleConnections: 2,
    connectionTimeout: 5000,
    keepAliveTimeout: 30000,
    idleTimeout: 60000,
    maxConnectionAge: 300000,
    strategy: "round_robin",
    healthCheckInterval: 30000,
    unhealthyThreshold: 3,
    recoveryThreshold: 2,
    cleanupInterval: 60000,
    connectionRetryDelay: 1000,
    maxRetryAttempts: 3,
  },
  
  retryPolicy: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrors: ["TIMEOUT", "CONNECTION_RESET", "NETWORK_ERROR"],
    nonRetryableErrors: ["AUTH_ERROR", "INVALID_REQUEST"],
    jitterEnabled: true,
    exponentialBackoff: true,
    resetTimeoutOnRetry: false,
  },
  
  timeouts: {
    connectionTimeout: 5000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    healthCheckTimeout: 5000,
    authenticationTimeout: 10000,
    streamingTimeout: 60000,
    wsConnectionTimeout: 10000,
    wsPingInterval: 30000,
    wsPongTimeout: 5000,
    queueItemTimeout: 300000,
    queueProcessingTimeout: 60000,
  },
  
  circuitBreaker: {
    failureRateThreshold: 0.5,
    minimumThroughput: 10,
    slidingWindowSize: 100,
    slidingWindowType: "count",
    openStateTimeout: 60000,
    halfOpenMaxCalls: 3,
    slowCallRateThreshold: 0.6,
    slowCallDuration: 10000,
    enableSlowCallDetection: true,
    recordExceptions: [],
    ignoreExceptions: [],
  },
  
  healthCheck: {
    interval: 30000,
    initialDelay: 5000,
    endpoint: "/ai/health",
    method: "GET",
    expectedStatus: [200],
    timeout: 5000,
    consecutiveFailureThreshold: 3,
    degradationThreshold: 0.8,
    recoveryThreshold: 0.9,
    enableLatencyTracking: true,
    enableResponseValidation: true,
    failOnTimeout: true,
  },
  
  metrics: {
    enabled: true,
    collectionInterval: 60000,
    retentionPeriod: 86400000, // 24 hours
    trackLatency: true,
    trackThroughput: true,
    trackErrorRates: true,
    trackQueueMetrics: true,
    aggregationWindow: 300000, // 5 minutes
    percentiles: [50, 90, 95, 99],
    maxDataPoints: 1000,
    compressionEnabled: true,
  },
  
  queue: {
    maxSize: 100,
    defaultTimeout: 300000,
    processingInterval: 1000,
    enablePriority: true,
    priorityLevels: ["low", "normal", "high", "critical"],
    persistent: true,
    maxPersistentSize: 1000,
    batchSize: 10,
    maxConcurrentProcessing: 3,
    processingTimeout: 60000,
    itemRetryPolicy: {
      maxAttempts: 2,
      initialDelay: 2000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryableErrors: ["TIMEOUT", "CONNECTION_RESET"],
      nonRetryableErrors: ["AUTH_ERROR"],
      jitterEnabled: true,
      exponentialBackoff: true,
      resetTimeoutOnRetry: true,
    },
    cleanupInterval: 300000,
    maxAge: 3600000, // 1 hour
  },
  
  cache: {
    enabled: true,
    maxSize: 100,
    defaultTTL: 300000, // 5 minutes
    strategy: "lru",
    autoInvalidateOnError: true,
    invalidateOnStatusCodes: [404, 500, 502, 503],
    persistent: true,
    compressionEnabled: true,
    cleanupInterval: 300000,
    maxMemoryUsage: 10485760, // 10MB
  },
  
  fallback: {
    enabled: true,
    strategy: "sequential",
    mcpFallback: {
      enabled: true,
      timeout: 15000,
      priority: 1,
    },
    cacheFallback: {
      enabled: true,
      maxAge: 3600000,
      priority: 2,
    },
    defaultFallback: {
      enabled: true,
      responses: {},
      priority: 3,
    },
    queueFallback: {
      enabled: true,
      priority: 4,
      maxQueueTime: 86400000, // 24 hours
    },
    totalTimeout: 60000,
    enablePartialResults: false,
  },
  
  security: {
    authMethod: "bearer",
    tokenRefreshThreshold: 300000, // 5 minutes
    certificateValidation: true,
    allowSelfSigned: false,
    rateLimiting: {
      enabled: true,
      requestsPerSecond: 10,
      burstSize: 20,
      window: 60000,
    },
  },
  
  features: {
    enableConnectionPooling: true,
    enableCircuitBreaker: true,
    enableRequestQueue: true,
    enableCache: true,
    enableFallbacks: true,
    enableMetrics: true,
    enableHealthChecks: true,
  },
};