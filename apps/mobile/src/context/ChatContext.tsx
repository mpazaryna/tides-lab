import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { agentService } from "../services/agentService";
import { useAuth } from "./AuthContext";
import { useMCP } from "./MCPContext";
import { extractUserIdFromApiKey } from "../utils/apiKeyUtils";
import type {
  ChatState,
  ChatAction,
  ChatMessage,
  MCPToolCall,
  AvailableMCPTool,
} from "../types/chat";
import { loggingService } from "../services/loggingService";

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
  sendAgentMessage: (
    message: string,
    context?: { tideId?: string }
  ) => Promise<void>;

  // Connection management
  checkConnections: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { apiKey } = useAuth();
  const {
    isConnected: mcpConnected,
    createTide,
    startTideFlow,
    addEnergyToTide,
    getTideReport,
    linkTaskToTide,
    getTaskLinks,
    getTideParticipants,
    refreshTides,
    tides,
    getCurrentServerUrl,
  } = useMCP();
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  // Generate unique IDs for messages and tool calls
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Initialize conversation context when API key changes
  useEffect(() => {
    if (apiKey) {
      const userId = extractUserIdFromApiKey(apiKey);
      if (userId) {
        const sessionId = generateId();
        const conversationId = generateId();

        dispatch({
          type: "SET_CONVERSATION_CONTEXT",
          payload: {
            userId,
            sessionId,
            activeConversationId: conversationId,
            mcpConnectionStatus: mcpConnected,
          },
        });

        loggingService.info("ChatContext", "Conversation context initialized", {
          userId,
          sessionId,
          conversationId,
        });
      } else {
        loggingService.warn("ChatContext", "Could not extract user ID from API key", {
          apiKeyPrefix: apiKey.substring(0, 15) + '...'
        });
      }
    }
  }, [apiKey, generateId, mcpConnected]);

  // Configure agentService with current server URL and MCP tool executor
  useEffect(() => {
    if (getCurrentServerUrl) {
      agentService.setUrlProvider(getCurrentServerUrl);
      loggingService.info("ChatContext", "AgentService configured with MCP URL provider");
    }
  }, [getCurrentServerUrl]);


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

      loggingService.info("ChatContext", "Executing MCP tool", {
        toolName,
        toolCallId,
        parameters,
      });

      try {
        dispatch({
          type: "UPDATE_TOOL_CALL",
          payload: { id: toolCallId, updates: { status: "executing" } },
        });

        let result: any;

        // Route to appropriate MCP tool based on name
        switch (toolName) {
          case "tide_create":
          case "createTide":
            result = await createTide(
              parameters.name,
              parameters.description,
              parameters.flowType
            );
            break;
          case "tide_flow":
          case "startTideFlow":
            result = await startTideFlow(
              parameters.tideId,
              parameters.intensity,
              parameters.duration,
              parameters.initialEnergy,
              parameters.workContext
            );
            break;
          case "tide_add_energy":
          case "addEnergyToTide":
            result = await addEnergyToTide(
              parameters.tideId,
              parameters.energyLevel,
              parameters.context
            );
            break;
          case "tide_get_report":
          case "getTideReport":
            result = await getTideReport(parameters.tideId, parameters.format);
            break;
          case "tide_link_task":
          case "linkTaskToTide":
            result = await linkTaskToTide(
              parameters.tideId,
              parameters.taskUrl,
              parameters.taskTitle,
              parameters.taskType
            );
            break;
          case "tide_list_task_links":
          case "getTaskLinks":
            result = await getTaskLinks(parameters.tideId);
            break;
          case "tides_get_participants":
          case "getTideParticipants":
            result = await getTideParticipants(
              parameters.statusFilter,
              parameters.dateFrom,
              parameters.dateTo,
              parameters.limit
            );
            break;
          case "tide_list":
            // Refresh tides and return the current list
            await refreshTides();
            result = { 
              tides: tides,
              message: `Found ${tides.length} tides`,
              count: tides.length
            };
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

        loggingService.info("ChatContext", "MCP tool executed successfully", {
          toolName,
          toolCallId,
          result,
        });
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

        loggingService.error("ChatContext", "MCP tool execution failed", {
          error,
          toolName,
          toolCallId,
        });
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
      refreshTides,
      tides,
    ]
  );

  // Configure agentService with MCP tool execution capability
  useEffect(() => {
    // Create a tool executor that uses our existing executeMCPTool function
    const mcpToolExecutor = async (toolName: string, parameters: any) => {
      // Execute the tool using existing MCP infrastructure
      return await executeMCPTool(toolName, parameters);
    };

    agentService.setMCPToolExecutor(mcpToolExecutor);
    loggingService.info("ChatContext", "AgentService configured with MCP tool executor");
  }, [executeMCPTool]);

  // Handle slash commands for direct tool execution
  const handleSlashCommand = useCallback(
    async (command: string): Promise<void> => {
      const parts = command.substring(1).split(' '); // Remove '/' and split
      const toolName = parts[0];
      const args = parts.slice(1);

      loggingService.info("ChatContext", "Processing slash command", {
        toolName,
        argsCount: args.length,
      });

      // Map slash commands to tool names
      let mappedTool: string | undefined;
      
      // Handle different command patterns
      if (toolName === 'tide') {
        switch (args[0]) {
          case 'create':
            mappedTool = 'tide_create';
            break;
          case 'list':
            mappedTool = 'tide_list';
            break;
          case 'report':
            mappedTool = 'tide_get_report';
            break;
          case 'flow':
            mappedTool = 'tide_flow';
            break;
          default:
            // If no valid subcommand, show error
            mappedTool = undefined;
        }
      } else if (toolName === 'task') {
        switch (args[0]) {
          case 'link':
            mappedTool = 'tide_link_task';
            break;
          case 'list':
            mappedTool = 'tide_list_task_links';
            break;
          default:
            mappedTool = undefined;
        }
      } else if (toolName === 'energy') {
        mappedTool = 'tide_add_energy';
      } else if (toolName === 'participants') {
        mappedTool = 'tides_get_participants';
      } else if (toolName === 'help') {
        mappedTool = 'help';
      }
      
      if (mappedTool === 'help') {
        const helpMessage: ChatMessage = {
          id: generateId(),
          type: "system",
          content: `Available commands:
• /tide list - Show all your tides
• /tide create [name] - Create a new tide
• /tide report [id] - Get tide report
• /tide flow [id] - Start flow session
• /energy [level] - Add energy (low/medium/high) to most recent tide
• /energy [level] [tideId] - Add energy to specific tide
• /task link [tideId] [url] [title] - Link task to tide
• /task list [tideId] - List linked tasks
• /participants - Get tide participants
• Just type naturally - I can understand regular conversation too!`,
          timestamp: new Date(),
          metadata: {
            conversationId: state.conversationContext.activeConversationId,
            helpCommand: true,
          },
        };
        dispatch({ type: "ADD_MESSAGE", payload: helpMessage });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      if (mappedTool) {
        // Build parameters based on the command
        let parameters: any = {};
        
        if (mappedTool === 'tide_create') {
          parameters = {
            name: args.slice(1).join(' ') || 'New Tide',
            description: `Created via chat command`,
            flowType: 'daily'
          };
        } else if (mappedTool === 'tide_get_report' && args[1]) {
          parameters = {
            tideId: args[1],
            format: 'json'
          };
        } else if (mappedTool === 'tide_add_energy') {
          // Check if user provided a tide ID as second argument
          let tideId = args[1];
          let energyLevel = args[0];
          
          // If no tide ID provided, try to use the first available tide
          if (!tideId) {
            if (state.conversationContext.currentTideId) {
              tideId = state.conversationContext.currentTideId;
            } else if (tides && tides.length > 0) {
              // Use the most recent tide
              tideId = tides[0].id;
              loggingService.info("ChatContext", "Using most recent tide for energy update", {
                tideId,
                tideName: tides[0].name
              });
            } else {
              // No tides available
              const errorMessage: ChatMessage = {
                id: generateId(),
                type: "system",
                content: `No active tides found. Please create a tide first using '/tide create [name]' or specify a tide ID: '/energy [level] [tideId]'`,
                timestamp: new Date(),
                metadata: {
                  conversationId: state.conversationContext.activeConversationId,
                  error: true,
                },
              };
              dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
              dispatch({ type: "SET_LOADING", payload: false });
              return;
            }
          }
          
          parameters = {
            tideId: tideId,
            energyLevel: energyLevel || 'medium',
            context: 'Chat command'
          };
        } else if (mappedTool === 'tide_flow' && args[1]) {
          parameters = {
            tideId: args[1],
            intensity: 'moderate',
            duration: 25
          };
        } else if (mappedTool === 'tide_link_task' && args[1]) {
          parameters = {
            tideId: args[1],
            taskUrl: args[2] || 'https://example.com/task',
            taskTitle: args.slice(3).join(' ') || 'Task',
            taskType: 'general'
          };
        } else if (mappedTool === 'tide_list_task_links' && args[1]) {
          parameters = {
            tideId: args[1]
          };
        } else if (mappedTool === 'tides_get_participants') {
          parameters = {
            limit: 10
          };
        }

        await executeMCPTool(mappedTool, parameters);
      } else {
        // Provide more specific error messages for known commands with invalid subcommands
        let errorContent = `Unknown command: /${toolName}`;
        
        if (toolName === 'tide' && args[0]) {
          errorContent = `Invalid tide subcommand: '${args[0]}'. Valid options are: create, list, report, flow`;
        } else if (toolName === 'task' && args[0]) {
          errorContent = `Invalid task subcommand: '${args[0]}'. Valid options are: link, list`;
        } else if (!mappedTool) {
          errorContent = `Unknown command: /${command.substring(1).split(' ')[0]}. Type '/help' to see available commands.`;
        }
        
        const errorMessage: ChatMessage = {
          id: generateId(),
          type: "system",
          content: errorContent,
          timestamp: new Date(),
          metadata: {
            conversationId: state.conversationContext.activeConversationId,
            error: true,
          },
        };
        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.conversationContext, generateId, executeMCPTool, tides]
  );

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

      loggingService.info("ChatContext", "Processing message with AI enhancement", {
        messageId,
        content: content.substring(0, 50) + "...",
      });

      try {
        // Check if message starts with slash command
        if (content.startsWith('/')) {
          loggingService.info("ChatContext", "Detected slash command, routing to handleSlashCommand", {
            command: content
          });
          try {
            await handleSlashCommand(content);
            return;
          } catch (slashError) {
            loggingService.error("ChatContext", "Slash command failed, falling back to AI", {
              error: slashError,
              command: content
            });
            // Don't return - let it fall through to AI processing
          }
        }

        // Use enhanced agent service for natural language processing
        try {
          const agentResponse = await agentService.sendMessage(content, {
            tideId: state.conversationContext.currentTideId,
          });

          const assistantMessage: ChatMessage = {
            id: generateId(),
            type: "assistant",
            content: agentResponse.content,
            timestamp: new Date(),
            metadata: {
              conversationId: state.conversationContext.activeConversationId,
              agentResponse: true,
              agentId: agentResponse.agentId,
              responseType: agentResponse.type,
              suggestedTools: agentResponse.suggestedTools,
            },
          };

          dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });

          // If the agent suggested a tool call, show suggestions
          if (agentResponse.toolCall) {
            const toolSuggestionMessage: ChatMessage = {
              id: generateId(),
              type: "system",
              content: `I can execute "${agentResponse.toolCall.name}" for you. Would you like me to proceed?`,
              timestamp: new Date(),
              metadata: {
                conversationId: state.conversationContext.activeConversationId,
                toolSuggestion: agentResponse.toolCall,
              },
            };
            dispatch({ type: "ADD_MESSAGE", payload: toolSuggestionMessage });
          }

        } catch (agentError) {
          loggingService.warn("ChatContext", "Agent service unavailable, using fallback", agentError);
          
          // Fallback to basic response
          const fallbackMessage: ChatMessage = {
            id: generateId(),
            type: "assistant",
            content: `I understand your message about "${content}". I'm having trouble accessing my AI analysis tools right now. You can use direct commands like '/tide list' or '/tide create' to manage your flows.`,
            timestamp: new Date(),
            metadata: {
              conversationId: state.conversationContext.activeConversationId,
              fallbackResponse: true,
            },
          };
          dispatch({ type: "ADD_MESSAGE", payload: fallbackMessage });
        }

        dispatch({ type: "SET_LOADING", payload: false });
        
      } catch (error) {
        loggingService.error("ChatContext", "Failed to process message", {
          error,
          messageId,
        });
        
        const errorMessage: ChatMessage = {
          id: generateId(),
          type: "system",
          content: "I'm having trouble processing your message right now. Please try again or use direct commands like '/tide list'.",
          timestamp: new Date(),
          metadata: {
            conversationId: state.conversationContext.activeConversationId,
            error: true,
          },
        };
        
        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
        dispatch({ type: "SET_ERROR", payload: "Failed to process message" });
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.conversationContext, generateId, handleSlashCommand]
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

      loggingService.info("ChatContext", "System message added", { content });
    },
    [state.conversationContext, generateId]
  );

  const clearMessages = useCallback((): void => {
    dispatch({ type: "CLEAR_MESSAGES" });

    loggingService.info("ChatContext", "Messages cleared", {});
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
    async (message: string, context?: { tideId?: string }): Promise<void> => {
      if (!message.trim()) return;

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: generateId(),
        type: "user",
        content: `${message.trim()}`,
        timestamp: new Date(),
        metadata: {
          conversationId: state.conversationContext.activeConversationId,
          userId: state.conversationContext.userId,
          isAgentMessage: true,
        },
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_AGENT_STATUS", payload: "thinking" });
      dispatch({ type: "SET_LOADING", payload: true });

      loggingService.info("ChatContext", "Sending message to agent", {
        message: message.substring(0, 50) + "...",
        tideId: context?.tideId,
      });

      try {
        // Send message to agent service with tide context
        const agentResponse = await agentService.sendMessage(message, context);

        // Add successful agent response
        const assistantMessage: ChatMessage = {
          id: generateId(),
          type: "assistant",
          content: agentResponse.content,
          timestamp: new Date(),
          metadata: {
            conversationId: state.conversationContext.activeConversationId,
            agentResponse: true,
            agentId: agentResponse.agentId,
            responseType: agentResponse.type,
          },
        };

        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
        dispatch({ type: "SET_AGENT_STATUS", payload: "idle" });
      } catch (error) {
        loggingService.error("ChatContext", "Failed to send message to agent", {
          error,
          message: message.substring(0, 50),
        });

        const errorMessage: ChatMessage = {
          id: generateId(),
          type: "system",
          content: `Failed to communicate with agent: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          timestamp: new Date(),
          metadata: {
            conversationId: state.conversationContext.activeConversationId,
            error: true,
          },
        };

        dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
        dispatch({ type: "SET_AGENT_STATUS", payload: "idle" });
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to communicate with agent",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.conversationContext, generateId]
  );

  const checkConnections = useCallback(async (): Promise<void> => {
    loggingService.info("ChatContext", "Checking connections", {});

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
      loggingService.error("ChatContext", "Failed to check connections", {
        error,
      });
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
