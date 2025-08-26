import { useState, useCallback, useRef } from "react";
import { Animated } from "react-native";
import type { Tide } from "../types";
import { loggingService } from "../services/loggingService";

interface UseToolMenuReturn {
  // State
  showToolMenu: boolean;
  toolButtonActive: boolean;
  
  // Animation refs
  rotationAnim: Animated.Value;
  menuHeightAnim: Animated.Value;
  
  // Actions
  toggleToolMenu: () => void;
  generateDefaultParams: (toolName: string) => Record<string, any> | null;
  getToolAvailability: (toolName: string) => { available: boolean; reason: string };
  handleToolSelect: (toolName: string, customParameters?: Record<string, any>) => Promise<void>;
}

interface UseToolMenuProps {
  executeMCPTool: (toolName: string, params: Record<string, any>) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  getCurrentContextTideId?: () => string | null;
  setToolExecuting?: (executing: boolean) => void;
}

export const useToolMenu = ({
  executeMCPTool,
  sendMessage,
  getCurrentContextTideId,
  setToolExecuting,
}: UseToolMenuProps): UseToolMenuReturn => {
  // State management
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [toolButtonActive, setToolButtonActive] = useState(false);
  
  // Animation refs
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const menuHeightAnim = useRef(new Animated.Value(0)).current;

  // Toggle tool menu with synchronized animations
  const toggleToolMenu = useCallback(() => {
    const isOpening = !showToolMenu;

    if (isOpening) {
      setShowToolMenu(true);
      setToolButtonActive(true); // Change color immediately

      // Synchronize button rotation and menu expansion
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(menuHeightAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      setToolButtonActive(false); // Change color immediately

      // Synchronize button rotation and menu collapse
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(menuHeightAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowToolMenu(false);
      });
    }
  }, [showToolMenu, rotationAnim, menuHeightAnim]);

  // Context-aware parameter generation
  const generateDefaultParams = useCallback(
    (toolName: string) => {
      const now = new Date();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const currentHour = now.getHours();
      const timeBasedContext = 
        currentHour < 12 ? 'morning focus' :
        currentHour < 17 ? 'afternoon productivity' : 
        'evening deep work';

      // Get current context tide ID for all tools
      const contextTideId = getCurrentContextTideId?.();

      switch (toolName) {
        case "createTide":
          return {
            name: `Tide ${dateString} ${timeString}`,
            description: `Created on ${dateString} at ${timeString}`,
            flowType: "daily",
          };
        case "startTideFlow":
        case "tide_smart_flow":
          return {
            tideId: contextTideId,
            intensity: "moderate",
            duration: 25,
            initialEnergy: "moderate",
            workContext: timeBasedContext,
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        case "addEnergyToTide":
        case "tide_add_energy":
          return {
            tideId: contextTideId,
            energyLevel: "moderate",
            context: `${timeBasedContext} - energy logged at ${timeString}`,
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        case "linkTaskToTide":
        case "tide_link_task":
          return {
            tideId: contextTideId,
            taskUrl: `https://example.com/task-${Date.now()}`,
            taskTitle: `${timeBasedContext} - task created ${timeString}`,
            taskType: "context_task",
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        case "getTaskLinks":
        case "tide_list_task_links":
          return {
            tideId: contextTideId,
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        case "getTideReport":
        case "tide_get_report":
          return {
            tideId: contextTideId,
            format: "summary",
            include_energy_analysis: true,
            include_time_patterns: true,
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        case "getTideParticipants":
        case "tides_get_participants":
          return {
            statusFilter: "active",
            limit: 10,
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        case "ai_session_insights":
          // Generate mock session data for AI analysis
          return {
            session_data: {
              duration: 25,
              planned_duration: 25,
              energy_start: 7,
              energy_end: 6,
              productivity_score: 8,
              interruptions: 1,
              work_context: timeBasedContext,
              completion_status: "completed"
            },
            recent_sessions: [
              { duration: 30, energy_start: 6, productivity_score: 7 },
              { duration: 20, energy_start: 8, productivity_score: 9 }
            ]
          };
        default:
          return {
            contextTideId,
            timestamp: now.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
      }
    },
    [getCurrentContextTideId]
  );

  // Tool availability checking - All tools always available since hierarchical context tides always exist
  const getToolAvailability = useCallback(
    (toolName: string) => {
      // All tools available since hierarchical tides (daily/weekly/monthly) always exist
      return { available: true, reason: "" };
    },
    [] // No dependencies - tools always available
  );

  // Handle tool selection with context-aware execution
  const handleToolSelect = useCallback(
    async (toolName: string, customParameters?: Record<string, any>) => {
      // All tools always available - no availability checking needed
      toggleToolMenu(); // Close menu first
      
      // Set tool execution state (disables context switching)
      setToolExecuting?.(true);

      try {
        // Handle special case for tide_smart_flow
        if (toolName === 'tide_smart_flow') {
          const contextTideId = getCurrentContextTideId?.();
          if (!contextTideId) {
            throw new Error('No context tide available');
          }
          
          // Import mcpService for smart flow
          const { mcpService } = await import('../services/mcpService');
          await mcpService.startSmartFlow();
          
          loggingService.info("ToolMenu", "Context-aware smart flow executed", {
            toolName,
            contextTideId,
            timeOfDay: new Date().toLocaleTimeString(),
          });
          
          sendMessage("🌊 Smart flow session started! Using current context tide with intelligent parameters.");
          return;
        }

        // Generate context-aware parameters for all tools
        const contextTideId = getCurrentContextTideId?.();
        
        // Use custom parameters or generate intelligent context-aware defaults
        const params = customParameters || generateDefaultParams(toolName);

        await executeMCPTool(toolName, params);

        loggingService.info("ToolMenu", "Context-aware MCP tool executed", {
          toolName,
          contextTideId,
          parameters: params,
          usedDefaults: !customParameters,
        });
      } catch (error) {
        loggingService.error(
          "ToolMenu",
          "Failed to execute context-aware tool",
          { error, toolName, parameters: customParameters }
        );
      } finally {
        // Re-enable context switching
        setToolExecuting?.(false);
      }
    },
    [
      toggleToolMenu,
      setToolExecuting,
      getCurrentContextTideId,
      executeMCPTool,
      generateDefaultParams,
      sendMessage,
    ]
  );

  return {
    // State
    showToolMenu,
    toolButtonActive,
    
    // Animation refs
    rotationAnim,
    menuHeightAnim,
    
    // Actions
    toggleToolMenu,
    generateDefaultParams,
    getToolAvailability,
    handleToolSelect,
  };
};