import { useState, useCallback } from "react";
import { useMCP } from "../../../context/MCPContext";
import { NotificationService } from "../../../services/NotificationService";
import type { Tide } from "../../../services/mcpService";
import {
  type FlowSessionSettings,
  type FlowSessionState,
  FLOW_SESSION_CONFIG,
  FLOW_SESSION_MESSAGES,
} from "../constants";

interface UseFlowSessionProps {
  tide: Tide;
  onSessionEnd?: () => void;
}

interface UseFlowSessionReturn {
  sessionState: FlowSessionState;
  startSession: (settings: FlowSessionSettings) => Promise<void>;
  endSession: () => Promise<void>;
  updateElapsedTime: (elapsedTime: number) => void;
  isLoading: boolean;
  error: string | null;
}

export function useFlowSession({
  tide,
  onSessionEnd,
}: UseFlowSessionProps): UseFlowSessionReturn {
  const { startTideFlow, addEnergyToTide } = useMCP();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionState, setSessionState] = useState<FlowSessionState>({
    isActive: false,
    sessionId: null,
    startTime: null,
    elapsedTime: 0,
    settings: {
      intensity: FLOW_SESSION_CONFIG.DEFAULT_INTENSITY,
      duration: FLOW_SESSION_CONFIG.DEFAULT_DURATION,
    },
  });

  const startSession = useCallback(
    async (settings: FlowSessionSettings): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await startTideFlow(
          tide.id,
          settings.intensity,
          settings.duration,
          "high",
          `Flow session for ${tide.name}`
        );

        if (response.success && response.session_id) {
          const startTime = new Date();
          setSessionState({
            isActive: true,
            sessionId: response.session_id,
            startTime,
            elapsedTime: 0,
            settings,
          });

          NotificationService.success(
            FLOW_SESSION_MESSAGES.FLOW_STARTED(
              settings.intensity,
              settings.duration
            ),
            FLOW_SESSION_MESSAGES.FLOW_STARTED_TITLE
          );
        } else {
          throw new Error("Failed to get session ID from server");
        }
      } catch (err) {
        const errorMessage = FLOW_SESSION_MESSAGES.START_ERROR;
        setError(errorMessage);
        NotificationService.error(errorMessage, FLOW_SESSION_MESSAGES.ERROR_TITLE);
        console.error("FlowSession: Failed to start session:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [tide.id, tide.name, startTideFlow]
  );

  const endSession = useCallback(async (): Promise<void> => {
    if (!sessionState.isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      // Record final energy level
      const sessionMinutes = Math.floor(sessionState.elapsedTime / 60);
      await addEnergyToTide(
        tide.id,
        "completed",
        `Flow session completed after ${sessionMinutes} minutes`
      );

      // Reset session state
      setSessionState(prev => ({
        ...prev,
        isActive: false,
        sessionId: null,
        startTime: null,
        elapsedTime: 0,
      }));

      NotificationService.success(
        FLOW_SESSION_MESSAGES.FLOW_ENDED(sessionMinutes),
        FLOW_SESSION_MESSAGES.SESSION_COMPLETE_TITLE
      );

      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (err) {
      const errorMessage = FLOW_SESSION_MESSAGES.END_ERROR;
      setError(errorMessage);
      NotificationService.error(errorMessage, FLOW_SESSION_MESSAGES.ERROR_TITLE);
      console.error("FlowSession: Failed to end session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    sessionState.isActive,
    sessionState.elapsedTime,
    tide.id,
    addEnergyToTide,
    onSessionEnd,
  ]);

  // Update elapsed time in session state
  const updateElapsedTime = useCallback((elapsedTime: number) => {
    setSessionState(prev => ({ ...prev, elapsedTime }));
  }, []);

  return {
    sessionState: {
      ...sessionState,
    },
    startSession,
    endSession,
    updateElapsedTime,
    isLoading,
    error,
  };
}