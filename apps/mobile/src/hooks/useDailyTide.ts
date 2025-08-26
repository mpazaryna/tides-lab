import { useState, useCallback, useEffect } from "react";
import { useMCP } from "../context/MCPContext";
import { loggingService } from "../services/loggingService";
import type { Tide } from "../types";

interface UseDailyTideReturn {
  // State
  dailyTide: Tide | null;
  isReady: boolean;
  loading: boolean;
  error: string | null;
  wasCreatedToday: boolean;

  // Actions
  refreshDailyTide: () => Promise<void>;
  renameDailyTide: (newName: string) => Promise<void>;
}

/**
 * Hook for managing automatic daily tides
 * Ensures a daily tide exists for the current day and provides
 * methods to interact with it
 */
export const useDailyTide = (): UseDailyTideReturn => {
  const { isConnected, getOrCreateDailyTide } = useMCP();
  const [dailyTide, setDailyTide] = useState<Tide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasCreatedToday, setWasCreatedToday] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize or get daily tide
  const initializeDailyTide = useCallback(async () => {
    if (!isConnected) {
      loggingService.debug(
        "useDailyTide",
        "Not connected, skipping initialization"
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      loggingService.info("useDailyTide", "Getting or creating daily tide");

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      loggingService.info("useDailyTide", "Getting or creating daily tide via MCPContext", {
        timezone,
        currentDate: new Date().toISOString(),
        localDate: new Date().toLocaleDateString(),
        localTime: new Date().toLocaleTimeString(),
      });

      const result = await getOrCreateDailyTide(timezone);

      if (result.success && result.tide) {
        setDailyTide(result.tide);
        setWasCreatedToday(result.created || false);
        setIsReady(true);

        loggingService.info(
          "useDailyTide",
          result.created
            ? "Created new daily tide"
            : "Retrieved existing daily tide",
          { tideId: result.tide.id, tideName: result.tide.name }
        );
      } else {
        throw new Error(result.error || "Failed to get daily tide");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize daily tide";
      setError(errorMessage);
      loggingService.error("useDailyTide", "Failed to initialize daily tide", {
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [isConnected, getOrCreateDailyTide]);

  // Refresh daily tide (useful for pull-to-refresh)
  const refreshDailyTide = useCallback(async () => {
    await initializeDailyTide();
  }, [initializeDailyTide]);

  // Rename daily tide (retroactive naming)
  const renameDailyTide = useCallback(
    async (newName: string) => {
      if (!dailyTide) {
        loggingService.warn("useDailyTide", "No daily tide to rename");
        return;
      }

      try {
        loggingService.info("useDailyTide", "Renaming daily tide", {
          tideId: dailyTide.id,
          oldName: dailyTide.name,
          newName,
        });

        // For now, we'll update locally
        // TODO: When server implements tide_update_name, call it here
        setDailyTide((prev) => (prev ? { ...prev, name: newName } : null));

        loggingService.info("useDailyTide", "Daily tide renamed successfully");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to rename tide";
        loggingService.error("useDailyTide", "Failed to rename daily tide", {
          error: errorMessage,
        });
        throw err;
      }
    },
    [dailyTide]
  );

  // Initialize on mount and when connection status changes
  useEffect(() => {
    if (isConnected && !dailyTide) {
      initializeDailyTide();
    }
  }, [isConnected, dailyTide, initializeDailyTide]);

  return {
    // State
    dailyTide,
    isReady,
    loading,
    error,
    wasCreatedToday,

    // Actions
    refreshDailyTide,
    renameDailyTide,
  };
};
