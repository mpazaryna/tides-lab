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
  activeTides: Tide[];
  tideId?: string;
  executeMCPTool: (toolName: string, params: Record<string, any>) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
}

export const useToolMenu = ({
  activeTides,
  tideId,
  executeMCPTool,
  sendMessage,
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

  // Smart parameter generation
  const generateDefaultParams = useCallback(
    (toolName: string) => {
      const now = new Date();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      switch (toolName) {
        case "createTide":
          return {
            name: `Tide ${dateString} ${timeString}`,
            description: `Created on ${dateString} at ${timeString}`,
            flowType: "daily",
          };
        case "startTideFlow":
          return activeTides.length > 0
            ? {
                tideId: activeTides[0].id,
                intensity: "moderate",
                duration: 25,
                initialEnergy: "moderate",
                workContext: "Quick flow session",
              }
            : null;
        case "addEnergyToTide":
          return activeTides.length > 0
            ? {
                tideId: activeTides[0].id,
                energyLevel: "moderate",
                context: `Energy added at ${timeString}`,
              }
            : null;
        case "linkTaskToTide":
          return activeTides.length > 0
            ? {
                tideId: activeTides[0].id,
                taskUrl: `https://example.com/task-${Date.now()}`,
                taskTitle: `Task created ${timeString}`,
                taskType: "general",
              }
            : null;
        case "getTaskLinks":
          return activeTides.length > 0
            ? {
                tideId: activeTides[0].id,
              }
            : null;
        case "getTideReport":
          return activeTides.length > 0
            ? {
                tideId: activeTides[0].id,
                format: "summary",
              }
            : null;
        case "getTideParticipants":
          return {
            statusFilter: "active",
            limit: 10,
          };
        default:
          return {};
      }
    },
    [activeTides]
  );

  // Tool availability checking
  const getToolAvailability = useCallback(
    (toolName: string) => {
      switch (toolName) {
        case "createTide":
        case "getTideParticipants":
          return { available: true, reason: "" };
        case "startTideFlow":
        case "addEnergyToTide":
        case "linkTaskToTide":
        case "getTaskLinks":
        case "getTideReport":
          return activeTides.length > 0
            ? { available: true, reason: "" }
            : {
                available: false,
                reason: "No active tides available. Create a tide first.",
              };
        default:
          return { available: false, reason: "Unknown tool" };
      }
    },
    [activeTides]
  );

  // Handle tool selection with smart availability checking
  const handleToolSelect = useCallback(
    async (toolName: string, customParameters?: Record<string, any>) => {
      // Check if tool is available
      const availability = getToolAvailability(toolName);

      if (!availability.available) {
        // Show helpful message about what's missing
        sendMessage(availability.reason);
        toggleToolMenu();
        return;
      }

      toggleToolMenu(); // Close menu first

      try {
        // Use custom parameters, or generate smart defaults, or fall back to tide context
        const params =
          customParameters ||
          generateDefaultParams(toolName) ||
          (tideId ? { tideId } : {});

        await executeMCPTool(toolName, params);

        loggingService.info("ToolMenu", "MCP tool executed from menu", {
          toolName,
          tideId,
          parameters: params,
          usedDefaults: !customParameters,
        });
      } catch (error) {
        loggingService.error(
          "ToolMenu",
          "Failed to execute MCP tool from menu",
          { error, toolName, tideId, parameters: customParameters }
        );
      }
    },
    [
      toggleToolMenu,
      executeMCPTool,
      tideId,
      getToolAvailability,
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