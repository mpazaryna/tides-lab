import { LoggingService } from "./LoggingService";
import { AuthService } from "./authService";
import type { AgentServiceConfig, AgentMessage } from "../types/chat";

export class AgentService {
  private static instance: AgentService | null = null;
  private serviceName = "AgentService";
  private config: AgentServiceConfig;
  private webSocket: WebSocket | null = null;
  private connectionAttempts = 0;
  private messageHandlers: ((message: AgentMessage) => void)[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Default configuration - will be updated based on environment
    this.config = {
      agentEndpoint: "",
      webSocketEndpoint: "",
      retryAttempts: 3,
      timeoutMs: 30000,
    };
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = this.config.timeoutMs
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      LoggingService.info(
        this.serviceName,
        "Getting authentication headers",
        {},
        "AGENT_AUTH_003"
      );
      
      const apiKey = await AuthService.getApiKey();
      
      LoggingService.info(
        this.serviceName,
        "Retrieved API key",
        { hasApiKey: !!apiKey, keyLength: apiKey?.length || 0 },
        "AGENT_AUTH_004"
      );
      
      if (!apiKey) {
        LoggingService.warn(
          this.serviceName,
          "No API key available for agent authentication",
          {},
          "AGENT_AUTH_001"
        );
        return {};
      }
      
      return {
        Authorization: `Bearer ${apiKey}`,
      };
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to get authentication headers",
        { error, errorMessage: error?.message, errorStack: error?.stack },
        "AGENT_AUTH_002"
      );
      return {};
    }
  }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  public async initialize(serverUrl: string): Promise<void> {
    try {
      LoggingService.info(
        this.serviceName,
        "Initializing AgentService",
        { serverUrl },
        "AGENT_001"
      );

      // Configure endpoints based on server URL
      this.config = {
        ...this.config,
        agentEndpoint: `${serverUrl}/agents/tide-productivity`,
        webSocketEndpoint: `${serverUrl
          .replace("https://", "wss://")
          .replace("http://", "ws://")}/agents/tide-productivity/ws`,
      };

      LoggingService.info(
        this.serviceName,
        "AgentService initialized",
        { config: this.config },
        "AGENT_002"
      );
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to initialize AgentService",
        { error, serverUrl },
        "AGENT_003"
      );
      throw error;
    }
  }

  public async checkStatus(): Promise<{ status: string; connected: boolean }> {
    try {
      LoggingService.info(
        this.serviceName,
        "Checking agent status",
        {},
        "AGENT_004"
      );

      const authHeaders = await this.getAuthHeaders();

      const response = await this.fetchWithTimeout(
        `${this.config.agentEndpoint}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Agent status check failed: ${response.status} ${response.statusText}`
        );
      }

      const status = await response.json();

      LoggingService.info(
        this.serviceName,
        "Agent status retrieved",
        { status },
        "AGENT_005"
      );

      return {
        status: status.status || "unknown",
        connected: status.status === "healthy",
      };
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to check agent status",
        { error },
        "AGENT_006"
      );

      return {
        status: "error",
        connected: false,
      };
    }
  }

  public async sendMessage(
    message: string,
    context?: any
  ): Promise<AgentMessage> {
    try {
      LoggingService.info(
        this.serviceName,
        "Sending message to agent",
        { message: message.substring(0, 100) + "...", hasContext: !!context },
        "AGENT_007"
      );

      // Get user ID from auth service
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // If we have active tides in context but no specific tideId, 
      // use the first active tide to help the agent
      const effectiveTideId = context?.tideId || 
        (context?.activeTides && context.activeTides.length > 0 ? context.activeTides[0].id : undefined);

      const requestBody = {
        question: message,
        userId: user.id,
        tideId: effectiveTideId,
        context: context || {},  // Send the full context object
      };

      // Log what we're sending to help debug
      LoggingService.info(
        this.serviceName,
        "Sending request to agent server",
        { 
          endpoint: `${this.config.agentEndpoint}/question`,
          hasContext: !!context,
          contextKeys: context ? Object.keys(context) : [],
          activeTidesCount: context?.activeTides?.length || 0
        },
        "AGENT_007A"
      );

      const authHeaders = await this.getAuthHeaders();

      const response = await this.fetchWithTimeout(
        `${this.config.agentEndpoint}/question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Agent request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      // Log the raw response to debug what format we're receiving
      LoggingService.info(
        this.serviceName,
        "Raw agent server response",
        { 
          result: JSON.stringify(result, null, 2),
          resultType: typeof result,
          resultKeys: typeof result === 'object' ? Object.keys(result) : []
        },
        "AGENT_007B"
      );

      // Check if this is a special debug command
      const isDebugCommand = message.toLowerCase().includes("show_me_the_money");
      
      // Extract the actual response content from various possible fields
      let content = "";
      if (isDebugCommand) {
        // Show full raw response for debug command
        content = `**Full Agent Response:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
      } else {
        // Normal response - extract content from the actual agent response format
        if (typeof result === "string") {
          content = result;
        } else if (result.result && result.result.analysis) {
          // NEW: Tides agent format: { success: true, result: { analysis: "...", confidence: 0.75, ... } }
          content = result.result.analysis;
        } else if (result.result && result.result.message) {
          // Tides agent format: { success: true, result: { message: "..." } }
          content = result.result.message;
        } else if (result.message) {
          content = result.message;
        } else if (result.response) {
          content = result.response;
        } else if (result.answer) {
          content = result.answer;
        } else if (result.insights) {
          content = result.insights;
        } else if (result.data && typeof result.data === "string") {
          content = result.data;
        } else if (result.content) {
          content = result.content;
        } else {
          // Fallback to showing a clean message
          content = "I received your request and processed it successfully.";
        }
      }

      const agentMessage: AgentMessage = {
        id: `agent-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        type: "response",
        content: content,
        timestamp: new Date(),
        agentId: result.agentId,
        toolCalls: result.toolCalls || [],
        thinking: false,
      };

      LoggingService.info(
        this.serviceName,
        "Agent response received",
        {
          messageId: agentMessage.id,
          responseLength: agentMessage.content.length,
          toolCallsCount: agentMessage.toolCalls?.length || 0,
          content: agentMessage.content,
        },
        "AGENT_008"
      );

      return agentMessage;
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to send message to agent",
        { error, message: message.substring(0, 100) },
        "AGENT_009"
      );

      // Return error message as agent response
      return {
        id: `agent-error-${Date.now()}`,
        type: "response",
        content: `Agent communication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
        thinking: false,
      };
    }
  }

  public async getInsights(tideId?: string): Promise<AgentMessage> {
    try {
      LoggingService.info(
        this.serviceName,
        "Requesting insights from agent",
        { tideId },
        "AGENT_010"
      );

      // Get user ID from auth service
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const requestBody = {
        userId: user.id,
      };

      const authHeaders = await this.getAuthHeaders();

      const response = await this.fetchWithTimeout(
        `${this.config.agentEndpoint}/insights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Insights request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      const agentMessage: AgentMessage = {
        id: `insights-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        type: "response",
        content: result.insights || result.message || "No insights available",
        timestamp: new Date(),
        agentId: result.agentId,
        toolCalls: result.toolCalls || [],
        thinking: false,
      };

      LoggingService.info(
        this.serviceName,
        "Agent insights received",
        { messageId: agentMessage.id, tideId },
        "AGENT_011"
      );

      return agentMessage;
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to get insights from agent",
        { error, tideId },
        "AGENT_012"
      );

      return {
        id: `insights-error-${Date.now()}`,
        type: "response",
        content: `Failed to get insights: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
        thinking: false,
      };
    }
  }

  public async optimizeTide(
    tideId: string,
    preferences?: any
  ): Promise<AgentMessage> {
    try {
      LoggingService.info(
        this.serviceName,
        "Requesting optimization from agent",
        { tideId, hasPreferences: !!preferences },
        "AGENT_013"
      );

      // Get user ID from auth service
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const requestBody = {
        userId: user.id,
        preferences: preferences || {},
      };

      const authHeaders = await this.getAuthHeaders();

      const response = await this.fetchWithTimeout(
        `${this.config.agentEndpoint}/optimize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Optimization request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      const agentMessage: AgentMessage = {
        id: `optimize-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        type: "response",
        content:
          result.optimization ||
          result.message ||
          "No optimization suggestions available",
        timestamp: new Date(),
        agentId: result.agentId,
        toolCalls: result.toolCalls || [],
        thinking: false,
      };

      LoggingService.info(
        this.serviceName,
        "Agent optimization received",
        { messageId: agentMessage.id, tideId },
        "AGENT_014"
      );

      return agentMessage;
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to get optimization from agent",
        { error, tideId },
        "AGENT_015"
      );

      return {
        id: `optimize-error-${Date.now()}`,
        type: "response",
        content: `Failed to get optimization: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
        thinking: false,
      };
    }
  }

  public connectWebSocket(): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      LoggingService.info(
        this.serviceName,
        "WebSocket already connected",
        {},
        "AGENT_016"
      );
      return;
    }

    try {
      LoggingService.info(
        this.serviceName,
        "Connecting to agent WebSocket",
        { endpoint: this.config.webSocketEndpoint },
        "AGENT_017"
      );

      this.webSocket = new WebSocket(this.config.webSocketEndpoint || "");

      this.webSocket.onopen = () => {
        LoggingService.info(
          this.serviceName,
          "WebSocket connected to agent",
          {},
          "AGENT_018"
        );
        this.connectionAttempts = 0;
      };

      this.webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const agentMessage: AgentMessage = {
            id: `ws-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 11)}`,
            type: data.type || "response",
            content: data.content || data.message || "",
            timestamp: new Date(),
            agentId: data.agentId,
            toolCalls: data.toolCalls || [],
            thinking: data.thinking || false,
          };

          // Notify all message handlers
          this.messageHandlers.forEach((handler) => handler(agentMessage));

          LoggingService.info(
            this.serviceName,
            "WebSocket message received from agent",
            { messageType: agentMessage.type, messageId: agentMessage.id },
            "AGENT_019"
          );
        } catch (error) {
          LoggingService.error(
            this.serviceName,
            "Failed to parse WebSocket message",
            { error, data: event.data },
            "AGENT_020"
          );
        }
      };

      this.webSocket.onclose = () => {
        LoggingService.info(
          this.serviceName,
          "WebSocket disconnected from agent",
          { connectionAttempts: this.connectionAttempts },
          "AGENT_021"
        );

        // Attempt to reconnect if not intentionally closed
        if (this.connectionAttempts < this.config.retryAttempts) {
          this.connectionAttempts++;
          this.reconnectTimer = setTimeout(() => {
            this.connectWebSocket();
          }, 1000 * this.connectionAttempts);
        }
      };

      this.webSocket.onerror = (error) => {
        LoggingService.error(
          this.serviceName,
          "WebSocket error",
          { error },
          "AGENT_022"
        );
      };
    } catch (error) {
      LoggingService.error(
        this.serviceName,
        "Failed to connect WebSocket",
        { error },
        "AGENT_023"
      );
    }
  }

  public disconnectWebSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;

      LoggingService.info(
        this.serviceName,
        "WebSocket disconnected",
        {},
        "AGENT_024"
      );
    }
  }

  public onMessage(handler: (message: AgentMessage) => void): () => void {
    this.messageHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  public isConnected(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  public updateConfig(newConfig: Partial<AgentServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    LoggingService.info(
      this.serviceName,
      "Agent service config updated",
      { config: this.config },
      "AGENT_025"
    );
  }
}

// Export singleton instance
export const agentService = AgentService.getInstance();
