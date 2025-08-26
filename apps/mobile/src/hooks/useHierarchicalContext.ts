import { useState, useCallback, useEffect } from "react";
import { useMCP } from "../context/MCPContext";
import { loggingService } from "../services/loggingService";

type ContextType = "daily" | "weekly" | "monthly" | "project";

interface ContextInfo {
  context: string;
  tide_id?: string;
  tide_name?: string;
  flow_count: number;
  total_minutes: number;
  available: boolean;
}

interface UseHierarchicalContextReturn {
  // State
  currentContext: ContextType;
  contexts: ContextInfo[];
  loading: boolean;
  error: string | null;
  summary: {
    total_flow_sessions: number;
    total_minutes: number;
  };

  // Actions
  switchContext: (context: ContextType) => Promise<void>;
  refreshContexts: () => Promise<void>;
  startHierarchicalFlow: (
    intensity?: 'gentle' | 'moderate' | 'strong',
    duration?: number,
    workContext?: string
  ) => Promise<void>;
}

/**
 * Hook for managing hierarchical tide contexts
 * Provides context switching, summary data, and hierarchical flow management
 */
export const useHierarchicalContext = (
  initialContext: ContextType = "daily"
): UseHierarchicalContextReturn => {
  const {
    switchTideContext,
    // listTideContexts, // Currently unused
    getTodaysSummary,
    startHierarchicalFlow: mcpStartHierarchicalFlow,
    isConnected,
  } = useMCP();

  const [currentContext, setCurrentContext] = useState<ContextType>(initialContext);
  const [contexts, setContexts] = useState<ContextInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total_flow_sessions: 0,
    total_minutes: 0,
  });

  const refreshContexts = useCallback(async () => {
    if (!isConnected) {
      loggingService.debug("useHierarchicalContext", "Not connected, skipping refresh");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      loggingService.info("useHierarchicalContext", "Refreshing hierarchical contexts");

      // Get today's summary with all context information
      const result = await getTodaysSummary();

      if (result.success && result.contexts) {
        setContexts(result.contexts);
        setSummary({
          total_flow_sessions: result.total_flow_sessions || 0,
          total_minutes: result.total_minutes || 0,
        });

        loggingService.info("useHierarchicalContext", "Contexts refreshed", {
          contextsCount: result.contexts.length,
          totalSessions: result.total_flow_sessions,
          totalMinutes: result.total_minutes,
        });
      } else {
        throw new Error(result.error || "Failed to load contexts");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh contexts";
      setError(errorMessage);
      loggingService.error("useHierarchicalContext", "Failed to refresh contexts", {
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [getTodaysSummary, isConnected]);

  const switchContext = useCallback(
    async (contextType: ContextType) => {
      if (contextType === currentContext || loading) return;

      setLoading(true);
      setError(null);

      try {
        loggingService.info("useHierarchicalContext", "Switching context", {
          from: currentContext,
          to: contextType,
        });

        const result = await switchTideContext(contextType);

        if (result.success) {
          setCurrentContext(contextType);
          
          // Refresh contexts to get updated data
          await refreshContexts();

          loggingService.info("useHierarchicalContext", "Context switched successfully", {
            contextType,
            tideId: result.tide?.id,
            created: result.created,
          });
        } else {
          throw new Error(result.error || "Failed to switch context");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to switch context";
        setError(errorMessage);
        loggingService.error("useHierarchicalContext", "Failed to switch context", {
          error: errorMessage,
          contextType,
        });
      } finally {
        setLoading(false);
      }
    },
    [currentContext, loading, switchTideContext, refreshContexts]
  );

  const startHierarchicalFlow = useCallback(
    async (
      intensity: 'gentle' | 'moderate' | 'strong' = 'moderate',
      duration: number = 25,
      workContext: string = 'General work'
    ) => {
      setLoading(true);
      setError(null);

      try {
        loggingService.info("useHierarchicalContext", "Starting hierarchical flow", {
          intensity,
          duration,
          workContext,
        });

        const result = await mcpStartHierarchicalFlow(
          intensity,
          duration,
          'medium', // Default energy level
          workContext
        );

        if (result.success) {
          // Refresh contexts to show updated data
          await refreshContexts();

          loggingService.info("useHierarchicalContext", "Hierarchical flow started", {
            sessionId: result.session_id,
            contextsCount: result.contexts?.length || 0,
          });
        } else {
          throw new Error(result.error || "Failed to start hierarchical flow");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to start hierarchical flow";
        setError(errorMessage);
        loggingService.error("useHierarchicalContext", "Failed to start hierarchical flow", {
          error: errorMessage,
          intensity,
          duration,
          workContext,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mcpStartHierarchicalFlow, refreshContexts]
  );

  // Initialize and refresh on connection
  useEffect(() => {
    if (isConnected) {
      refreshContexts();
    }
  }, [isConnected, refreshContexts]);

  return {
    // State
    currentContext,
    contexts,
    loading,
    error,
    summary,

    // Actions
    switchContext,
    refreshContexts,
    startHierarchicalFlow,
  };
};