export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system" | "tool_result";
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  toolName?: string;
  toolResult?: any;
  agentThinking?: boolean;
  error?: boolean;
  conversationId?: string;
  userId?: string;
}

export interface MCPToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  timestamp: Date;
  status: "pending" | "executing" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface AgentMessage {
  id: string;
  type: "request" | "response" | "status";
  content: string;
  timestamp: Date;
  agentId?: string;
  toolCalls?: MCPToolCall[];
  thinking?: boolean;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  activeConversationId: string;
  currentTideId?: string;
  mcpConnectionStatus: boolean;
  agentConnectionStatus: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationContext: ConversationContext;
  pendingToolCalls: MCPToolCall[];
  agentStatus: "idle" | "thinking" | "executing" | "responding";
  connectionStatus: {
    mcp: boolean;
    agent: boolean;
  };
}

export type ChatAction =
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_AGENT_STATUS"; payload: ChatState["agentStatus"] }
  | { type: "ADD_TOOL_CALL"; payload: MCPToolCall }
  | {
      type: "UPDATE_TOOL_CALL";
      payload: { id: string; updates: Partial<MCPToolCall> };
    }
  | { type: "SET_CONNECTION_STATUS"; payload: { mcp: boolean; agent: boolean } }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_CONVERSATION_CONTEXT"; payload: Partial<ConversationContext> }
  | { type: "RESET_CHAT" };

export interface AvailableMCPTool {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface AgentServiceConfig {
  agentEndpoint: string;
  webSocketEndpoint?: string;
  retryAttempts: number;
  timeoutMs: number;
}

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onExecuteTool: (toolName: string, parameters: any) => void;
  isLoading?: boolean;
  availableTools?: AvailableMCPTool[];
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

export interface ToolExecutionProps {
  toolCall: MCPToolCall;
  onRetry?: () => void;
  onCancel?: () => void;
}
