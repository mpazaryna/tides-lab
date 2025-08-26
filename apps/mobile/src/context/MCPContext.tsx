// Refactored MCPContext using useReducer pattern for optimized state management

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { mcpService } from "../services/mcpService";
import { authService } from "../services/authService";
import { loggingService } from "../services/loggingService";
import { useAuth } from "./AuthContext";
import { useServerEnvironment } from "./ServerEnvironmentContext";
import { mcpReducer, initialMCPState, type MCPState } from "./mcpTypes";
import type {
  Tide,
  EnergyUpdate,
  TaskLinksResponse,
  EnergyLevel,
  FlowIntensity,
  TideCreateResponse,
  FlowSessionResponse,
  TideReportResponse,
  TaskLinkResponse,
} from "../types";

// MCPState is now imported from mcpTypes.ts

interface MCPContextType extends MCPState {
  // Connection management
  checkConnection: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
  getCurrentServerUrl: () => string;

  // Tide management
  createTide: (
    name: string,
    description?: string,
    flowType?: "daily" | "weekly" | "project" | "seasonal"
  ) => Promise<TideCreateResponse>;
  refreshTides: () => Promise<void>;
  selectTide: (tide: Tide | null) => void;

  // Flow session management
  startTideFlow: (
    tideId: string,
    intensity?: FlowIntensity,
    duration?: number,
    initialEnergy?: "low" | "medium" | "high",
    workContext?: string
  ) => Promise<FlowSessionResponse>;

  // Energy tracking
  addEnergyToTide: (
    tideId: string,
    energyLevel: EnergyLevel,
    context?: string
  ) => Promise<EnergyUpdate>;

  // Reports and analytics
  getTideReport: (
    tideId: string,
    format?: "json" | "markdown" | "csv"
  ) => Promise<TideReportResponse>;

  // Task management
  linkTaskToTide: (
    tideId: string,
    taskUrl: string,
    taskTitle: string,
    taskType?: string
  ) => Promise<TaskLinkResponse>;
  getTaskLinks: (tideId: string) => Promise<TaskLinksResponse>;

