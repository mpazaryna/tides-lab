export {
  useAuthStatus,
  useIsAuthenticated,
  useAuthLoading,
  type AuthStatusResult,
} from "./useAuthStatus";

export {
  useAuthActions,
  type AuthActionsResult,
  type AuthActionType,
} from "./useAuthActions";

export {
  useMCPConnection,
  useCanPerformMCPOperations,
  useMCPConnectionStatus,
  type MCPConnectionResult,
  type ConnectionStatus,
} from "./useMCPConnection";

export {
  useAsyncAction,
  type AsyncActionState,
  type AsyncActionOptions,
} from "./useAsyncAction";

export {
  useAIFeatures,
  type TideSession,
  type UserContext,
  type AIInsights,
  type AIAnalysisResult,
  type AISuggestionResult,
} from "./useAIFeatures";

export { useDailyTide } from "./useDailyTide";
export { useEnergyData } from "./useEnergyData";
export { useLocationData } from "./useLocationData";
