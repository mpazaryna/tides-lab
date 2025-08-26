// Custom hook for MCP connection management and status
import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMCP } from '../context/MCPContext';
import { LoggingService } from '../services/LoggingService';

export interface MCPConnectionResult {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  canConnect: boolean;
  connectionError: string | null;
  
  // Authentication state for MCP
  hasValidAuth: boolean;
  needsAuthentication: boolean;
  
  // Actions
  checkConnection: () => Promise<void>;
  reconnect: () => Promise<void>;
  
  // Connection status helpers
  getConnectionStatus: () => ConnectionStatus;
  isReadyForOperations: boolean;
}

export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'error'
  | 'needs-auth';

/**
 * Custom hook that provides MCP connection management with enhanced status checking.
 * Combines auth state with MCP state to provide comprehensive connection information.
 * 
 * @returns MCPConnectionResult with connection state and actions
 */
export function useMCPConnection(): MCPConnectionResult {
  const { user, session, apiKey } = useAuth();
  const { 
    isConnected, 
    loading: mcpLoading, 
    error: mcpError, 
    checkConnection: mcpCheckConnection
  } = useMCP();

  const hasValidAuth = useMemo(() => {
    return !!(user && session && apiKey);
  }, [user, session, apiKey]);

  const needsAuthentication = useMemo(() => {
    return !hasValidAuth;
  }, [hasValidAuth]);

  const canConnect = useMemo(() => {
    return hasValidAuth && !mcpLoading;
  }, [hasValidAuth, mcpLoading]);

  const getConnectionStatus = useCallback((): ConnectionStatus => {
    if (needsAuthentication) {
      return 'needs-auth';
    }
    
    if (mcpLoading) {
      return 'connecting';
    }
    
    if (mcpError) {
      return 'error';
    }
    
    if (isConnected) {
      return 'connected';
    }
    
    return 'disconnected';
  }, [needsAuthentication, mcpLoading, mcpError, isConnected]);

  const isReadyForOperations = useMemo(() => {
    return isConnected && hasValidAuth && !mcpLoading && !mcpError;
  }, [isConnected, hasValidAuth, mcpLoading, mcpError]);

  const checkConnection = useCallback(async (): Promise<void> => {
    LoggingService.info(
      'useMCPConnection',
      'Connection check requested',
      { 
        hasValidAuth, 
        isConnected, 
        canConnect 
      },
      'MCP_HOOK_001'
    );

    if (!canConnect) {
      const errorMsg = 'Cannot check connection: invalid authentication or already loading';
      LoggingService.warn(
        'useMCPConnection',
        errorMsg,
        { hasValidAuth, mcpLoading },
        'MCP_HOOK_002'
      );
      throw new Error(errorMsg);
    }

    try {
      await mcpCheckConnection();
      LoggingService.info(
        'useMCPConnection',
        'Connection check completed',
        { isConnected },
        'MCP_HOOK_003'
      );
    } catch (error) {
      LoggingService.error(
        'useMCPConnection',
        'Connection check failed',
        { error },
        'MCP_HOOK_004'
      );
      throw error;
    }
  }, [canConnect, hasValidAuth, mcpLoading, mcpCheckConnection, isConnected]);

  const reconnect = useCallback(async (): Promise<void> => {
    LoggingService.info(
      'useMCPConnection',
      'Reconnection requested',
      { hasValidAuth, isConnected },
      'MCP_HOOK_005'
    );

    if (!hasValidAuth) {
      const errorMsg = 'Cannot reconnect: authentication required';
      LoggingService.warn(
        'useMCPConnection',
        errorMsg,
        { hasValidAuth },
        'MCP_HOOK_006'
      );
      throw new Error(errorMsg);
    }

    try {
      // Force a fresh connection check
      await mcpCheckConnection();
      
      LoggingService.info(
        'useMCPConnection',
        'Reconnection completed',
        { isConnected },
        'MCP_HOOK_007'
      );
    } catch (error) {
      LoggingService.error(
        'useMCPConnection',
        'Reconnection failed',
        { error },
        'MCP_HOOK_008'
      );
      throw error;
    }
  }, [hasValidAuth, isConnected, mcpCheckConnection]);

  return {
    // Connection state
    isConnected,
    isLoading: mcpLoading,
    canConnect,
    connectionError: mcpError,
    
    // Authentication state for MCP
    hasValidAuth,
    needsAuthentication,
    
    // Actions
    checkConnection,
    reconnect,
    
    // Status helpers
    getConnectionStatus,
    isReadyForOperations,
  };
}

/**
 * Simple hook that returns whether MCP operations can be performed.
 * Useful for conditional rendering of MCP-dependent UI elements.
 */
export function useCanPerformMCPOperations(): boolean {
  const { isReadyForOperations } = useMCPConnection();
  return isReadyForOperations;
}

/**
 * Hook that returns the current connection status as a string.
 * Useful for displaying connection status in the UI.
 */
export function useMCPConnectionStatus(): ConnectionStatus {
  const { getConnectionStatus } = useMCPConnection();
  return getConnectionStatus();
}