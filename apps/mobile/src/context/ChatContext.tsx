import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { LoggingService } from "../services/LoggingService";
import { useAuth } from "./AuthContext";
import { useMCP } from "./MCPContext";
import type {
  ChatState,
  ChatAction,
  ChatMessage,
  MCPToolCall,
  AvailableMCPTool,
} from "../types/chat";

const initialChatState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  conversationContext: {
    userId: "",
    sessionId: "",
    activeConversationId: "",
    currentTideId: undefined,
    mcpConnectionStatus: false,
    agentConnectionStatus: false,
  },
  pendingToolCalls: [],
  agentStatus: "idle",
  connectionStatus: {
    mcp: false,
    agent: false,
  },
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        isLoading: false,
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

    case "SET_AGENT_STATUS":
      return {
        ...state,
        agentStatus: action.payload,
      };

    case "ADD_TOOL_CALL":
      return {
        ...state,
        pendingToolCalls: [...state.pendingToolCalls, action.payload],
      };

    case "UPDATE_TOOL_CALL":
      return {
        ...state,
        pendingToolCalls: state.pendingToolCalls.map((call) =>
          call.id === action.payload.id
            ? { ...call, ...action.payload.updates }
            : call
        ),
      };

    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        connectionStatus: action.payload,
      };

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        error: null,
      };

    case "SET_CONVERSATION_CONTEXT":
      return {
        ...state,
        conversationContext: {
          ...state.conversationContext,
          ...action.payload,
        },
      };

    case "RESET_CHAT":
      return {
        ...initialChatState,
        conversationContext: {
          ...initialChatState.conversationContext,
          userId: state.conversationContext.userId,
        },
      };

    default:
      return state;
  }
}

interface ChatContextType extends ChatState {
  // Message handling
  sendMessage: (content: string) => Promise<void>;
  sendToolMessage: (toolName: string, parameters: any) => Promise<void>;
  addSystemMessage: (content: string) => void;
  clearMessages: () => void;

  // Tool execution
  executeMCPTool: (toolName: string, parameters: any) => Promise<void>;
  getAvailableTools: () => AvailableMCPTool[];

  // Agent interaction
  sendAgentMessage: (message: string) => Promise<void>;

  // Connection management
  checkConnections: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const {
    isConnected: mcpConnected,
    createTide,
    startTideFlow,
    addEnergyToTide,
    getTideReport,
    linkTaskToTide,
    getTaskLinks,
    getTideParticipants,
  } = useMCP();
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  // Generate unique IDs for messages and tool calls
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Initialize conversation context when user changes
  useEffect(() => {
    if (user) {
      const sessionId = generateId();
      const conversationId = generateId();

      dispatch({
        type: "SET_CONVERSATION_CONTEXT",
        payload: {
          userId: user.id,
          sessionId,
          activeConversationId: conversationId,
          mcpConnectionStatus: mcpConnected,
        },
      });

      LoggingService.info(
        "ChatContext",
        "Conversation context initialized",
        { userId: user.id, sessionId, conversationId },
        "CHAT_001"
      );
    }
  }, [user, generateId, mcpConnected]);

