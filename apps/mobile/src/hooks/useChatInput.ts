import { useState, useCallback, useEffect, useRef } from "react";
import { loggingService } from "../services/loggingService";
import { phraseDetectionService } from "../services/phraseDetectionService";
import type { DetectedTool } from "../config/toolPhrases";

interface UseChatInputReturn {
  // State
  inputMessage: string;
  toolSuggestion: DetectedTool | null;
  showSuggestion: boolean;
  
  // Actions
  setInputMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  acceptSuggestion: () => void;
  dismissSuggestion: () => void;
}

interface UseChatInputProps {
  getCurrentContextTideId?: () => string | null; // Context-aware tide ID
  isConnected: boolean;
  getCurrentServerUrl: () => string;
  sendMessage: (message: string) => Promise<void>;
  runDebugTests: () => Promise<void>;
  testEdgeCases: () => Promise<void>;
  setShowDebugPanel: (show: boolean) => void;
  setDebugTestResults: (results: string[]) => void;
  executeMCPTool?: (toolName: string, params: Record<string, any>) => Promise<void>;
}

export const useChatInput = ({
  getCurrentContextTideId,
  isConnected,
  getCurrentServerUrl,
  sendMessage,
  runDebugTests,
  testEdgeCases,
  setShowDebugPanel,
  setDebugTestResults,
  executeMCPTool,
}: UseChatInputProps): UseChatInputReturn => {
  // State management
  const [inputMessage, setInputMessage] = useState("");
  const [toolSuggestion, setToolSuggestion] = useState<DetectedTool | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  
  // Debounce timer ref
  const detectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect tool intent when input changes
  useEffect(() => {
    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
    }

    if (!inputMessage || inputMessage.length < 3) {
      setToolSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    // Debounce detection for 300ms
    detectionTimerRef.current = setTimeout(() => {
      const detected = phraseDetectionService.detectToolIntent(inputMessage);
      
      if (detected) {
        setToolSuggestion(detected);
        setShowSuggestion(true);
        
        loggingService.info("ChatInput", "Tool suggestion detected", {
          input: inputMessage.substring(0, 50),
          toolId: detected.toolId,
          confidence: detected.confidence,
        });
      } else {
        setToolSuggestion(null);
        setShowSuggestion(false);
      }
    }, 300);

    return () => {
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
      }
    };
  }, [inputMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setToolSuggestion(null);
    setShowSuggestion(false);

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

    // For all other messages, automatically query the agent with context-aware tide information
    const contextTideId = getCurrentContextTideId?.();
    const context = {
      // Current context tide (daily/weekly/monthly)
      ...(contextTideId && { 
        contextTideId,
        contextType: "hierarchical", // Indicate this is from context system
      }),

      // Current app state
      currentScreen: "Home",
      contextBasedSystem: true, // Flag to indicate new context-based architecture

      // Connection state
      isConnected,
      currentServerUrl: getCurrentServerUrl(),

      // Timestamp for context
      requestedAt: new Date().toISOString(),
    };

    loggingService.info("Chat", "Sending message to agent with context-aware information", {
      messageLength: message.length,
      contextKeys: Object.keys(context),
      contextTideId,
      hasContextTide: !!contextTideId,
    });

    await sendMessage(message);
  }, [
    inputMessage,
    sendMessage,
    runDebugTests,
    testEdgeCases,
    setShowDebugPanel,
    setDebugTestResults,
    getCurrentContextTideId,
    isConnected,
    getCurrentServerUrl,
  ]);

  // Accept the tool suggestion
  const acceptSuggestion = useCallback(() => {
    if (!toolSuggestion || !executeMCPTool) return;

    loggingService.info("ChatInput", "Tool suggestion accepted", {
      toolId: toolSuggestion.toolId,
      extractedParams: toolSuggestion.extractedParams,
    });

    // Clear input and suggestion
    setInputMessage("");
    setToolSuggestion(null);
    setShowSuggestion(false);

    // Generate default params for the tool
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let params = { ...toolSuggestion.extractedParams };

    // Add smart defaults based on tool type
    switch (toolSuggestion.toolId) {
      case "createTide":
        params = {
          name: params.name || `Tide ${dateString} ${timeString}`,
          description: params.description || `Created on ${dateString} at ${timeString}`,
          flowType: params.flowType || "daily",
          ...params,
        };
        break;
      case "startTideFlow":
        // Use current context tide
        if (!params.tideId) {
          params.tideId = getCurrentContextTideId?.();
        }
        params = {
          intensity: params.intensity || "moderate",
          duration: params.duration || 25,
          initialEnergy: params.initialEnergy || "moderate",
          workContext: params.workContext || "Quick flow session",
          ...params,
        };
        break;
      case "addEnergyToTide":
        // Use current context tide
        if (!params.tideId) {
          params.tideId = getCurrentContextTideId?.();
        }
        params = {
          energyLevel: params.energyLevel || "moderate",
          context: params.context || `Energy added at ${timeString}`,
          ...params,
        };
        break;
      case "linkTaskToTide":
        // Use current context tide
        if (!params.tideId) {
          params.tideId = getCurrentContextTideId?.();
        }
        params = {
          taskUrl: params.taskUrl || `https://example.com/task-${Date.now()}`,
          taskTitle: params.taskTitle || `Task created ${timeString}`,
          taskType: params.taskType || "general",
          ...params,
        };
        break;
      case "getTaskLinks":
      case "getTideReport":
        // Use current context tide
        if (!params.tideId) {
          params.tideId = getCurrentContextTideId?.();
        }
        break;
      case "getTideParticipants":
        params = {
          statusFilter: params.statusFilter || "active",
          limit: params.limit || 10,
          ...params,
        };
        break;
    }

    // Map agent commands to actual execution
    if (["getInsights", "analyzeTides", "getRecommendations"].includes(toolSuggestion.toolId)) {
      // For agent commands, send as a message instead
      const commandMap: Record<string, string> = {
        getInsights: "get insights",
        analyzeTides: "analyze my tides",
        getRecommendations: "recommend actions",
      };
      
      const command = commandMap[toolSuggestion.toolId];
      if (command) {
        sendMessage(command);
      }
    } else {
      // Execute MCP tool
      executeMCPTool(toolSuggestion.toolId, params);
    }
  }, [toolSuggestion, executeMCPTool, sendMessage, getCurrentContextTideId]);

  // Dismiss the suggestion
  const dismissSuggestion = useCallback(() => {
    setToolSuggestion(null);
    setShowSuggestion(false);
    
    loggingService.info("ChatInput", "Tool suggestion dismissed");
  }, []);

  return {
    // State
    inputMessage,
    toolSuggestion,
    showSuggestion,
    
    // Actions
    setInputMessage,
    handleSendMessage,
    acceptSuggestion,
    dismissSuggestion,
  };
};