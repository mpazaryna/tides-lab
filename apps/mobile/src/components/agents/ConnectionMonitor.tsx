/**
 * Connection Monitor
 * 
 * React component for real-time visualization of agent connection status,
 * health metrics, and system diagnostics. Provides users with clear insight
 * into connection quality and troubleshooting information.
 * 
 * Features:
 * - Real-time connection status with visual indicators
 * - Health metrics display with trends
 * - Connection pool status with load balancing info
 * - Circuit breaker state visualization
 * - Queue metrics and processing status
 * - Interactive troubleshooting actions
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  Stack,
  colors,
  spacing
} from '../../design-system';
import { LoggingService } from '../../services/LoggingService';
import { NotificationService } from '../../services/NotificationService';
import { enhancedAgentService } from '../../services/agents/EnhancedAgentService';
import type { 
  ConnectionPool,
  HealthMetrics,
  RequestQueueMetrics,
  AgentEvent,
  AgentEventData
} from '../../types/agents';

interface ConnectionMonitorProps {
  /** Whether to show detailed metrics */
  detailed?: boolean;
  /** Whether to show troubleshooting actions */
  showActions?: boolean;
  /** Callback when connection status changes */
  onConnectionChange?: (isConnected: boolean) => void;
  /** Whether to auto-refresh data */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

interface ConnectionMetrics {
  connectionPool: ConnectionPool;
  healthMetrics: HealthMetrics;
  queueMetrics: RequestQueueMetrics;
  circuitBreakerState: string;
  lastUpdated: Date;
}

