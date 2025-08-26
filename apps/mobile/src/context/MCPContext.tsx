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
import { AuthService } from "../services/authService";
import { LoggingService } from "../services/LoggingService";
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
  const { user, apiKey } = useAuth();
  const { getCurrentServerUrl: getEnvironmentServerUrl, currentEnvironment } = useServerEnvironment();
  const [state, dispatch] = useReducer(mcpReducer, initialMCPState);

  const checkConnection = useCallback(async (): Promise<void> => {
    LoggingService.info(
      "MCPContext",
      "Checking MCP connection",
      undefined,
      "MCP_001"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const status = await mcpService.getConnectionStatus();

      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: {
          isConnected: status.isConnected,
          hasApiKey: status.hasApiKey,
        },
      });

      LoggingService.info(
        "MCPContext",
        "Connection status checked",
        { status },
        "MCP_002"
      );
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Connection check failed",
        { error },
        "MCP_003"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to check connection status." });
    }
  }, []);

  const updateServerUrl = useCallback(async (url: string): Promise<void> => {
    LoggingService.info(
      "MCPContext",
      "Updating server URL",
      { url },
      "MCP_004"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Update AuthService URL
      await AuthService.setWorkerUrl(url);

      // Update MCPService URL
      await mcpService.updateServerUrl(url);

      // Reset connection state
      dispatch({ type: 'RESET_CONNECTION' });

      LoggingService.info(
        "MCPContext",
        "Server URL updated successfully",
        { url },
        "MCP_005"
      );
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to update server URL",
        { error, url },
        "MCP_006"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to update server URL" });
    }
  }, []);

  const getCurrentServerUrl = useCallback((): string => {
    return getEnvironmentServerUrl();
  }, [getEnvironmentServerUrl]);

  const refreshTides = useCallback(async (): Promise<void> => {
    if (!state.isConnected) {
      LoggingService.info(
        "MCPContext",
        "Skipping tide refresh - not connected",
        undefined,
        "MCP_007"
      );
      return;
    }

    LoggingService.info(
      "MCPContext",
      "Refreshing tides",
      undefined,
      "MCP_008"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.listTides();
      if (response.success) {
        dispatch({
          type: 'SET_TIDES',
          payload: response.tides,
        });
        LoggingService.info(
          "MCPContext",
          "Tides refreshed",
          { count: response.tides.length },
          "MCP_009"
        );
      } else {
        throw new Error(response.error || "Failed to list tides");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to refresh tides",
        { error },
        "MCP_010"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to load tides." });
    }
  }, [state.isConnected]);

  const createTide = useCallback(async (
    name: string,
    description?: string,
    flowType?: "daily" | "weekly" | "project" | "seasonal"
  ): Promise<TideCreateResponse> => {
    LoggingService.info(
      "MCPContext",
      "Creating tide",
      { name, flowType },
      "MCP_011"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.createTide(name, description, flowType);
      if (response.success && response.tide_id) {
        // Create tide object from response
        const newTide: Tide = {
          id: response.tide_id,
          name: response.name || name,
          status:
            (response.status as "active" | "completed" | "paused") || "active",
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
          type: 'ADD_TIDE',
          payload: newTide,
        });

        LoggingService.info(
          "MCPContext",
          "Tide created",
          { tideId: newTide.id, name },
          "MCP_012"
        );
        return response;
      } else {
        throw new Error(response.error || "Failed to create tide");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to create tide",
        { error, name },
        "MCP_013"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to create tide." });
      throw error;
    }
  }, []);

  const selectTide = useCallback((tide: Tide | null): void => {
    LoggingService.info(
      "MCPContext",
      "Selecting tide",
      { tideId: tide?.id },
      "MCP_014"
    );
    dispatch({
      type: 'SELECT_TIDE',
      payload: tide,
    });
  }, []);

  const addEnergyToTide = useCallback(async (
    tideId: string,
    energyLevel: EnergyLevel,
    context?: string
  ): Promise<EnergyUpdate> => {
    LoggingService.info(
      "MCPContext",
      "Adding energy to tide",
      { tideId, energyLevel, context },
      "MCP_015"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.addEnergyToTide(
        tideId,
        energyLevel,
        context
      );
      if (response.success) {
        LoggingService.info(
          "MCPContext",
          "Energy added to tide",
          { tideId, energyLevel },
          "MCP_016"
        );

        // Refresh tides to get updated data
        await refreshTides();
        return response;
      } else {
        throw new Error(response.error || "Failed to add energy");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to add energy to tide",
        { error, tideId, energyLevel },
        "MCP_017"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to add energy to tide." });
      throw error;
    }
  }, [refreshTides]);

  const startTideFlow = useCallback(async (
    tideId: string,
    intensity?: FlowIntensity,
    duration?: number,
    initialEnergy?: "low" | "medium" | "high",
    workContext?: string
  ): Promise<FlowSessionResponse> => {
    LoggingService.info(
      "MCPContext",
      "Starting tide flow",
      { tideId, intensity, duration, initialEnergy, workContext },
      "MCP_018"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.startTideFlow(
        tideId,
        intensity,
        duration,
        initialEnergy,
        workContext
      );
      if (response.success) {
        LoggingService.info(
          "MCPContext",
          "Flow session started",
          { tideId, sessionId: response.session_id, intensity, duration },
          "MCP_019"
        );

        // Refresh tides to get updated data
        await refreshTides();
        return response;
      } else {
        throw new Error(response.error || "Failed to start flow session");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to start flow session",
        { error, tideId, intensity, duration },
        "MCP_020"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to start flow session." });
      throw error;
    }
  }, [refreshTides]);

  const getTideReport = useCallback(async (
    tideId: string,
    format?: "json" | "markdown" | "csv"
  ): Promise<TideReportResponse> => {
    LoggingService.info(
      "MCPContext",
      "Getting tide report",
      { tideId, format },
      "MCP_021"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.getTideReport(tideId, format);
      if (response.success) {
        LoggingService.info(
          "MCPContext",
          "Retrieved tide report",
          { tideId, format },
          "MCP_022"
        );
        return response;
      } else {
        throw new Error(response.error || "Failed to get tide report");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to get tide report",
        { error, tideId, format },
        "MCP_023"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to load tide report." });
      throw error;
    }
  }, []);

  const linkTaskToTide = useCallback(async (
    tideId: string,
    taskUrl: string,
    taskTitle: string,
    taskType?: string
  ): Promise<TaskLinkResponse> => {
    LoggingService.info(
      "MCPContext",
      "Linking task to tide",
      { tideId, taskTitle, taskUrl, taskType },
      "MCP_024"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.linkTaskToTide(
        tideId,
        taskUrl,
        taskTitle,
        taskType
      );
      if (response.success) {
        LoggingService.info(
          "MCPContext",
          "Task linked to tide",
          { tideId, taskTitle, linkId: response.link_id },
          "MCP_025"
        );
        return response;
      } else {
        throw new Error(response.error || "Failed to link task");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to link task to tide",
        { error, tideId, taskTitle, taskUrl },
        "MCP_026"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to link task to tide." });
      throw error;
    }
  }, []);

  const getTaskLinks = useCallback(async (tideId: string): Promise<TaskLinksResponse> => {
    LoggingService.info(
      "MCPContext",
      "Getting task links",
      { tideId },
      "MCP_027"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.listTaskLinks(tideId);
      if (response.success) {
        LoggingService.info(
          "MCPContext",
          "Retrieved task links",
          { tideId, count: response.count },
          "MCP_028"
        );
        return response;
      } else {
        throw new Error(response.error || "Failed to get task links");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to get task links",
        { error, tideId },
        "MCP_029"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to load task links." });
      throw error;
    }
  }, []);

  const getTideParticipants = useCallback(async (
    statusFilter?: string,
    dateFrom?: string,
    dateTo?: string,
    limit?: number
  ): Promise<any[]> => {
    LoggingService.info(
      "MCPContext",
      "Getting tide participants",
      { statusFilter, dateFrom, dateTo, limit },
      "MCP_030"
    );
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await mcpService.getTideParticipants(
        statusFilter,
        dateFrom,
        dateTo,
        limit
      );
      if (response.success) {
        LoggingService.info(
          "MCPContext",
          "Retrieved tide participants",
          { count: response.count, statusFilter, dateFrom, dateTo },
          "MCP_031"
        );
        return response.participants;
      } else {
        throw new Error(response.error || "Failed to get participants");
      }
    } catch (error) {
      LoggingService.error(
        "MCPContext",
        "Failed to get tide participants",
        { error, statusFilter, dateFrom, dateTo, limit },
        "MCP_032"
      );
      dispatch({ type: 'SET_ERROR', payload: "Failed to load tide participants." });
      throw error;
    }
  }, []);

  // Effect to handle environment changes
  useEffect(() => {
    const handleEnvironmentChange = async () => {
      const newServerUrl = getEnvironmentServerUrl();
      
      LoggingService.info(
        'MCPContext',
        'Environment changed, updating server URL',
        { 
          environment: currentEnvironment,
          serverUrl: newServerUrl 
        },
        'MCP_ENV_001'
      );

      try {
        // Update AuthService URL
        await AuthService.setWorkerUrl(newServerUrl);

        // Update MCPService URL  
        await mcpService.updateServerUrl(newServerUrl);

        // Reset connection state to force re-connection
        dispatch({ type: 'RESET_CONNECTION' });

        LoggingService.info(
          'MCPContext',
          'Server URL updated for environment change',
          { 
            environment: currentEnvironment,
            serverUrl: newServerUrl 
          },
          'MCP_ENV_002'
        );
      } catch (error) {
        LoggingService.error(
          'MCPContext',
          'Failed to update server URL for environment change',
          { error, environment: currentEnvironment, serverUrl: newServerUrl },
          'MCP_ENV_003'
        );
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update server URL for new environment' });
      }
    };

    handleEnvironmentChange();
  }, [currentEnvironment, getEnvironmentServerUrl]);

  // Effect to check connection when user/apiKey changes
  useEffect(() => {
    const handleUserAuthChange = async () => {
      if (user && apiKey) {
        LoggingService.info(
          "MCPContext",
          "User authenticated, checking connection",
          { hasUser: !!user, hasApiKey: !!apiKey },
          "MCP_033"
        );
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
          const status = await mcpService.getConnectionStatus();

          dispatch({
            type: 'SET_CONNECTION_STATUS',
            payload: {
              isConnected: status.isConnected,
              hasApiKey: status.hasApiKey,
            },
          });

          if (!status.hasApiKey) {
            dispatch({ type: 'SET_ERROR', payload: "No API key available. Please authenticate first." });
          } else if (!status.isConnected) {
            dispatch({ type: 'SET_ERROR', payload: "Unable to connect to MCP server." });
          }

          LoggingService.info(
            "MCPContext",
            "Connection status checked in auth change",
            { status },
            "MCP_034"
          );
        } catch (error) {
          LoggingService.error(
            "MCPContext",
            "Connection check failed in auth change",
            { error },
            "MCP_035"
          );
          dispatch({
            type: 'SET_CONNECTION_STATUS',
            payload: {
              isConnected: false,
              hasApiKey: false,
            },
          });
          dispatch({ type: 'SET_ERROR', payload: "Failed to check connection status." });
        }
      } else {
        LoggingService.info(
          "MCPContext",
          "User not authenticated, resetting state",
          { hasUser: !!user, hasApiKey: !!apiKey },
          "MCP_036"
        );
        dispatch({ type: 'RESET_STATE' });
      }
    };

    handleUserAuthChange();
  }, [user, apiKey]);

  // Effect to refresh tides when connection is established
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (state.isConnected) {
        LoggingService.info(
          "MCPContext",
          "Connected, refreshing tides",
          { isConnected: state.isConnected },
          "MCP_037"
        );
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
          const response = await mcpService.listTides();
          if (response.success) {
            dispatch({
              type: 'SET_TIDES',
              payload: response.tides,
            });
            LoggingService.info(
              "MCPContext",
              "Tides refreshed after connection",
              { count: response.count },
              "MCP_038"
            );
          } else {
            throw new Error(response.error || "Failed to list tides");
          }
        } catch (error) {
          LoggingService.error(
            "MCPContext",
            "Failed to refresh tides after connection",
            { error },
            "MCP_039"
          );
          dispatch({ type: 'SET_ERROR', payload: "Failed to load tides." });
          dispatch({ type: 'SET_LOADING', payload: false });
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
