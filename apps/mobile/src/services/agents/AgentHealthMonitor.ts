/**
 * Agent Health Monitor
 * 
 * Continuous health monitoring system for agent connections with automatic
 * recovery, degradation detection, and performance metrics collection.
 * 
 * Features:
 * - Real-time health monitoring with configurable intervals
 * - Automatic recovery from failures and degraded states
 * - Performance metrics collection and trend analysis
 * - Proactive degradation detection before complete failures
 * - Integration with connection pool for health-based routing
 */

import { LoggingService } from '../LoggingService';
import { NotificationService } from '../NotificationService';
import type { 
  HealthMetrics, 
  HealthCheck, 
  ConnectionStatus,
  AgentEvent,
  AgentEventData 
} from '../../types/agents';
import type { 
  HealthCheckConfig, 
  MetricsConfig 
} from '../../types/connection';

interface HealthCheckResult {
  connectionId: string;
  endpoint: string;
  success: boolean;
  responseTime: number;
  timestamp: Date;
  error?: Error;
  statusCode?: number;
  agentInfo?: {
    version?: string;
    uptime?: number;
    capabilities?: string[];
  };
}

interface MetricsDataPoint {
  timestamp: Date;
  responseTime: number;
  success: boolean;
  endpoint: string;
  connectionId: string;
}

export class AgentHealthMonitor {
  private serviceName = "AgentHealthMonitor";
  private healthConfig: HealthCheckConfig;
  private metricsConfig: MetricsConfig;
  private connections: Map<string, ConnectionStatus> = new Map();
  private metricsData: MetricsDataPoint[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private eventHandlers: Map<AgentEvent, ((data: AgentEventData) => void)[]> = new Map();

  constructor(
    healthConfig: HealthCheckConfig,
    metricsConfig: MetricsConfig
  ) {
    this.healthConfig = healthConfig;
    this.metricsConfig = metricsConfig;
    
    LoggingService.info(
      this.serviceName,
      "Health monitor initialized",
      { 
        healthCheckInterval: healthConfig.interval,
        metricsEnabled: metricsConfig.enabled
      },
      "HEALTH_MONITOR_001"
    );
  }

  // ======================== Lifecycle Management ========================

  public async start(): Promise<void> {
    if (this.isRunning) {
      LoggingService.warn(
        this.serviceName,
        "Health monitor already running",
        {},
        "HEALTH_MONITOR_002"
      );
      return;
    }

    try {
      LoggingService.info(
        this.serviceName,
        "Starting health monitor",
        { 
          monitoredConnections: this.connections.size,
          interval: this.healthConfig.interval
        },
        "HEALTH_MONITOR_003"
      );

      this.isRunning = true;

      // Start health checks with initial delay
      setTimeout(() => {
        this.startHealthChecks();
      }, this.healthConfig.initialDelay);

      // Start metrics cleanup if metrics are enabled
      if (this.metricsConfig.enabled) {
        this.startMetricsCleanup();
      }

      LoggingService.info(
        this.serviceName,
        "Health monitor started successfully",
        {},
        "HEALTH_MONITOR_004"
      );

    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to start health monitor",
        { error },
        "HEALTH_MONITOR_005"
      );
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    LoggingService.info(
      this.serviceName,
      "Stopping health monitor",
      {},
      "HEALTH_MONITOR_006"
    );

    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
      this.metricsCleanupInterval = null;
    }

    LoggingService.info(
      this.serviceName,
      "Health monitor stopped",
      {},
      "HEALTH_MONITOR_007"
    );
  }

  // ======================== Connection Management ========================

  public registerConnection(connection: ConnectionStatus): void {
    this.connections.set(connection.connectionId, { ...connection });
    
    LoggingService.info(
      this.serviceName,
      "Connection registered for monitoring",
      { 
        connectionId: connection.connectionId,
        endpoint: connection.endpoint
      },
      "HEALTH_MONITOR_008"
    );

    // Perform immediate health check for new connections
    if (this.isRunning) {
      setTimeout(() => {
        this.performHealthCheck(connection);
      }, 1000);
    }
  }

  public unregisterConnection(connectionId: string): void {
    const removed = this.connections.delete(connectionId);
    
    if (removed) {
      LoggingService.info(
        this.serviceName,
        "Connection unregistered from monitoring",
        { connectionId },
        "HEALTH_MONITOR_009"
      );
    }

    // Clean up metrics data for this connection
    this.cleanupConnectionMetrics(connectionId);
  }

  public updateConnection(connection: ConnectionStatus): void {
    this.connections.set(connection.connectionId, { ...connection });
  }

  public getConnection(connectionId: string): ConnectionStatus | null {
    return this.connections.get(connectionId) || null;
  }

  // ======================== Health Checking ========================

