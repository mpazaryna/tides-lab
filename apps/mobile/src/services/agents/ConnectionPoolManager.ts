/**
 * Connection Pool Manager
 * 
 * Manages multiple agent connections with load balancing, health monitoring,
 * and automatic failover capabilities. Provides intelligent routing of requests
 * to healthy connections based on configured strategies.
 */

import { LoggingService } from '../LoggingService';
import type {
  ConnectionEndpoint,
  ConnectionPoolConfig,
  EnhancedAgentConnectionConfig
} from '../../types/connection';
import type {
  ConnectionStatus,
  ConnectionState,
  ConnectionPool
} from '../../types/agents';

interface ManagedConnection {
  endpoint: ConnectionEndpoint;
  status: ConnectionStatus;
  activeRequests: number;
  totalRequests: number;
  totalFailures: number;
  lastUsed: Date;
  createdAt: Date;
}

export class ConnectionPoolManager {
  private serviceName = "ConnectionPoolManager";
  private config: ConnectionPoolConfig;
  private connections: Map<string, ManagedConnection> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private roundRobinIndex = 0;

  constructor(config: ConnectionPoolConfig, endpoints: ConnectionEndpoint[]) {
    this.config = config;
    this.initializeConnections(endpoints);
    
    LoggingService.info(
      this.serviceName,
      "Connection pool manager initialized",
      { 
        endpointCount: endpoints.length,
        strategy: config.strategy,
        maxConnections: config.maxConnections
      },
      "CONN_POOL_001"
    );
  }

  // ======================== Initialization ========================

  private initializeConnections(endpoints: ConnectionEndpoint[]): void {
    endpoints.forEach(endpoint => {
      if (endpoint.enabled && this.connections.size < this.config.maxConnections) {
        const connectionId = this.generateConnectionId(endpoint);
        const connection: ManagedConnection = {
          endpoint,
          status: {
            state: "disconnected",
            connectionId,
            endpoint: endpoint.url,
            errorCount: 0,
            isHealthy: false,
            metadata: {
              reconnectionAttempts: 0,
              lastHealthCheck: new Date()
            }
          },
          activeRequests: 0,
          totalRequests: 0,
          totalFailures: 0,
          lastUsed: new Date(),
          createdAt: new Date()
        };

        this.connections.set(connectionId, connection);
        
        LoggingService.info(
          this.serviceName,
          "Connection initialized",
          { connectionId, endpoint: endpoint.url, type: endpoint.type },
          "CONN_POOL_002"
        );
      }
    });
  }

