import { useState, useCallback, useRef } from "react";
import { Animated } from "react-native";
// import type { Tide } from "../types"; // Unused import
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
  injectTemplate?: (template: string) => void;
}

export const useToolMenu = ({
  executeMCPTool,
  sendMessage: _sendMessage,
  getCurrentContextTideId,
  setToolExecuting,
  injectTemplate,
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
    (_toolName: string) => {
      // All tools available since hierarchical tides (daily/weekly/monthly) always exist
      return { available: true, reason: "" };
    },
    [] // No dependencies - tools always available
  );

  // Generate tool parameter template for intellisense-style input
  const generateToolTemplate = useCallback((toolName: string): string => {
    switch (toolName) {
      case 'tide_smart_flow':
        return '/flow [what: ___] [energy: ___] [duration: ___] [type: ___]';
      case 'tide_add_energy':
        return '/energy [level: ___] [context: ___]';
      case 'tide_link_task':
        return '/link [task: ___] [url: ___] [type: ___]';
      case 'tide_get_report':
        return '/report [period: ___] [format: ___]';
      default:
        return `/${toolName} [params: ___]`;
    }
  }, []);

  // Handle tool selection with template injection
  const handleToolSelect = useCallback(
    async (toolName: string, customParameters?: Record<string, any>) => {
      // All tools always available - no availability checking needed
      toggleToolMenu(); // Close menu first
      
      // For tide_smart_flow and other parameterized tools, inject template instead of executing
      if (toolName === 'tide_smart_flow' || 
          toolName === 'tide_add_energy' || 
          toolName === 'tide_link_task' ||
          toolName === 'tide_get_report') {
        
        const template = generateToolTemplate(toolName);
        
        loggingService.info("ToolMenu", "Injecting tool parameter template", {
          toolName,
          template,
        });
        
        // Inject template into chat input via callback (to be passed from parent)
        if (injectTemplate) {
          injectTemplate(template);
          return;
        }
      }

      // Set tool execution state (disables context switching)
      setToolExecuting?.(true);

      try {
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
      injectTemplate,
      generateToolTemplate,
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