  private startHealthChecks(): void {
    if (!this.isRunning) return;

    this.healthCheckInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.performAllHealthChecks();
      } catch (error) {
        LoggingService.error(
          this.serviceName,
          "Health check cycle error",
          { error },
          "HEALTH_MONITOR_010"
        );
      }
    }, this.healthConfig.interval);

    LoggingService.info(
      this.serviceName,
      "Health check cycle started",
      { interval: this.healthConfig.interval },
      "HEALTH_MONITOR_011"
    );
  }

  private async performAllHealthChecks(): Promise<void> {
    const connections = Array.from(this.connections.values());
    
    LoggingService.debug(
      this.serviceName,
      "Performing health checks",
      { connectionCount: connections.length },
      "HEALTH_MONITOR_012"
    );

    const promises = connections.map(connection => 
      this.performHealthCheck(connection)
    );

    const results = await Promise.allSettled(promises);
    
    // Process results and emit events
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        LoggingService.error(
          this.serviceName,
          "Health check promise rejected",
          { 
            connectionId: connections[index].connectionId,
            error: result.reason 
          },
          "HEALTH_MONITOR_013"
        );
      }
    });
  }

  private async performHealthCheck(connection: ConnectionStatus): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checkId = `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    try {
      LoggingService.debug(
        this.serviceName,
        "Starting health check",
        { 
          connectionId: connection.connectionId,
          endpoint: connection.endpoint,
          checkId
        },
        "HEALTH_MONITOR_014"
      );

      const result = await this.executeHealthCheck(connection);
      const responseTime = Date.now() - startTime;
      
      // Update connection status based on result
      this.updateConnectionHealth(connection, result, responseTime);
      
      // Record metrics if enabled
      if (this.metricsConfig.enabled) {
        this.recordMetrics(connection, result.success, responseTime);
      }
      
      // Emit events based on health state changes
      this.handleHealthStateChange(connection, result.success);
      
      LoggingService.debug(
        this.serviceName,
        "Health check completed",
        { 
          connectionId: connection.connectionId,
          success: result.success,
          responseTime,
          checkId
        },
        "HEALTH_MONITOR_015"
      );

      return {
        connectionId: connection.connectionId,
        endpoint: connection.endpoint,
        success: result.success,
        responseTime,
        timestamp: new Date(),
        statusCode: result.statusCode,
        agentInfo: result.agentInfo
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      LoggingService.error(
        this.serviceName,
        "Health check failed",
        { 
          connectionId: connection.connectionId,
          error,
          responseTime,
          checkId
        },
        "HEALTH_MONITOR_016"
      );

      // Update connection as unhealthy
      this.updateConnectionHealth(connection, { success: false }, responseTime);
      
      // Record failure metrics
      if (this.metricsConfig.enabled) {
        this.recordMetrics(connection, false, responseTime);
      }
      
      // Emit failure event
      this.emitEvent("health_check_failed", {
        connectionId: connection.connectionId,
        error: error as Error
      });

      return {
        connectionId: connection.connectionId,
        endpoint: connection.endpoint,
        success: false,
        responseTime,
        timestamp: new Date(),
        error: error as Error
      };
    }
  }

  private async executeHealthCheck(connection: ConnectionStatus): Promise<{
    success: boolean;
    statusCode?: number;
    agentInfo?: any;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.healthConfig.timeout);
    
    try {
      const healthUrl = `${connection.endpoint}${this.healthConfig.endpoint}`;
      
      const response = await fetch(healthUrl, {
        method: this.healthConfig.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isSuccess = this.healthConfig.expectedStatus.includes(response.status);
      let agentInfo = undefined;
      
      // Try to parse response for agent info if validation is enabled
      if (this.healthConfig.enableResponseValidation && response.ok) {
        try {
          const data = await response.json();
          agentInfo = {
            version: data.version,
            uptime: data.uptime,
            capabilities: data.capabilities
          };
          
          // Validate response structure if configured
          if (this.healthConfig.validateResponse) {
            const validation = this.validateHealthResponse(data);
            if (!validation.isValid) {
              LoggingService.warn(
                this.serviceName,
                "Health response validation failed",
                { 
                  connectionId: connection.connectionId,
                  validation 
                },
                "HEALTH_MONITOR_017"
              );
            }
          }
        } catch (parseError) {
          LoggingService.warn(
            this.serviceName,
            "Failed to parse health check response",
            { 
              connectionId: connection.connectionId,
              parseError 
            },
            "HEALTH_MONITOR_018"
          );
        }
      }
      
      return {
        success: isSuccess,
        statusCode: response.status,
        agentInfo
      };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Health check timed out after ${this.healthConfig.timeout}ms`);
      }
      
      throw error;
    }
  }

  private validateHealthResponse(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validation = this.healthConfig.validateResponse;
    
    if (!validation) {
      return { isValid: true, errors: [] };
    }
    
    // Check required fields
    if (validation.requiredFields) {
      validation.requiredFields.forEach(field => {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }
    
    // Check expected values
    if (validation.expectedValues) {
      Object.entries(validation.expectedValues).forEach(([key, expectedValue]) => {
        if (data[key] !== expectedValue) {
          errors.push(`Field ${key} expected ${expectedValue}, got ${data[key]}`);
        }
      });
    }
    
    // Check minimum response size
    if (validation.minimumResponseSize) {
      const responseSize = JSON.stringify(data).length;
      if (responseSize < validation.minimumResponseSize) {
        errors.push(`Response too small: ${responseSize} < ${validation.minimumResponseSize}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ======================== Connection Health Management ========================

  private updateConnectionHealth(
    connection: ConnectionStatus, 
    result: { success: boolean }, 
    responseTime: number
  ): void {
    const previousState = connection.state;
    const previousHealth = connection.isHealthy;
    
    connection.metadata.lastHealthCheck = new Date();
    connection.latency = responseTime;
    
    if (result.success) {
      // Success - reset error count and potentially recover
      connection.errorCount = 0;
      connection.lastConnected = new Date();
      connection.metadata.reconnectionAttempts = 0;
      
      if (connection.state === "failed" || connection.state === "degraded") {
        connection.state = "connected";
        connection.isHealthy = true;
        
        LoggingService.info(
          this.serviceName,
          "Connection recovered",
          { 
            connectionId: connection.connectionId,
            previousState,
            responseTime
          },
          "HEALTH_MONITOR_019"
        );
      } else if (connection.state === "disconnected") {
        connection.state = "connected";
        connection.isHealthy = true;
      }
    } else {
      // Failure - increment error count and potentially degrade
      connection.errorCount++;
      connection.lastError = new Date();
      
      if (connection.errorCount >= this.healthConfig.consecutiveFailureThreshold) {
        connection.state = "failed";
        connection.isHealthy = false;
        
        LoggingService.warn(
          this.serviceName,
          "Connection marked as failed",
          { 
            connectionId: connection.connectionId,
            errorCount: connection.errorCount,
            threshold: this.healthConfig.consecutiveFailureThreshold
          },
          "HEALTH_MONITOR_020"
        );
      } else if (connection.errorCount >= Math.floor(this.healthConfig.consecutiveFailureThreshold / 2)) {
        connection.state = "degraded";
        connection.isHealthy = false;
        
        LoggingService.warn(
          this.serviceName,
          "Connection marked as degraded",
          { 
            connectionId: connection.connectionId,
            errorCount: connection.errorCount
          },
          "HEALTH_MONITOR_021"
        );
      }
    }
    
    // Update the stored connection
    this.connections.set(connection.connectionId, connection);
  }

  private handleHealthStateChange(connection: ConnectionStatus, success: boolean): void {
    if (success) {
      this.emitEvent("health_check_passed", {
        connectionId: connection.connectionId,
        details: { responseTime: connection.latency }
      });
      
      if (connection.isHealthy && connection.state === "connected") {
        this.emitEvent("connection_recovered", {
          connectionId: connection.connectionId
        });
      }
    } else {
      this.emitEvent("health_check_failed", {
        connectionId: connection.connectionId
      });
      
      if (connection.state === "degraded") {
        this.emitEvent("connection_degraded", {
          connectionId: connection.connectionId
        });
      } else if (connection.state === "failed") {
        this.emitEvent("connection_lost", {
          connectionId: connection.connectionId
        });
      }
    }
  }

  // ======================== Metrics Collection ========================

  private recordMetrics(connection: ConnectionStatus, success: boolean, responseTime: number): void {
    if (!this.metricsConfig.enabled) return;
    
    const dataPoint: MetricsDataPoint = {
      timestamp: new Date(),
      responseTime,
      success,
      endpoint: connection.endpoint,
      connectionId: connection.connectionId
    };
    
    this.metricsData.push(dataPoint);
    
    // Limit metrics data size
    if (this.metricsData.length > this.metricsConfig.maxDataPoints) {
      this.metricsData = this.metricsData.slice(-this.metricsConfig.maxDataPoints);
    }
  }

  public getMetrics(): HealthMetrics {
    if (!this.metricsConfig.enabled || this.metricsData.length === 0) {
      return {
        availability: 1.0,
        responseTime: 0,
        errorRate: 0.0,
        throughput: 0,
        lastUpdated: new Date(),
        trends: {
          availability7d: 1.0,
          responseTime7d: 0,
          errorRate24h: 0.0
        }
      };
    }
    
    const now = Date.now();
    const recentData = this.metricsData.filter(d => 
      now - d.timestamp.getTime() < this.metricsConfig.aggregationWindow
    );
    
    if (recentData.length === 0) {
      return this.getMetrics(); // Return default metrics
    }
    
    const successCount = recentData.filter(d => d.success).length;
    const availability = successCount / recentData.length;
    const avgResponseTime = recentData.reduce((sum, d) => sum + d.responseTime, 0) / recentData.length;
    const errorRate = 1 - availability;
    const throughput = recentData.length / (this.metricsConfig.aggregationWindow / 1000);
    
    // Calculate trends
    const last7Days = this.metricsData.filter(d => 
      now - d.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const last24Hours = this.metricsData.filter(d => 
      now - d.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    const availability7d = last7Days.length > 0 ? 
      last7Days.filter(d => d.success).length / last7Days.length : 1.0;
    const responseTime7d = last7Days.length > 0 ?
      last7Days.reduce((sum, d) => sum + d.responseTime, 0) / last7Days.length : 0;
    const errorRate24h = last24Hours.length > 0 ?
      1 - (last24Hours.filter(d => d.success).length / last24Hours.length) : 0.0;
    
    return {
      availability,
      responseTime: avgResponseTime,
      errorRate,
      throughput,
      lastUpdated: new Date(),
      trends: {
        availability7d,
        responseTime7d,
        errorRate24h
      }
    };
  }

  private startMetricsCleanup(): void {
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, this.metricsConfig.collectionInterval);
  }

  private cleanupOldMetrics(): void {
    if (!this.metricsConfig.enabled) return;
    
    const cutoffTime = Date.now() - this.metricsConfig.retentionPeriod;
    const originalLength = this.metricsData.length;
    
    this.metricsData = this.metricsData.filter(d => d.timestamp.getTime() > cutoffTime);
    
    if (originalLength !== this.metricsData.length) {
      LoggingService.debug(
        this.serviceName,
        "Metrics cleanup completed",
        { 
          removed: originalLength - this.metricsData.length,
          remaining: this.metricsData.length
        },
        "HEALTH_MONITOR_022"
      );
    }
  }

  private cleanupConnectionMetrics(connectionId: string): void {
    const originalLength = this.metricsData.length;
    this.metricsData = this.metricsData.filter(d => d.connectionId !== connectionId);
    
    LoggingService.debug(
      this.serviceName,
      "Connection metrics cleaned up",
      { 
        connectionId,
        removed: originalLength - this.metricsData.length
      },
      "HEALTH_MONITOR_023"
    );
  }

  // ======================== Event Management ========================

  public on(event: AgentEvent, callback: (data: AgentEventData) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(callback);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private emitEvent(event: AgentEvent, data: Partial<AgentEventData> = {}): void {
    const eventData: AgentEventData = {
      event,
      timestamp: new Date(),
      ...data
    };
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          LoggingService.error(
            this.serviceName,
            "Event handler error",
            { event, error },
            "HEALTH_MONITOR_024"
          );
        }
      });
    }
  }

  // ======================== Configuration Management ========================

  public updateConfig(
    healthConfig?: Partial<HealthCheckConfig>, 
    metricsConfig?: Partial<MetricsConfig>
  ): void {
    if (healthConfig) {
      this.healthConfig = { ...this.healthConfig, ...healthConfig };
      LoggingService.info(
        this.serviceName,
        "Health check configuration updated",
        { updatedFields: Object.keys(healthConfig) },
        "HEALTH_MONITOR_025"
      );
    }
    
    if (metricsConfig) {
      this.metricsConfig = { ...this.metricsConfig, ...metricsConfig };
      LoggingService.info(
        this.serviceName,
        "Metrics configuration updated", 
        { updatedFields: Object.keys(metricsConfig) },
        "HEALTH_MONITOR_026"
      );
    }
    
    // Restart monitoring with new config
    if (this.isRunning) {
      this.restart();
    }
  }

  private async restart(): Promise<void> {
    await this.stop();
    await this.start();
    
    LoggingService.info(
      this.serviceName,
      "Health monitor restarted with new configuration",
      {},
      "HEALTH_MONITOR_027"
    );
  }

  // ======================== Status and Diagnostics ========================

  public getStatus(): {
    isRunning: boolean;
    monitoredConnections: number;
    healthyConnections: number;
    totalChecks: number;
    lastCheckTime?: Date;
  } {
    const healthyCount = Array.from(this.connections.values())
      .filter(c => c.isHealthy).length;
    
    return {
      isRunning: this.isRunning,
      monitoredConnections: this.connections.size,
      healthyConnections: healthyCount,
      totalChecks: this.metricsData.length,
      lastCheckTime: this.metricsData.length > 0 ? 
        this.metricsData[this.metricsData.length - 1].timestamp : undefined
    };
  }

  public getConnectionHealth(connectionId: string): ConnectionStatus | null {
    return this.connections.get(connectionId) || null;
  }

  public getAllConnectionsHealth(): ConnectionStatus[] {
    return Array.from(this.connections.values());
  }
}