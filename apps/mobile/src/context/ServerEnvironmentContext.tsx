// Server Environment Context for centralized server configuration management

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoggingService } from "../services/LoggingService";
import { NotificationService } from "../services/NotificationService";
import { AuthService } from "../services/authService";
import type {
  ServerEnvironmentState,
  ServerEnvironmentAction,
  ServerEnvironmentId,
  ServerEnvironment,
} from "./ServerEnvironmentTypes";
import {
  SERVER_ENVIRONMENTS,
  DEFAULT_ENVIRONMENT,
} from "./ServerEnvironmentTypes";

const STORAGE_KEY = "tides_server_environment";

// Initial state
const initialState: ServerEnvironmentState = {
  currentEnvironment: DEFAULT_ENVIRONMENT,
  environments: SERVER_ENVIRONMENTS,
  isLoading: false,
  error: null,
  lastSwitched: null,
};

// Reducer
function serverEnvironmentReducer(
  state: ServerEnvironmentState,
  action: ServerEnvironmentAction
): ServerEnvironmentState {
  switch (action.type) {
    case "SET_ENVIRONMENT":
      return {
        ...state,
        currentEnvironment: action.payload,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case "ENVIRONMENT_SWITCHED":
      return {
        ...state,
        currentEnvironment: action.payload.environmentId,
        lastSwitched: action.payload.timestamp,
        isLoading: false,
        error: null,
      };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

// Context type
interface ServerEnvironmentContextType extends ServerEnvironmentState {
  switchEnvironment: (environmentId: ServerEnvironmentId) => Promise<void>;
  getCurrentEnvironment: () => ServerEnvironment;
  getCurrentServerUrl: () => string;
  getEnvironmentById: (id: ServerEnvironmentId) => ServerEnvironment;
  resetToDefault: () => Promise<void>;
}

const ServerEnvironmentContext = createContext<
  ServerEnvironmentContextType | undefined
>(undefined);

interface ServerEnvironmentProviderProps {
  children: ReactNode;
  onEnvironmentChange?: (environment: ServerEnvironment) => void;
}

export function ServerEnvironmentProvider({
  children,
  onEnvironmentChange,
}: ServerEnvironmentProviderProps) {
  const [state, dispatch] = useReducer(serverEnvironmentReducer, initialState);

  // Load saved environment on mount
  useEffect(() => {
    const loadSavedEnvironment = async () => {
      try {
        LoggingService.info(
          "ServerEnvironmentContext",
          "Loading saved environment preference",
          undefined,
          "ENV_001"
        );

        const savedEnvironmentId = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedEnvironmentId && savedEnvironmentId in SERVER_ENVIRONMENTS) {
          const environmentId = savedEnvironmentId as ServerEnvironmentId;
          dispatch({ type: "SET_ENVIRONMENT", payload: environmentId });

          // Initialize AuthService with the saved environment URL
          const serverUrl = SERVER_ENVIRONMENTS[environmentId].url;
          await AuthService.setWorkerUrl(serverUrl);

          LoggingService.info(
            "ServerEnvironmentContext",
            "Loaded saved environment and initialized AuthService",
            { environmentId, serverUrl },
            "ENV_002"
          );
        } else {
          // Initialize AuthService with default environment URL
          const defaultServerUrl = SERVER_ENVIRONMENTS[DEFAULT_ENVIRONMENT].url;
          await AuthService.setWorkerUrl(defaultServerUrl);

          LoggingService.info(
            "ServerEnvironmentContext",
            "No saved environment found, using default and initialized AuthService",
            { defaultEnvironment: DEFAULT_ENVIRONMENT, serverUrl: defaultServerUrl },
            "ENV_003"
          );
        }
      } catch (error) {
        LoggingService.error(
          "ServerEnvironmentContext",
          "Failed to load saved environment",
          { error },
          "ENV_004"
        );
        // Continue with default environment
      }
    };

    loadSavedEnvironment();
  }, []);

  // Switch environment function
  const switchEnvironment = useCallback(
    async (environmentId: ServerEnvironmentId): Promise<void> => {
      if (!(environmentId in SERVER_ENVIRONMENTS)) {
        const error = `Invalid environment ID: ${environmentId}`;
        LoggingService.error(
          "ServerEnvironmentContext",
          "Invalid environment switch attempt",
          { environmentId },
          "ENV_005"
        );
        dispatch({ type: "SET_ERROR", payload: error });
        throw new Error(error);
      }

      if (state.currentEnvironment === environmentId) {
        LoggingService.info(
          "ServerEnvironmentContext",
          "Environment already active",
          { environmentId },
          "ENV_006"
        );
        return;
      }

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        LoggingService.info(
          "ServerEnvironmentContext",
          "Switching environment",
          {
            from: state.currentEnvironment,
            to: environmentId,
            environment: SERVER_ENVIRONMENTS[environmentId],
          },
          "ENV_007"
        );

        // Save to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, environmentId);

        // Update AuthService with new URL
        const newServerUrl = SERVER_ENVIRONMENTS[environmentId].url;
        await AuthService.setWorkerUrl(newServerUrl);

        // Update state
        const timestamp = new Date().toISOString();
        dispatch({
          type: "ENVIRONMENT_SWITCHED",
          payload: { environmentId, timestamp },
        });

        // Notify callback if provided
        if (onEnvironmentChange) {
          onEnvironmentChange(SERVER_ENVIRONMENTS[environmentId]);
        }

        LoggingService.info(
          "ServerEnvironmentContext",
          "Environment switched successfully",
          {
            environmentId,
            environment: SERVER_ENVIRONMENTS[environmentId].name,
            url: SERVER_ENVIRONMENTS[environmentId].url,
          },
          "ENV_008"
        );

        NotificationService.success(
          `Switched to ${SERVER_ENVIRONMENTS[environmentId].name}`,
          "Environment Changed"
        );
      } catch (error) {
        LoggingService.error(
          "ServerEnvironmentContext",
          "Failed to switch environment",
          { error, environmentId },
          "ENV_009"
        );

        dispatch({
          type: "SET_ERROR",
          payload: "Failed to switch environment",
        });

        NotificationService.error(
          "Failed to switch environment",
          "Environment Error"
        );

        throw error;
      }
    },
    [state.currentEnvironment, onEnvironmentChange]
  );

  // Get current environment
  const getCurrentEnvironment = useCallback((): ServerEnvironment => {
    return SERVER_ENVIRONMENTS[state.currentEnvironment];
  }, [state.currentEnvironment]);

  // Get current server URL
  const getCurrentServerUrl = useCallback((): string => {
    return SERVER_ENVIRONMENTS[state.currentEnvironment].url;
  }, [state.currentEnvironment]);

  // Get environment by ID
  const getEnvironmentById = useCallback(
    (id: ServerEnvironmentId): ServerEnvironment => {
      return SERVER_ENVIRONMENTS[id];
    },
    []
  );

  // Reset to default environment
  const resetToDefault = useCallback(async (): Promise<void> => {
    LoggingService.info(
      "ServerEnvironmentContext",
      "Resetting to default environment",
      { defaultEnvironment: DEFAULT_ENVIRONMENT },
      "ENV_010"
    );

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await switchEnvironment(DEFAULT_ENVIRONMENT);

      LoggingService.info(
        "ServerEnvironmentContext",
        "Reset to default environment completed",
        { defaultEnvironment: DEFAULT_ENVIRONMENT },
        "ENV_011"
      );
    } catch (error) {
      LoggingService.error(
        "ServerEnvironmentContext",
        "Failed to reset to default environment",
        { error },
        "ENV_012"
      );
      throw error;
    }
  }, [switchEnvironment]);

  // Memoize context value
  const contextValue = useMemo<ServerEnvironmentContextType>(
    () => ({
      ...state,
      switchEnvironment,
      getCurrentEnvironment,
      getCurrentServerUrl,
      getEnvironmentById,
      resetToDefault,
    }),
    [
      state,
      switchEnvironment,
      getCurrentEnvironment,
      getCurrentServerUrl,
      getEnvironmentById,
      resetToDefault,
    ]
  );

  return (
    <ServerEnvironmentContext.Provider value={contextValue}>
      {children}
    </ServerEnvironmentContext.Provider>
  );
}

// Hook to use server environment context
export function useServerEnvironment(): ServerEnvironmentContextType {
  const context = useContext(ServerEnvironmentContext);
  if (context === undefined) {
    throw new Error(
      "useServerEnvironment must be used within a ServerEnvironmentProvider"
    );
  }
  return context;
}
