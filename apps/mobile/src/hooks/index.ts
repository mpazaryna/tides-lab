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

// Re-export existing flow session hooks for convenience
export { 
  useFlowSession,
  useFlowSettings,
  useFlowTimer 
} from '../components/flowSession/hooks/useFlowSession';
export { 
  useFlowSettings as useFlowSettingsOnly
} from '../components/flowSession/hooks/useFlowSettings';
export { 
  useFlowTimer as useFlowTimerOnly
} from '../components/flowSession/hooks/useFlowTimer';