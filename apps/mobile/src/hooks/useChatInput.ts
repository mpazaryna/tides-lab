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
  runDebugTests?: () => Promise<void>;
  testEdgeCases?: () => Promise<void>;
  setDebugTestResults?: (results: string[]) => void;
  executeMCPTool?: (toolName: string, params: Record<string, any>) => Promise<void>;
}

export const useChatInput = ({
  getCurrentContextTideId,
  isConnected,
  getCurrentServerUrl,
  sendMessage,
  runDebugTests,
  testEdgeCases,
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

  // Parse tool parameter templates
  const parseToolTemplate = useCallback((message: string) => {
    // Check if message matches tool template pattern like "/flow [param: value]"
    const templateMatch = message.match(/^\/(\w+)\s+(.+)$/);
    if (!templateMatch) return null;

    const [, toolName, paramString] = templateMatch;
    const params: Record<string, string> = {};
    const missingParams: string[] = [];

    // Extract parameters in [key: value] format
    const paramMatches = paramString.match(/\[([^:]+):\s*([^\]]+)\]/g);
    if (!paramMatches) return null;

    paramMatches.forEach(match => {
      const paramMatch = match.match(/\[([^:]+):\s*([^\]]+)\]/);
      if (paramMatch) {
        const [, key, value] = paramMatch;
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        
        if (trimmedValue === '___' || trimmedValue === '') {
          missingParams.push(trimmedKey);
        } else {
          params[trimmedKey] = trimmedValue;
        }
      }
    });

    return {
      toolName,
      params,
      missingParams,
      isComplete: missingParams.length === 0
    };
  }, []);

  // Map template parameters to MCP tool parameters
  const mapTemplateParamsToMCP = useCallback((toolName: string, templateParams: Record<string, string>) => {
    const contextTideId = getCurrentContextTideId?.();
    const now = new Date();

    switch (toolName) {
      case 'tide_smart_flow':
        return {
          tideId: contextTideId,
          intensity: templateParams.energy === 'low' ? 'gentle' : 
                    templateParams.energy === 'medium' ? 'moderate' :
                    templateParams.energy === 'high' ? 'intense' : 'moderate',
          duration: parseInt(templateParams.duration, 10) || 25,
          workContext: templateParams.what || 'focus work',
          initialEnergy: templateParams.energy || 'medium',
          timestamp: now.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      case 'tide_add_energy':
        return {
          tideId: contextTideId,
          energyLevel: templateParams.level || 'medium',
          context: templateParams.context || `Energy added at ${now.toLocaleTimeString()}`,
          timestamp: now.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      case 'tide_link_task':
        return {
          tideId: contextTideId,
          taskUrl: templateParams.url || `https://task-${Date.now()}`,
          taskTitle: templateParams.task || 'New Task',
          taskType: templateParams.type || 'general',
          timestamp: now.toISOString(),
        };
      case 'tide_get_report':
        return {
          tideId: contextTideId,
          period: templateParams.period || 'today',
          format: templateParams.format || 'summary',
        };
      default:
        return templateParams;
    }
  }, [getCurrentContextTideId]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setToolSuggestion(null);
    setShowSuggestion(false);

    // Check for debug commands (keep these local)
    if (message === "/debug" && runDebugTests) {
      runDebugTests();
      return;
    } else if (message === "/debug edge" && testEdgeCases) {
      testEdgeCases();
      return;
    } else if (message === "/debug hide" && setDebugTestResults) {
      setDebugTestResults([]);
      return;
    }

    // Check if message is a tool template
    const parsedTemplate = parseToolTemplate(message);
    if (parsedTemplate) {
      if (parsedTemplate.isComplete && executeMCPTool) {
        // Execute tool directly with complete parameters
        const toolName = parsedTemplate.toolName === 'flow' ? 'tide_smart_flow' :
                         parsedTemplate.toolName === 'energy' ? 'tide_add_energy' :
                         parsedTemplate.toolName === 'link' ? 'tide_link_task' :
                         parsedTemplate.toolName === 'report' ? 'tide_get_report' :
                         parsedTemplate.toolName;

        // Map template params to MCP tool params
        const mcpParams = mapTemplateParamsToMCP(toolName, parsedTemplate.params);
        
        loggingService.info("ChatInput", "Executing complete tool template", {
          toolName,
          params: mcpParams,
        });

        try {
          await executeMCPTool(toolName, mcpParams);
          return;
        } catch (error) {
          loggingService.error("ChatInput", "Tool execution failed", { error, toolName, params: mcpParams });
        }
      } else {
        // Send to agent for parameter gathering
        loggingService.info("ChatInput", "Tool template incomplete, routing to agent", {
          toolName: parsedTemplate.toolName,
          missingParams: parsedTemplate.missingParams,
          providedParams: parsedTemplate.params,
        });
      }
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
    setDebugTestResults,
    getCurrentContextTideId,
    isConnected,
    getCurrentServerUrl,
    parseToolTemplate,
    mapTemplateParamsToMCP,
    executeMCPTool,
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