  private generateConnectionId(endpoint: ConnectionEndpoint): string {
    return `${endpoint.type}-${endpoint.url.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
  }

  // ======================== Public Interface ========================

  public async start(): Promise<void> {
    LoggingService.info(
      this.serviceName,
      "Starting connection pool manager",
      {},
      "CONN_POOL_003"
    );

    // Start health checks
    await this.startHealthChecks();
    
    // Start cleanup process
    this.startCleanupProcess();
    
    // Test initial connections
    await this.testAllConnections();
  }

  public async stop(): Promise<void> {
    LoggingService.info(
      this.serviceName,
      "Stopping connection pool manager",
      {},
      "CONN_POOL_004"
    );

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    await this.closeAllConnections();
  }

  // ======================== Connection Selection ========================

  public async getHealthyConnection(): Promise<ConnectionEndpoint | null> {
    const healthyConnections = this.getHealthyConnections();
    
    if (healthyConnections.length === 0) {
      LoggingService.warn(
        this.serviceName,
        "No healthy connections available",
        { totalConnections: this.connections.size },
        "CONN_POOL_005"
      );
      return null;
    }

    const selected = this.selectConnection(healthyConnections);
    
    if (selected) {
      // Update usage stats
      const connection = this.connections.get(selected.status.connectionId);
      if (connection) {
        connection.activeRequests++;
        connection.lastUsed = new Date();
        
        LoggingService.debug(
          this.serviceName,
          "Connection selected",
          { 
            connectionId: selected.status.connectionId,
            activeRequests: connection.activeRequests,
            strategy: this.config.strategy
          },
          "CONN_POOL_006"
        );
      }
      
      return selected.endpoint;
    }
    
    return null;
  }

  private selectConnection(connections: ManagedConnection[]): ManagedConnection | null {
    switch (this.config.strategy) {
      case "round_robin":
        return this.selectRoundRobin(connections);
      
      case "least_connections":
        return this.selectLeastConnections(connections);
      
      case "weighted":
        return this.selectWeighted(connections);
      
      case "random":
        return this.selectRandom(connections);
      
      default:
        return connections[0] || null;
    }
  }

  private selectRoundRobin(connections: ManagedConnection[]): ManagedConnection | null {
    if (connections.length === 0) return null;
    
    const selected = connections[this.roundRobinIndex % connections.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % connections.length;
    return selected;
  }

  private selectLeastConnections(connections: ManagedConnection[]): ManagedConnection | null {
    if (connections.length === 0) return null;
    
    return connections.reduce((least, current) => 
      current.activeRequests < least.activeRequests ? current : least
    );
  }

  private selectWeighted(connections: ManagedConnection[]): ManagedConnection | null {
    if (connections.length === 0) return null;
    
    // Simple weighted selection based on priority
    const weightedConnections = connections.sort((a, b) => a.endpoint.priority - b.endpoint.priority);
    return weightedConnections[0];
  }

  private selectRandom(connections: ManagedConnection[]): ManagedConnection | null {
    if (connections.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * connections.length);
    return connections[randomIndex];
  }

  // ======================== Connection Management ========================

  public async releaseConnection(connectionId: string, success: boolean): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.activeRequests = Math.max(0, connection.activeRequests - 1);
    connection.totalRequests++;
    
    if (success) {
      // Reset error count on success
      connection.status.errorCount = 0;
      connection.status.lastConnected = new Date();
      
      if (connection.status.state === "degraded") {
        connection.status.state = "connected";
        connection.status.isHealthy = true;
        
        LoggingService.info(
          this.serviceName,
          "Connection recovered from degraded state",
          { connectionId },
          "CONN_POOL_007"
        );
      }
    } else {
      connection.totalFailures++;
      connection.status.errorCount++;
      connection.status.lastError = new Date();
      
      // Check if connection should be marked as degraded or failed
      if (connection.status.errorCount >= this.config.unhealthyThreshold) {
        connection.status.state = "failed";
        connection.status.isHealthy = false;
        
        LoggingService.warn(
          this.serviceName,
          "Connection marked as failed",
          { 
            connectionId, 
            errorCount: connection.status.errorCount,
            threshold: this.config.unhealthyThreshold
          },
          "CONN_POOL_008"
        );
      } else if (connection.status.errorCount >= Math.floor(this.config.unhealthyThreshold / 2)) {
        connection.status.state = "degraded";
        connection.status.isHealthy = false;
        
        LoggingService.warn(
          this.serviceName,
          "Connection marked as degraded", 
          { connectionId, errorCount: connection.status.errorCount },
          "CONN_POOL_009"
        );
      }
    }
  }

  // ======================== Health Management ========================

  private async startHealthChecks(): Promise<void> {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        LoggingService.error(
          this.serviceName,
          "Health check error",
          { error },
          "CONN_POOL_010"
        );
      }
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(connection => 
      this.checkConnectionHealth(connection)
    );

    await Promise.allSettled(promises);
  }

  private async checkConnectionHealth(connection: ManagedConnection): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.testConnection(connection.endpoint);
      const responseTime = Date.now() - startTime;
      
      connection.status.metadata.lastHealthCheck = new Date();
      connection.status.latency = responseTime;
      
      if (isHealthy) {
        connection.status.errorCount = 0;
        
        if (connection.status.state === "failed" || connection.status.state === "degraded") {
          connection.status.state = "connected";
          connection.status.isHealthy = true;
          connection.status.metadata.reconnectionAttempts = 0;
          
          LoggingService.info(
            this.serviceName,
            "Connection recovered during health check",
            { 
              connectionId: connection.status.connectionId,
              responseTime
            },
            "CONN_POOL_011"
          );
        } else if (connection.status.state === "disconnected") {
          connection.status.state = "connected";
          connection.status.isHealthy = true;
        }
      } else {
        connection.status.errorCount++;
        connection.status.lastError = new Date();
        
        if (connection.status.errorCount >= this.config.unhealthyThreshold) {
          connection.status.state = "failed";
          connection.status.isHealthy = false;
        } else {
          connection.status.state = "degraded";
          connection.status.isHealthy = false;
        }
        
        LoggingService.warn(
          this.serviceName,
          "Connection health check failed",
          { 
            connectionId: connection.status.connectionId,
            errorCount: connection.status.errorCount,
            responseTime
          },
          "CONN_POOL_012"
        );
      }
    } catch (error) {
      connection.status.errorCount++;
      connection.status.lastError = new Date();
      connection.status.state = "failed";
      connection.status.isHealthy = false;
      
      LoggingService.error(
        this.serviceName,
        "Health check exception",
        { 
          connectionId: connection.status.connectionId,
          error
        },
        "CONN_POOL_013"
      );
    }
  }

  private async testConnection(endpoint: ConnectionEndpoint): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
      
      const response = await fetch(`${endpoint.url}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async testAllConnections(): Promise<void> {
    LoggingService.info(
      this.serviceName,
      "Testing all connections",
      { connectionCount: this.connections.size },
      "CONN_POOL_014"
    );

    const promises = Array.from(this.connections.values()).map(async connection => {
      const isHealthy = await this.testConnection(connection.endpoint);
      connection.status.state = isHealthy ? "connected" : "failed";
      connection.status.isHealthy = isHealthy;
      connection.status.metadata.lastHealthCheck = new Date();
    });

    await Promise.allSettled(promises);
    
    const healthyCount = this.getHealthyConnections().length;
    
    LoggingService.info(
      this.serviceName,
      "Connection test completed",
      { 
        healthyConnections: healthyCount,
        totalConnections: this.connections.size
      },
      "CONN_POOL_015"
    );
  }

  // ======================== Cleanup and Maintenance ========================

  private startCleanupProcess(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  private performCleanup(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];
    
    for (const [connectionId, connection] of this.connections) {
      // Remove old failed connections
      const age = now - connection.createdAt.getTime();
      if (age > this.config.maxConnectionAge && !connection.status.isHealthy) {
        connectionsToRemove.push(connectionId);
        continue;
      }
      
      // Remove idle connections if we're over the max idle limit
      if (this.connections.size > this.config.maxIdleConnections) {
        const idleTime = now - connection.lastUsed.getTime();
        if (idleTime > this.config.idleTimeout && connection.activeRequests === 0) {
          connectionsToRemove.push(connectionId);
        }
      }
    }
    
    connectionsToRemove.forEach(connectionId => {
      this.connections.delete(connectionId);
      LoggingService.info(
        this.serviceName,
        "Connection removed during cleanup",
        { connectionId },
        "CONN_POOL_016"
      );
    });
  }

  private async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(connection => {
      // Close WebSocket connections if any
      // For HTTP connections, just mark as disconnected
      connection.status.state = "disconnected";
      connection.status.isHealthy = false;
      return Promise.resolve();
    });
    
    await Promise.allSettled(promises);
    this.connections.clear();
    
    LoggingService.info(
      this.serviceName,
      "All connections closed",
      {},
      "CONN_POOL_017"
    );
  }