  // Participants
  getTideParticipants: (
    statusFilter?: string,
    dateFrom?: string,
    dateTo?: string,
    limit?: number
  ) => Promise<any[]>;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

interface MCPProviderProps {
  children: ReactNode;
}

export function MCPProvider({ children }: MCPProviderProps) {
  const { apiKey } = useAuth();
  const { getCurrentServerUrl: getEnvironmentServerUrl, currentEnvironment } =
    useServerEnvironment();
  const [state, dispatch] = useReducer(mcpReducer, initialMCPState);

  // Configure authService and mcpService with current server URL  
  useEffect(() => {
    if (getEnvironmentServerUrl) {
      authService.setUrlProvider(getEnvironmentServerUrl);
      mcpService.setUrlProvider(getEnvironmentServerUrl);
      loggingService.info("MCPContext", "AuthService and MCPService configured with environment URL provider");
    }
  }, [getEnvironmentServerUrl]);

  const checkConnection = useCallback(async (): Promise<void> => {
    loggingService.info("MCPContext", "Checking MCP connection", undefined);
    dispatch({ type: "SET_LOADING", payload: true });

    // Validate API key before attempting connection
    if (!apiKey) {
      dispatch({
        type: "SET_ERROR",
        payload: "No API key available. Please authenticate first.",
      });
      return;
    }

    try {
      const status = await mcpService.getConnectionStatus();

      dispatch({
        type: "SET_CONNECTION_STATUS",
        payload: {
          isConnected: status.isConnected,
          hasApiKey: status.hasApiKey,
        },
      });

      loggingService.info("MCPContext", "Connection status checked", {
        status,
      });
    } catch (error) {
      loggingService.error("MCPContext", "Connection check failed", { error });
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to check connection status.",
      });
    }
  }, [apiKey]);

  const updateServerUrl = useCallback(async (url: string): Promise<void> => {
    loggingService.info("MCPContext", "Updating server URL", { url });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Update AuthService URL
      await authService.setWorkerUrl(url);

      // Update MCPService URL
      await mcpService.updateServerUrl(url);

      // Reset connection state
      dispatch({ type: "RESET_CONNECTION" });

      loggingService.info("MCPContext", "Server URL updated successfully", {
        url,
      });
    } catch (error) {
      loggingService.error("MCPContext", "Failed to update server URL", {
        error,
        url,
      });
      dispatch({ type: "SET_ERROR", payload: "Failed to update server URL" });
    }
  }, []);

  const getCurrentServerUrl = useCallback((): string => {
    return getEnvironmentServerUrl();
  }, [getEnvironmentServerUrl]);

  const refreshTides = useCallback(async (): Promise<void> => {
    if (!state.isConnected) {
      loggingService.info(
        "MCPContext",
        "Skipping tide refresh - not connected",
        undefined
      );
      return;
    }

    loggingService.info("MCPContext", "Refreshing tides", undefined);
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await mcpService.listTides();
      if (response.success) {
        dispatch({
          type: "SET_TIDES",
          payload: response.tides,
        });
        loggingService.info("MCPContext", "Tides refreshed", {
          count: response.tides.length,
        });
      } else {
        throw new Error(response.error || "Failed to list tides");
      }
    } catch (error) {
      loggingService.error("MCPContext", "Failed to refresh tides", { error });
      dispatch({ type: "SET_ERROR", payload: "Failed to load tides." });
    }
  }, [state.isConnected]);

  const createTide = useCallback(
    async (
      name: string,
      description?: string,
      flowType?: "daily" | "weekly" | "project" | "seasonal"
    ): Promise<TideCreateResponse> => {
      loggingService.info("MCPContext", "Creating tide", { name, flowType });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.createTide(
          name,
          description,
          flowType
        );
        if (response.success && response.tide_id) {
          // Create tide object from response
          const newTide: Tide = {
            id: response.tide_id,
            name: response.name || name,
            status:
              (response.status as "active" | "completed" | "paused") ||
              "active",
            flow_type:
              (response.flow_type as
                | "daily"
                | "weekly"
                | "project"
                | "seasonal") ||
              flowType ||
              "project",
            created_at: response.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            description: response.description || description,
          };

          dispatch({
            type: "ADD_TIDE",
            payload: newTide,
          });

          loggingService.info("MCPContext", "Tide created", {
            tideId: newTide.id,
            name,
          });
          return response;
        } else {
          throw new Error(response.error || "Failed to create tide");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to create tide", {
          error,
          name,
        });
        dispatch({ type: "SET_ERROR", payload: "Failed to create tide." });
        throw error;
      }
    },
    []
  );

  const selectTide = useCallback((tide: Tide | null): void => {
    loggingService.info("MCPContext", "Selecting tide", { tideId: tide?.id });
    dispatch({
      type: "SELECT_TIDE",
      payload: tide,
    });
  }, []);

  const addEnergyToTide = useCallback(
    async (
      tideId: string,
      energyLevel: EnergyLevel,
      context?: string
    ): Promise<EnergyUpdate> => {
      loggingService.info("MCPContext", "Adding energy to tide", {
        tideId,
        energyLevel,
        context,
      });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.addEnergyToTide(
          tideId,
          energyLevel,
          context
        );
        if (response.success) {
          loggingService.info("MCPContext", "Energy added to tide", {
            tideId,
            energyLevel,
          });

          // Refresh tides to get updated data
          await refreshTides();
          return response;
        } else {
          throw new Error(response.error || "Failed to add energy");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to add energy to tide", {
          error,
          tideId,
          energyLevel,
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to add energy to tide.",
        });
        throw error;
      }
    },
    [refreshTides]
  );

  const startTideFlow = useCallback(
    async (
      tideId: string,
      intensity?: FlowIntensity,
      duration?: number,
      initialEnergy?: "low" | "medium" | "high",
      workContext?: string
    ): Promise<FlowSessionResponse> => {
      loggingService.info("MCPContext", "Starting tide flow", {
        tideId,
        intensity,
        duration,
        initialEnergy,
        workContext,
      });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.startTideFlow(
          tideId,
          intensity,
          duration,
          initialEnergy,
          workContext
        );
        if (response.success) {
          loggingService.info("MCPContext", "Flow session started", {
            tideId,
            sessionId: response.session_id,
            intensity,
            duration,
          });

          // Refresh tides to get updated data
          await refreshTides();
          return response;
        } else {
          throw new Error(response.error || "Failed to start flow session");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to start flow session", {
          error,
          tideId,
          intensity,
          duration,
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to start flow session.",
        });
        throw error;
      }
    },
    [refreshTides]
  );

  const getTideReport = useCallback(
    async (
      tideId: string,
      format?: "json" | "markdown" | "csv"
    ): Promise<TideReportResponse> => {
      loggingService.info("MCPContext", "Getting tide report", {
        tideId,
        format,
      });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.getTideReport(tideId, format);
        if (response.success) {
          loggingService.info("MCPContext", "Retrieved tide report", {
            tideId,
            format,
          });
          return response;
        } else {
          throw new Error(response.error || "Failed to get tide report");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to get tide report", {
          error,
          tideId,
          format,
        });
        dispatch({ type: "SET_ERROR", payload: "Failed to load tide report." });
        throw error;
      }
    },
    []
  );

  const linkTaskToTide = useCallback(
    async (
      tideId: string,
      taskUrl: string,
      taskTitle: string,
      taskType?: string
    ): Promise<TaskLinkResponse> => {
      loggingService.info("MCPContext", "Linking task to tide", {
        tideId,
        taskTitle,
        taskUrl,
        taskType,
      });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.linkTaskToTide(
          tideId,
          taskUrl,
          taskTitle,
          taskType
        );
        if (response.success) {
          loggingService.info("MCPContext", "Task linked to tide", {
            tideId,
            taskTitle,
            linkId: response.link_id,
          });
          return response;
        } else {
          throw new Error(response.error || "Failed to link task");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to link task to tide", {
          error,
          tideId,
          taskTitle,
          taskUrl,
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to link task to tide.",
        });
        throw error;
      }
    },
    []
  );

  const getTaskLinks = useCallback(
    async (tideId: string): Promise<TaskLinksResponse> => {
      loggingService.info("MCPContext", "Getting task links", { tideId });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.listTaskLinks(tideId);
        if (response.success) {
          loggingService.info("MCPContext", "Retrieved task links", {
            tideId,
            count: response.count,
          });
          return response;
        } else {
          throw new Error(response.error || "Failed to get task links");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to get task links", {
          error,
          tideId,
        });
        dispatch({ type: "SET_ERROR", payload: "Failed to load task links." });
        throw error;
      }
    },
    []
  );

  const getTideParticipants = useCallback(
    async (
      statusFilter?: string,
      dateFrom?: string,
      dateTo?: string,
      limit?: number
    ): Promise<any[]> => {
      loggingService.info("MCPContext", "Getting tide participants", {
        statusFilter,
        dateFrom,
        dateTo,
        limit,
      });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await mcpService.getTideParticipants(
          statusFilter,
          dateFrom,
          dateTo,
          limit
        );
        if (response.success) {
          loggingService.info("MCPContext", "Retrieved tide participants", {
            count: response.count,
            statusFilter,
            dateFrom,
            dateTo,
          });
          return response.participants;
        } else {
          throw new Error(response.error || "Failed to get participants");
        }
      } catch (error) {
        loggingService.error("MCPContext", "Failed to get tide participants", {
          error,
          statusFilter,
          dateFrom,
          dateTo,
          limit,
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load tide participants.",
        });
        throw error;
      }
    },
    []
  );

  // Effect to handle environment changes
  useEffect(() => {
    const handleEnvironmentChange = async () => {
      const newServerUrl = getEnvironmentServerUrl();

      loggingService.info(
        "MCPContext",
        "Environment changed, updating server URL",
        {
          environment: currentEnvironment,
          serverUrl: newServerUrl,
        }
      );

      try {
        // Update AuthService URL
        await authService.setWorkerUrl(newServerUrl);

        // Update MCPService URL
        await mcpService.updateServerUrl(newServerUrl);

        // Reset connection state to force re-connection
        dispatch({ type: "RESET_CONNECTION" });

        loggingService.info(
          "MCPContext",
          "Server URL updated for environment change",
          {
            environment: currentEnvironment,
            serverUrl: newServerUrl,
          }
        );
      } catch (error) {
        loggingService.error(
          "MCPContext",
          "Failed to update server URL for environment change",
          { error, environment: currentEnvironment, serverUrl: newServerUrl }
        );
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to update server URL for new environment",
        });
      }
    };

    handleEnvironmentChange();
  }, [currentEnvironment, getEnvironmentServerUrl]);

  // Effect to check connection when API key changes
  useEffect(() => {
    const handleApiKeyChange = async () => {
      if (apiKey) {
        loggingService.info(
          "MCPContext",
          "API key available, checking connection",
          { hasApiKey: !!apiKey }
        );
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_LOADING", payload: true });

        try {
          const status = await mcpService.getConnectionStatus();

          dispatch({
            type: "SET_CONNECTION_STATUS",
            payload: {
              isConnected: status.isConnected,
              hasApiKey: status.hasApiKey,
            },
          });

          if (!status.hasApiKey) {
            dispatch({
              type: "SET_ERROR",
              payload: "No API key available. Please authenticate first.",
            });
          } else if (!status.isConnected) {
            dispatch({
              type: "SET_ERROR",
              payload: "Unable to connect to MCP server.",
            });
          }

          loggingService.info(
            "MCPContext",
            "Connection status checked in API key change",
            { status }
          );
        } catch (error) {
          loggingService.error(
            "MCPContext",
            "Connection check failed in API key change",
            { error }
          );
          dispatch({
            type: "SET_CONNECTION_STATUS",
            payload: {
              isConnected: false,
              hasApiKey: false,
            },
          });
          dispatch({
            type: "SET_ERROR",
            payload: "Failed to check connection status.",
          });
        }
      } else {
        // No API key available - reset state
        loggingService.info(
          "MCPContext",
          "No API key available, resetting state",
          { hasApiKey: !!apiKey }
        );
        dispatch({ type: "RESET_STATE" });
      }
    };

    handleApiKeyChange();
  }, [apiKey]);

  // Effect to refresh tides when connection is established
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (state.isConnected) {
        loggingService.info("MCPContext", "Connected, refreshing tides", {
          isConnected: state.isConnected,
        });
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_LOADING", payload: true });

        try {
          const response = await mcpService.listTides();
          if (response.success) {
            dispatch({
              type: "SET_TIDES",
              payload: response.tides,
            });
            loggingService.info(
              "MCPContext",
              "Tides refreshed after connection",
              { count: response.count }
            );
          } else {
            throw new Error(response.error || "Failed to list tides");
          }
        } catch (error) {
          loggingService.error(
            "MCPContext",
            "Failed to refresh tides after connection",
            { error }
          );
          dispatch({ type: "SET_ERROR", payload: "Failed to load tides." });
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    };

    handleConnectionChange();
  }, [state.isConnected]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<MCPContextType>(
    () => ({
      ...state,
      checkConnection,
      updateServerUrl,
      getCurrentServerUrl,
      createTide,
      refreshTides,
      selectTide,
      startTideFlow,
      addEnergyToTide,
      getTideReport,
      linkTaskToTide,
      getTaskLinks,
      getTideParticipants,
    }),
    [
      state,
      checkConnection,
      updateServerUrl,
      getCurrentServerUrl,
      createTide,
      refreshTides,
      selectTide,
      startTideFlow,
      addEnergyToTide,
      getTideReport,
      linkTaskToTide,
      getTaskLinks,
      getTideParticipants,
    ]
  );

  return (
    <MCPContext.Provider value={contextValue}>{children}</MCPContext.Provider>
  );
}

export function useMCP(): MCPContextType {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error("useMCP must be used within an MCPProvider");
  }
  return context;
}
