import { useState, useCallback } from "react";
import type { Tide } from "../types";
import { loggingService } from "../services/loggingService";

interface UseChatInputReturn {
  // State
  inputMessage: string;
  
  // Actions
  setInputMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
}

interface UseChatInputProps {
  activeTides: Tide[];
  tideId?: string;
  isConnected: boolean;
  getCurrentServerUrl: () => string;
  sendAgentMessage: (message: string, context: any) => Promise<void>;
  runDebugTests: () => Promise<void>;
  testEdgeCases: () => Promise<void>;
  setShowDebugPanel: (show: boolean) => void;
  setDebugTestResults: (results: string[]) => void;
}

export const useChatInput = ({
  activeTides,
  tideId,
  isConnected,
  getCurrentServerUrl,
  sendAgentMessage,
  runDebugTests,
  testEdgeCases,
  setShowDebugPanel,
  setDebugTestResults,
}: UseChatInputProps): UseChatInputReturn => {
  // State management
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");

    // Check for debug commands (keep these local)
    if (message === "/debug") {
      runDebugTests();
      return;
    } else if (message === "/debug edge") {
      testEdgeCases();
      return;
    } else if (message === "/debug hide") {
      setShowDebugPanel(false);
      setDebugTestResults([]);
      return;
    }

    // For all other messages, automatically query the agent with full context
    const context = {
      // Current tide context (if navigated from a specific tide)
      ...(tideId && { tideId }),

      // User's active tides for insights and analysis
      activeTides: activeTides.map((tide) => ({
        id: tide.id,
        name: tide.name,
        flow_type: tide.flow_type,
        status: tide.status,
        created_at: tide.created_at,
        description: tide.description,
        flow_count: tide.flow_count,
        last_flow: tide.last_flow,
      })),

      // Current app state
      totalActiveTides: activeTides.length,
      currentScreen: "Home",

      // Connection state
      isConnected,
      currentServerUrl: getCurrentServerUrl(),

      // Timestamp for context
      requestedAt: new Date().toISOString(),
    };

    loggingService.info("Chat", "Sending message to agent with context", {
      messageLength: message.length,
      contextKeys: Object.keys(context),
      activeTidesCount: activeTides.length,
    });

    await sendAgentMessage(message, context);
  }, [
    inputMessage,
    sendAgentMessage,
    runDebugTests,
    testEdgeCases,
    setShowDebugPanel,
    setDebugTestResults,
    tideId,
    activeTides,
    isConnected,
    getCurrentServerUrl,
  ]);

  return {
    // State
    inputMessage,
    
    // Actions
    setInputMessage,
    handleSendMessage,
  };
};