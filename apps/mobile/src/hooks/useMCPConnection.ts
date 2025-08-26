import { useAuth } from "../context/AuthContext";
import { useMCP } from "../context/MCPContext";
import { useAsyncAction } from "./useAsyncAction";

export interface MCPConnectionResult {
  isConnected: boolean;
  isLoading: boolean;
  canConnect: boolean;
  connectionError: string | null;
  hasValidAuth: boolean;
  needsAuthentication: boolean;
  checkConnection: () => Promise<void>;
  reconnect: () => Promise<void>;
  getConnectionStatus: () => ConnectionStatus;
  isReadyForOperations: boolean;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "needs-auth";

export function useMCPConnection(): MCPConnectionResult {
  const { user, session, authToken } = useAuth();
  const {
    isConnected,
    loading: mcpLoading,
    error: mcpError,
    checkConnection: mcpCheckConnection,
  } = useMCP();

  const hasValidAuth = !!(user && session && authToken);
  const needsAuthentication = !hasValidAuth;
  const canConnect = hasValidAuth && !mcpLoading;

  const connectionAction = useAsyncAction(
    async () => {
      if (!canConnect) {
        throw new Error(
          "Cannot connect: invalid authentication or already loading"
        );
      }
      if (!hasValidAuth) {
        throw new Error("Cannot connect: authentication required");
      }
      return mcpCheckConnection();
    },
    { logContext: "useMCPConnection", logData: { hasValidAuth, isConnected } }
  );

  const getConnectionStatus = (): ConnectionStatus => {
    if (needsAuthentication) return "needs-auth";
    if (mcpLoading || connectionAction.isLoading) return "connecting";
    if (mcpError || connectionAction.error) return "error";
    if (isConnected) return "connected";
    return "disconnected";
  };

  const isReadyForOperations =
    isConnected && hasValidAuth && !mcpLoading && !mcpError;

  return {
    isConnected,
    isLoading: mcpLoading || connectionAction.isLoading,
    canConnect,
    connectionError: mcpError || connectionAction.error,
    hasValidAuth,
    needsAuthentication,
    checkConnection: connectionAction.execute,
    reconnect: connectionAction.execute,
    getConnectionStatus,
    isReadyForOperations,
  };
}

export function useCanPerformMCPOperations(): boolean {
  const { isReadyForOperations } = useMCPConnection();
  return isReadyForOperations;
}

export function useMCPConnectionStatus(): ConnectionStatus {
  const { getConnectionStatus } = useMCPConnection();
  return getConnectionStatus();
}
