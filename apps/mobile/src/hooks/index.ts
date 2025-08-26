// Barrel exports for custom hooks
// Provides convenient single import point for all custom hooks

// Authentication hooks
export { 
  useAuthStatus, 
  useIsAuthenticated, 
  useAuthLoading,
  type AuthStatusResult 
} from './useAuthStatus';

export { 
  useAuthActions, 
  type AuthActionsResult 
} from './useAuthActions';

// MCP connection hooks
export { 
  useMCPConnection, 
  useCanPerformMCPOperations, 
  useMCPConnectionStatus,
  type MCPConnectionResult,
  type ConnectionStatus 
} from './useMCPConnection';