const ConnectionMonitor: React.FC<ConnectionMonitorProps> = ({
  detailed = false,
  showActions = true,
  onConnectionChange,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [metrics, setMetrics] = useState<ConnectionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<AgentEventData[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    connections: false,
    health: false,
    queue: false,
    events: false
  });

  // ======================== Data Loading ========================

  const loadMetrics = useCallback(async () => {
    try {
      LoggingService.debug(
        "ConnectionMonitor",
        "Loading connection metrics",
        {},
        "CONN_MONITOR_001"
      );

      const [connectionPool, healthMetrics, queueMetrics] = await Promise.all([
        Promise.resolve(enhancedAgentService.getConnectionStatus()),
        Promise.resolve(enhancedAgentService.getHealthMetrics()),
        Promise.resolve(enhancedAgentService.getQueueMetrics())
      ]);

      const newMetrics: ConnectionMetrics = {
        connectionPool,
        healthMetrics,
        queueMetrics,
        circuitBreakerState: "closed", // Would get from actual circuit breaker
        lastUpdated: new Date()
      };

      setMetrics(newMetrics);
      setLastError(null);

      // Notify of connection changes
      const isConnected = connectionPool.primary.isHealthy;
      onConnectionChange?.(isConnected);

      LoggingService.debug(
        "ConnectionMonitor",
        "Metrics loaded successfully",
        { 
          isConnected,
          healthyConnections: connectionPool.healthyConnections.length
        },
        "CONN_MONITOR_002"
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      LoggingService.error(
        "ConnectionMonitor",
        "Failed to load metrics",
        { error },
        "CONN_MONITOR_003"
      );

      setLastError(errorMessage);
      onConnectionChange?.(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onConnectionChange]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMetrics();
  }, [loadMetrics]);

  // ======================== Effects ========================

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMetrics]);

  // Event listening for real-time updates
  useEffect(() => {
    const eventTypes: AgentEvent[] = [
      "connection_established",
      "connection_lost",
      "connection_degraded",
      "connection_recovered",
      "health_check_passed",
      "health_check_failed",
      "circuit_breaker_opened",
      "circuit_breaker_closed",
      "request_queued",
      "request_processed"
    ];

    const unsubscribers = eventTypes.map(eventType =>
      enhancedAgentService.on(eventType, (data: AgentEventData) => {
        setEventLog(prev => [data, ...prev].slice(0, 50)); // Keep last 50 events
        
        // Refresh metrics on significant events
        if (['connection_established', 'connection_lost', 'connection_recovered'].includes(data.event)) {
          loadMetrics();
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [loadMetrics]);

  // ======================== Action Handlers ========================

  const handleTestConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      
      LoggingService.info(
        "ConnectionMonitor",
        "Testing connection manually",
        {},
        "CONN_MONITOR_004"
      );

      const isConnected = await enhancedAgentService.testConnection();
      
      NotificationService.info(
        isConnected ? "Connection test passed" : "Connection test failed",
        "Connection Test"
      );
      
      await loadMetrics();
    } catch (error) {
      LoggingService.error(
        "ConnectionMonitor",
        "Connection test failed",
        { error },
        "CONN_MONITOR_005"
      );
      
      NotificationService.error(
        "Connection test failed",
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadMetrics]);

  const handleRetryFailedRequests = useCallback(async () => {
    try {
      const retriedCount = await enhancedAgentService.retryFailedRequests();
      
      NotificationService.success(
        `Retried ${retriedCount} failed requests`,
        "Queue Management"
      );
      
      await loadMetrics();
    } catch (error) {
      LoggingService.error(
        "ConnectionMonitor",
        "Failed to retry requests",
        { error },
        "CONN_MONITOR_006"
      );
      
      NotificationService.error(
        "Failed to retry requests",
        "Error"
      );
    }
  }, [loadMetrics]);

  const handleClearQueue = useCallback(async () => {
    Alert.alert(
      "Clear Queue",
      "Are you sure you want to clear all queued requests? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await enhancedAgentService.clearQueue();
              
              NotificationService.success(
                "Queue cleared successfully",
                "Queue Management"
              );
              
              await loadMetrics();
            } catch (error) {
              NotificationService.error(
                "Failed to clear queue",
                "Error"
              );
            }
          }
        }
      ]
    );
  }, [loadMetrics]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // ======================== Render Helpers ========================

  const renderConnectionStatus = () => {
    if (!metrics) return null;

    const { connectionPool } = metrics;
    const primaryConnection = connectionPool.primary;
    
    return (
      <Card variant="outlined" padding={3} style={styles.statusCard}>
        <TouchableOpacity 
          onPress={() => toggleSection('connections')}
          style={styles.sectionHeader}
        >
          <View style={styles.statusRow}>
            <View style={[
              styles.statusIndicator,
              primaryConnection.isHealthy ? styles.healthyIndicator : styles.unhealthyIndicator
            ]} />
            <Text variant="body" weight="medium">
              Connection Status
            </Text>
            <Text variant="bodySmall" color="secondary">
              {primaryConnection.state}
            </Text>
          </View>
          <Text variant="bodySmall" color="tertiary">
            {expandedSections.connections ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>
        
        {expandedSections.connections && (
          <View style={styles.sectionContent}>
            <Stack spacing={2}>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Active Connection:</Text>
                <Text variant="bodySmall">{connectionPool.activeConnection}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Healthy Connections:</Text>
                <Text variant="bodySmall">
                  {connectionPool.healthyConnections.length}/{connectionPool.totalConnections}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Primary Endpoint:</Text>
                <Text variant="bodySmall" style={styles.endpointText}>
                  {primaryConnection.endpoint}
                </Text>
              </View>
              {primaryConnection.latency && (
                <View style={styles.metricRow}>
                  <Text variant="bodySmall" color="secondary">Latency:</Text>
                  <Text variant="bodySmall">{primaryConnection.latency}ms</Text>
                </View>
              )}
            </Stack>
          </View>
        )}
      </Card>
    );
  };

  const renderHealthMetrics = () => {
    if (!metrics || !detailed) return null;

    const { healthMetrics } = metrics;
    
    return (
      <Card variant="outlined" padding={3} style={styles.metricsCard}>
        <TouchableOpacity 
          onPress={() => toggleSection('health')}
          style={styles.sectionHeader}
        >
          <Text variant="body" weight="medium">Health Metrics</Text>
          <Text variant="bodySmall" color="tertiary">
            {expandedSections.health ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>
        
        {expandedSections.health && (
          <View style={styles.sectionContent}>
            <Stack spacing={2}>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Availability:</Text>
                <Text variant="bodySmall" color={healthMetrics.availability > 0.95 ? "success" : "warning"}>
                  {(healthMetrics.availability * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Response Time:</Text>
                <Text variant="bodySmall">{Math.round(healthMetrics.responseTime)}ms</Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Error Rate:</Text>
                <Text variant="bodySmall" color={healthMetrics.errorRate > 0.05 ? "error" : "success"}>
                  {(healthMetrics.errorRate * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Throughput:</Text>
                <Text variant="bodySmall">{healthMetrics.throughput.toFixed(1)} req/s</Text>
              </View>
            </Stack>
          </View>
        )}
      </Card>
    );
  };

  const renderQueueMetrics = () => {
    if (!metrics || !detailed) return null;

    const { queueMetrics } = metrics;
    
    return (
      <Card variant="outlined" padding={3} style={styles.metricsCard}>
        <TouchableOpacity 
          onPress={() => toggleSection('queue')}
          style={styles.sectionHeader}
        >
          <Text variant="body" weight="medium">Queue Status</Text>
          <View style={styles.queueBadge}>
            <Text variant="bodySmall" color="white">
              {queueMetrics.queueSize}
            </Text>
          </View>
          <Text variant="bodySmall" color="tertiary">
            {expandedSections.queue ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>
        
        {expandedSections.queue && (
          <View style={styles.sectionContent}>
            <Stack spacing={2}>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Queue Size:</Text>
                <Text variant="bodySmall">{queueMetrics.queueSize}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Processed Today:</Text>
                <Text variant="bodySmall">{queueMetrics.processedToday}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Failed Today:</Text>
                <Text variant="bodySmall" color={queueMetrics.failedToday > 0 ? "error" : "secondary"}>
                  {queueMetrics.failedToday}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text variant="bodySmall" color="secondary">Avg Processing:</Text>
                <Text variant="bodySmall">{Math.round(queueMetrics.averageProcessingTime)}ms</Text>
              </View>
              {queueMetrics.oldestRequest && (
                <View style={styles.metricRow}>
                  <Text variant="bodySmall" color="secondary">Oldest Request:</Text>
                  <Text variant="bodySmall">
                    {Math.floor((Date.now() - queueMetrics.oldestRequest.getTime()) / 1000)}s ago
                  </Text>
                </View>
              )}
            </Stack>
          </View>
        )}
      </Card>
    );
  };

  const renderEventLog = () => {
    if (!detailed || eventLog.length === 0) return null;

    return (
      <Card variant="outlined" padding={3} style={styles.eventCard}>
        <TouchableOpacity 
          onPress={() => toggleSection('events')}
          style={styles.sectionHeader}
        >
          <Text variant="body" weight="medium">Recent Events</Text>
          <View style={styles.eventBadge}>
            <Text variant="bodySmall" color="white">
              {eventLog.length}
            </Text>
          </View>
          <Text variant="bodySmall" color="tertiary">
            {expandedSections.events ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>
        
        {expandedSections.events && (
          <ScrollView style={styles.eventList} nestedScrollEnabled>
            {eventLog.slice(0, 10).map((event, index) => (
              <View key={`${event.timestamp.getTime()}-${index}`} style={styles.eventItem}>
                <View style={[styles.eventDot, getEventColor(event.event)]} />
                <View style={styles.eventContent}>
                  <Text variant="bodySmall" weight="medium">
                    {formatEventName(event.event)}
                  </Text>
                  <Text variant="bodySmall" color="tertiary">
                    {event.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Card>
    );
  };

  const renderActions = () => {
    if (!showActions || !metrics) return null;

    return (
      <Card variant="outlined" padding={3} style={styles.actionsCard}>
        <Text variant="body" weight="medium" style={styles.actionsTitle}>
          Troubleshooting Actions
        </Text>
        <Stack spacing={2}>
          <Button
            variant="outline"
            size="sm"
            onPress={handleTestConnection}
            loading={isLoading}
          >
            Test Connection
          </Button>
          
          {metrics.queueMetrics.failedToday > 0 && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleRetryFailedRequests}
            >
              Retry Failed Requests ({metrics.queueMetrics.failedToday})
            </Button>
          )}
          
          {metrics.queueMetrics.queueSize > 0 && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleClearQueue}
              style={styles.dangerButton}
            >
              Clear Queue ({metrics.queueMetrics.queueSize})
            </Button>
          )}
        </Stack>
      </Card>
    );
  };

  const renderError = () => {
    if (!lastError) return null;

    return (
      <Card variant="outlined" padding={3} style={styles.errorCard}>
        <Text variant="body" weight="medium" color="error">
          Connection Error
        </Text>
        <Text variant="bodySmall" color="error" style={styles.errorText}>
          {lastError}
        </Text>
        <Button
          variant="outline"
          size="sm"
          onPress={handleRefresh}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </Card>
    );
  };

  // ======================== Main Render ========================

  if (isLoading && !metrics) {
    return (
      <Card variant="outlined" padding={4} style={styles.loadingCard}>
        <Text variant="body" color="secondary" align="center">
          Loading connection status...
        </Text>
      </Card>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Stack spacing={3}>
        {lastError && renderError()}
        {renderConnectionStatus()}
        {renderHealthMetrics()}
        {renderQueueMetrics()}
        {renderEventLog()}
        {renderActions()}
        
        {metrics && (
          <Text variant="bodySmall" color="tertiary" align="center" style={styles.lastUpdated}>
            Last updated: {metrics.lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </Stack>
    </ScrollView>
  );
};

// ======================== Helper Functions ========================

const getEventColor = (event: string) => {
  const eventColorMap: Record<string, any> = {
    connection_established: { backgroundColor: colors.success },
    connection_recovered: { backgroundColor: colors.success },
    connection_lost: { backgroundColor: colors.error },
    connection_degraded: { backgroundColor: colors.warning },
    health_check_passed: { backgroundColor: colors.success },
    health_check_failed: { backgroundColor: colors.error },
    circuit_breaker_opened: { backgroundColor: colors.warning },
    circuit_breaker_closed: { backgroundColor: colors.success },
    request_queued: { backgroundColor: colors.info },
    request_processed: { backgroundColor: colors.primary[500] }
  };
  
  return eventColorMap[event] || { backgroundColor: colors.neutral[400] };
};

const formatEventName = (event: string): string => {
  return event
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// ======================== Styles ========================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingCard: {
    marginVertical: spacing[4]
  },
  statusCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500]
  },
  metricsCard: {
    backgroundColor: colors.background.secondary
  },
  eventCard: {
    backgroundColor: colors.neutral[50]
  },
  actionsCard: {
    borderColor: colors.primary[200]
  },
  errorCard: {
    backgroundColor: colors.error + "10",
    borderColor: colors.error + "30"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[2]
  },
  sectionContent: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200]
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[2]
  },
  healthyIndicator: {
    backgroundColor: colors.success
  },
  unhealthyIndicator: {
    backgroundColor: colors.error
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  endpointText: {
    flex: 1,
    textAlign: "right",
    fontSize: 11
  },
  queueBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center"
  },
  eventBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center"
  },
  eventList: {
    maxHeight: 200
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100]
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2]
  },
  eventContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  actionsTitle: {
    marginBottom: spacing[2]
  },
  dangerButton: {
    borderColor: colors.error,
  },
  errorText: {
    marginTop: spacing[2],
    marginBottom: spacing[3]
  },
  retryButton: {
    alignSelf: "flex-start"
  },
  lastUpdated: {
    marginTop: spacing[2]
  }
});

export default memo(ConnectionMonitor);