  // ======================== Status and Metrics ========================

  public getConnectionPool(): ConnectionPool {
    const connections = Array.from(this.connections.values());
    const primary = connections.find(c => c.endpoint.type === "primary");
    const fallbacks = connections.filter(c => c.endpoint.type === "fallback");
    const healthyConnections = this.getHealthyConnections();
    
    return {
      primary: primary?.status || {
        state: "disconnected",
        connectionId: "none",
        endpoint: "",
        errorCount: 0,
        isHealthy: false,
        metadata: {
          reconnectionAttempts: 0,
          lastHealthCheck: new Date()
        }
      },
      fallbacks: fallbacks.map(c => c.status),
      activeConnection: healthyConnections[0]?.status.connectionId || "none",
      healthyConnections: healthyConnections.map(c => c.status.connectionId),
      totalConnections: this.connections.size
    };
  }

  private getHealthyConnections(): ManagedConnection[] {
    return Array.from(this.connections.values()).filter(c => c.status.isHealthy);
  }

  public getMetrics() {
    const connections = Array.from(this.connections.values());
    const totalRequests = connections.reduce((sum, c) => sum + c.totalRequests, 0);
    const totalFailures = connections.reduce((sum, c) => sum + c.totalFailures, 0);
    const activeRequests = connections.reduce((sum, c) => sum + c.activeRequests, 0);
    
    return {
      totalConnections: this.connections.size,
      healthyConnections: this.getHealthyConnections().length,
      activeRequests,
      totalRequests,
      totalFailures,
      successRate: totalRequests > 0 ? (totalRequests - totalFailures) / totalRequests : 1,
      averageLatency: connections.reduce((sum, c) => sum + (c.status.latency || 0), 0) / connections.length
    };
  }

  // ======================== Configuration Updates ========================

  public updateConfig(newConfig: Partial<ConnectionPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    LoggingService.info(
      this.serviceName,
      "Connection pool configuration updated",
      { updatedFields: Object.keys(newConfig) },
      "CONN_POOL_018"
    );
    
    // Restart services with new config
    this.restart();
  }

  private async restart(): Promise<void> {
    await this.stop();
    await this.start();
    
    LoggingService.info(
      this.serviceName,
      "Connection pool manager restarted",
      {},
      "CONN_POOL_019"
    );
  }

  public addEndpoint(endpoint: ConnectionEndpoint): void {
    if (this.connections.size >= this.config.maxConnections) {
      LoggingService.warn(
        this.serviceName,
        "Cannot add endpoint - max connections reached",
        { maxConnections: this.config.maxConnections },
        "CONN_POOL_020"
      );
      return;
    }
    
    this.initializeConnections([endpoint]);
  }

  public removeEndpoint(endpointUrl: string): void {
    const connectionToRemove = Array.from(this.connections.entries())
      .find(([, connection]) => connection.endpoint.url === endpointUrl);
    
    if (connectionToRemove) {
      this.connections.delete(connectionToRemove[0]);
      LoggingService.info(
        this.serviceName,
        "Endpoint removed",
        { endpointUrl },
        "CONN_POOL_021"
      );
    }
  }
}