  // Update connection statuses
  useEffect(() => {
    dispatch({
      type: "SET_CONNECTION_STATUS",
      payload: {
        mcp: mcpConnected,
        agent: false, // Will be updated when AgentService is implemented
      },
    });

    dispatch({
      type: "SET_CONVERSATION_CONTEXT",
      payload: {
        mcpConnectionStatus: mcpConnected,
      },
    });
  }, [mcpConnected]);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      const messageId = generateId();
      const userMessage: ChatMessage = {
        id: messageId,
        type: "user",
        content: content.trim(),
        timestamp: new Date(),
        metadata: {
          conversationId: state.conversationContext.activeConversationId,
          userId: state.conversationContext.userId,
        },
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_LOADING", payload: true });

      LoggingService.info(
        "ChatContext",
        "User message sent",
        { messageId, content: content.substring(0, 50) + "..." },
        "CHAT_002"
      );

      try {
        // Here we would implement message processing logic
        // For now, add a simple echo response
        const responseMessage: ChatMessage = {
          id: generateId(),
          type: "assistant",
          content: `I received your message: "${content}". Integration with MCP tools and agent is in progress.`,
          timestamp: new Date(),
          metadata: {
            conversationId: state.conversationContext.activeConversationId,
          },
        };

        dispatch({ type: "ADD_MESSAGE", payload: responseMessage });
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        LoggingService.error(
          "ChatContext",
          "Failed to process message",
          { error, messageId },
          "CHAT_003"
        );
        dispatch({ type: "SET_ERROR", payload: "Failed to process message" });
      }
    },
    [state.conversationContext, generateId]
  );

  const executeMCPTool = useCallback(
    async (toolName: string, parameters: any): Promise<void> => {
      const toolCallId = generateId();
      const toolCall: MCPToolCall = {
        id: toolCallId,
        name: toolName,
        parameters,
        timestamp: new Date(),
        status: "pending",
      };

      dispatch({ type: "ADD_TOOL_CALL", payload: toolCall });
      dispatch({ type: "SET_LOADING", payload: true });

      LoggingService.info(
        "ChatContext",
        "Executing MCP tool",
        { toolName, toolCallId, parameters },
        "CHAT_004"
      );

      try {
        dispatch({
          type: "UPDATE_TOOL_CALL",
          payload: { id: toolCallId, updates: { status: "executing" } },
        });

        let result: any;

        // Route to appropriate MCP tool based on name
        switch (toolName) {
          case "createTide":
            result = await createTide(
              parameters.name,
              parameters.description,
              parameters.flowType
            );
            break;
          case "startTideFlow":
            result = await startTideFlow(
              parameters.tideId,
              parameters.intensity,
              parameters.duration,
              parameters.initialEnergy,
              parameters.workContext
            );
            break;
          case "addEnergyToTide":
            result = await addEnergyToTide(
              parameters.tideId,
              parameters.energyLevel,
              parameters.context
            );
            break;
          case "getTideReport":
            result = await getTideReport(parameters.tideId, parameters.format);
            break;
          case "linkTaskToTide":
            result = await linkTaskToTide(
              parameters.tideId,
              parameters.taskUrl,
              parameters.taskTitle,
              parameters.taskType
            );
            break;
          case "getTaskLinks":
            result = await getTaskLinks(parameters.tideId);
            break;
          case "getTideParticipants":
            result = await getTideParticipants(
              parameters.statusFilter,
              parameters.dateFrom,
              parameters.dateTo,
              parameters.limit
            );
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }

        dispatch({
          type: "UPDATE_TOOL_CALL",
          payload: {
            id: toolCallId,
            updates: {
              status: "completed",
              result,
            },
          },
        });

        // Add tool result message
        const resultMessage: ChatMessage = {
          id: generateId(),
          type: "tool_result",
          content: `Tool "${toolName}" executed successfully`,
          timestamp: new Date(),
          metadata: {
            toolName,
            toolResult: result,
            conversationId: state.conversationContext.activeConversationId,
          },
        };

        dispatch({ type: "ADD_MESSAGE", payload: resultMessage });
        dispatch({ type: "SET_LOADING", payload: false });

        LoggingService.info(
          "ChatContext",
          "MCP tool executed successfully",
          { toolName, toolCallId, result },
          "CHAT_005"
        );
      } catch (error) {
        dispatch({
          type: "UPDATE_TOOL_CALL",
          payload: {
            id: toolCallId,
            updates: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
        });

        const errorMessage: ChatMessage = {
          id: generateId(),
          type: "system",
          content: `Tool execution failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          timestamp: new Date(),
          metadata: {
            toolName,
            error: true,
            conversationId: state.conversationContext.activeConversationId,
          },
        };

        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
        dispatch({
          type: "SET_ERROR",
          payload: `Failed to execute tool: ${toolName}`,
        });
        dispatch({ type: "SET_LOADING", payload: false });

        LoggingService.error(
          "ChatContext",
          "MCP tool execution failed",
          { error, toolName, toolCallId },
          "CHAT_006"
        );
      }
    },
    [
      state.conversationContext,
      generateId,
      createTide,
      startTideFlow,
      addEnergyToTide,
      getTideReport,
      linkTaskToTide,
      getTaskLinks,
      getTideParticipants,
    ]
  );

  const sendToolMessage = useCallback(
    async (toolName: string, parameters: any): Promise<void> => {
      // Add user message for tool execution request
      const userMessage: ChatMessage = {
        id: generateId(),
        type: "user",
        content: `Execute tool: ${toolName}`,
        timestamp: new Date(),
        metadata: {
          toolName,
          conversationId: state.conversationContext.activeConversationId,
        },
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

      // Execute the tool
      await executeMCPTool(toolName, parameters);
    },
    [state.conversationContext, generateId, executeMCPTool]
  );

  const addSystemMessage = useCallback(
    (content: string): void => {
      const systemMessage: ChatMessage = {
        id: generateId(),
        type: "system",
        content,
        timestamp: new Date(),
        metadata: {
          conversationId: state.conversationContext.activeConversationId,
        },
      };

      dispatch({ type: "ADD_MESSAGE", payload: systemMessage });

      LoggingService.info(
        "ChatContext",
        "System message added",
        { content },
        "CHAT_007"
      );
    },
    [state.conversationContext, generateId]
  );

  const clearMessages = useCallback((): void => {
    dispatch({ type: "CLEAR_MESSAGES" });

    LoggingService.info("ChatContext", "Messages cleared", {}, "CHAT_008");
  }, []);

  const getAvailableTools = useCallback((): AvailableMCPTool[] => {
    return [
      {
        name: "createTide",
        description: "Create a new tide workflow",
        parameters: [
          {
            name: "name",
            type: "string",
            required: true,
            description: "Name of the tide",
          },
          {
            name: "description",
            type: "string",
            required: false,
            description: "Description of the tide",
          },
          {
            name: "flowType",
            type: "string",
            required: false,
            description: "Type of flow: daily, weekly, project, seasonal",
          },
        ],
      },
      {
        name: "startTideFlow",
        description: "Start a flow session for a tide",
        parameters: [
          {
            name: "tideId",
            type: "string",
            required: true,
            description: "ID of the tide",
          },
          {
            name: "intensity",
            type: "string",
            required: false,
            description: "Flow intensity: low, moderate, high",
          },
          {
            name: "duration",
            type: "number",
            required: false,
            description: "Duration in minutes",
          },
          {
            name: "initialEnergy",
            type: "string",
            required: false,
            description: "Initial energy level: low, medium, high",
          },
          {
            name: "workContext",
            type: "string",
            required: false,
            description: "Context for the work session",
          },
        ],
      },
      {
        name: "addEnergyToTide",
        description: "Add energy measurement to a tide",
        parameters: [
          {
            name: "tideId",
            type: "string",
            required: true,
            description: "ID of the tide",
          },
          {
            name: "energyLevel",
            type: "string",
            required: true,
            description: "Energy level: low, medium, high",
          },
          {
            name: "context",
            type: "string",
            required: false,
            description: "Context for the energy update",
          },
        ],
      },
      {
        name: "getTideReport",
        description: "Get a report for a tide",
        parameters: [
          {
            name: "tideId",
            type: "string",
            required: true,
            description: "ID of the tide",
          },
          {
            name: "format",
            type: "string",
            required: false,
            description: "Report format: json, markdown, csv",
          },
        ],
      },
      {
        name: "linkTaskToTide",
        description: "Link an external task to a tide",
        parameters: [
          {
            name: "tideId",
            type: "string",
            required: true,
            description: "ID of the tide",
          },
          {
            name: "taskUrl",
            type: "string",
            required: true,
            description: "URL of the task",
          },
          {
            name: "taskTitle",
            type: "string",
            required: true,
            description: "Title of the task",
          },
          {
            name: "taskType",
            type: "string",
            required: false,
            description: "Type of task",
          },
        ],
      },
      {
        name: "getTaskLinks",
        description: "Get all task links for a tide",
        parameters: [
          {
            name: "tideId",
            type: "string",
            required: true,
            description: "ID of the tide",
          },
        ],
      },
      {
        name: "getTideParticipants",
        description: "Get tide participants information",
        parameters: [
          {
            name: "statusFilter",
            type: "string",
            required: false,
            description: "Filter by status",
          },
          {
            name: "dateFrom",
            type: "string",
            required: false,
            description: "Start date filter",
          },
          {
            name: "dateTo",
            type: "string",
            required: false,
            description: "End date filter",
          },
          {
            name: "limit",
            type: "number",
            required: false,
            description: "Limit number of results",
          },
        ],
      },
    ];
  }, []);

  const sendAgentMessage = useCallback(
    async (message: string): Promise<void> => {
      // Placeholder for agent integration - will be implemented with AgentService
      LoggingService.info(
        "ChatContext",
        "Agent message sent (placeholder)",
        { message },
        "CHAT_009"
      );

      addSystemMessage("Agent integration is not yet implemented");
    },
    [addSystemMessage]
  );

  const checkConnections = useCallback(async (): Promise<void> => {
    LoggingService.info("ChatContext", "Checking connections", {}, "CHAT_010");

    try {
      // MCP connection is already handled by MCPContext
      // Agent connection will be implemented with AgentService

      dispatch({
        type: "SET_CONNECTION_STATUS",
        payload: {
          mcp: mcpConnected,
          agent: false, // Placeholder
        },
      });
    } catch (error) {
      LoggingService.error(
        "ChatContext",
        "Failed to check connections",
        { error },
        "CHAT_011"
      );
      dispatch({ type: "SET_ERROR", payload: "Failed to check connections" });
    }
  }, [mcpConnected]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ChatContextType>(
    () => ({
      ...state,
      sendMessage,
      sendToolMessage,
      addSystemMessage,
      clearMessages,
      executeMCPTool,
      getAvailableTools,
      sendAgentMessage,
      checkConnections,
    }),
    [
      state,
      sendMessage,
      sendToolMessage,
      addSystemMessage,
      clearMessages,
      executeMCPTool,
      getAvailableTools,
      sendAgentMessage,
      checkConnections,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
