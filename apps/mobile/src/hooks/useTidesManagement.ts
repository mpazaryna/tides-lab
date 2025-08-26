import { useState, useCallback, useEffect } from "react";
import { mcpService } from "../services/mcpService";
import { loggingService } from "../services/loggingService";
import type { Tide } from "../types";

interface UseTidesManagementReturn {
  // State
  activeTides: Tide[];
  tidesLoading: boolean;
  tidesError: string | null;
  refreshing: boolean;
  
  // Actions
  fetchActiveTides: () => Promise<void>;
  loadActiveTides: () => Promise<void>;
  refreshTides: () => Promise<void>;
}

export const useTidesManagement = (isConnected: boolean): UseTidesManagementReturn => {
  // State management
  const [activeTides, setActiveTides] = useState<Tide[]>([]);
  const [tidesLoading, setTidesLoading] = useState(false);
  const [tidesError, setTidesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch active tides
  const fetchActiveTides = useCallback(async () => {
    try {
      setTidesError(null);
      loggingService.info("useTidesManagement", "Fetching active tides", {});

      const response = await mcpService.listTides();

      if (response.success && response.tides) {
        // Filter for active tides only
        const activeOnly = response.tides.filter(
          (tide: any) => tide.status === "active"
        );
        setActiveTides(activeOnly);

        loggingService.info("useTidesManagement", "Active tides fetched successfully", {
          count: activeOnly.length,
        });
      } else {
        throw new Error(response.error || "Failed to fetch tides");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tides";
      setTidesError(errorMessage);

      loggingService.error("useTidesManagement", "Failed to fetch active tides", {
        error: errorMessage,
      });
    }
  }, []);

  // Load tides with loading state
  const loadActiveTides = useCallback(async () => {
    setTidesLoading(true);
    await fetchActiveTides();
    setTidesLoading(false);
  }, [fetchActiveTides]);

  // Refresh tides (for pull-to-refresh)
  const refreshTides = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveTides();
    setRefreshing(false);
  }, [fetchActiveTides]);

  // Load active tides when component mounts or when connection status changes
  useEffect(() => {
    if (isConnected) {
      loadActiveTides();
    }
  }, [isConnected, loadActiveTides]);

  return {
    // State
    activeTides,
    tidesLoading,
    tidesError,
    refreshing,
    
    // Actions
    fetchActiveTides,
    loadActiveTides,
    refreshTides,
  };
};