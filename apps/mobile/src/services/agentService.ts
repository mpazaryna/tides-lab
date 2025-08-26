import { authService } from "./authService";
import { loggingService } from "./loggingService";
import { extractUserIdFromApiKey } from "../utils/apiKeyUtils";

export interface TideContext {
  tideId?: string;
  workContext?: string;
  userPreferences?: Record<string, any>;
}

export interface AgentResponse {
  content: string;
  message: string;
  agentId?: string;
  type?: string;
  data?: any;
  timestamp: string;
  suggestedTools?: string[];
  toolCall?: {
    name: string;
    parameters: Record<string, any>;
    confidence: number;
  };
}

export interface AgentStatus {
  isHealthy: boolean;
  status: string;
  connected: boolean;
  version?: string;
  lastCheck: string;
}

export interface AgentInsights {
  insights: string[];
  recommendations?: string[];
  score?: number;
}

export interface AgentOptimization {
  optimizations: string[];
  estimated_improvement?: string;
  tideId: string;
}

export interface AgentPreferences {
  preferences: Record<string, any>;
  updated: boolean;
  timestamp: string;
}

class AgentService {
  private readonly SERVICE_NAME = "AgentService";
  private sessionId: string | null = null;
  private conversationId: string | null = null;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private getServerUrl: (() => string) | null = null;
  private mcpToolExecutor: ((toolName: string, parameters: any) => Promise<any>) | null = null;
  private readonly AI_ENDPOINTS = {
    conversation: "/ai/conversation",
    classification: "/ai/classify-intent",
    productivity: "/ai/productivity-analysis",
    flowSuggestions: "/ai/flow-suggestions",
    health: "/ai/health"
  };

  /**
   * Configure the service with a URL provider from MCP context
   */
  setUrlProvider(getServerUrl: () => string): void {
    this.getServerUrl = getServerUrl;
  }

  /**
   * Configure the service with MCP tool executor from MCP context
   */
  setMCPToolExecutor(executor: (toolName: string, parameters: any) => Promise<any>): void {
    this.mcpToolExecutor = executor;
    loggingService.info(this.SERVICE_NAME, "MCP tool executor configured", {});
  }

  /**
   * Extract user ID from API key when available
   * Format: tides_userId_randomId -> extract userId
   */
  private async getUserIdFromApiKey(): Promise<string | null> {
    try {
      const apiKey = await authService.getApiKey();
      if (!apiKey) return null;
      
      const userId = extractUserIdFromApiKey(apiKey);
      if (userId) {
        loggingService.info(this.SERVICE_NAME, "Extracted user ID from API key", { 
          userId,
          apiKeyPrefix: apiKey.substring(0, 15) + '...' 
        });
        return userId;
      }
      
      loggingService.warn(this.SERVICE_NAME, "API key is not in expected format for user ID extraction", {
        apiKeyPrefix: apiKey.substring(0, 15) + '...',
        expectedFormat: 'tides_userId_randomId'
      });
      return null;
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Failed to extract user ID from API key", error);
      return null;
    }
  }

  /**
   * Get user ID with fallback to API key extraction
   */
  private async getUserId(): Promise<string | null> {
    try {
      // First try Supabase current user
      const user = await authService.getCurrentUser();
      if (user?.id) {
        loggingService.info(this.SERVICE_NAME, "Got user ID from Supabase", { userId: user.id });
        return user.id;
      }
      
      // Fallback to extracting from API key
      loggingService.info(this.SERVICE_NAME, "Supabase user not available, extracting from API key");
      return await this.getUserIdFromApiKey();
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Failed to get user ID", error);
      return null;
    }
  }

  /**
   * Execute an MCP tool directly from agent service
   */
  async executeMCPTool(toolName: string, parameters: any): Promise<any> {
    if (!this.mcpToolExecutor) {
      throw new Error("MCP tool executor not configured");
    }

    loggingService.info(this.SERVICE_NAME, "Executing MCP tool", { toolName, parameters });
    
    try {
      const result = await this.mcpToolExecutor(toolName, parameters);
      loggingService.info(this.SERVICE_NAME, "MCP tool executed successfully", { toolName, result });
      return result;
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "MCP tool execution failed", { error, toolName, parameters });
      throw error;
    }
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: any
  ): Promise<any> {
    try {
      const apiKey = await authService.getApiKey();
      if (!apiKey) {
        throw new Error("No auth token available");
      }

      // Use configured server URL from MCP context with fallback to env001
      const baseUrl = this.getServerUrl?.() || "https://tides-001.mpazbot.workers.dev";
      if (!this.getServerUrl) {
        loggingService.warn(this.SERVICE_NAME, "Using fallback URL (env001) - MCP context not configured");
      }
      const url = `${baseUrl}/agents/tide-productivity/${endpoint}`;
      
      loggingService.info(this.SERVICE_NAME, `Agent request URL: ${url}`, {});

      loggingService.info(this.SERVICE_NAME, `Making ${method} request`, { 
        url, 
        requestBody: JSON.stringify(body, null, 2)
      });

      // Apply React Native network fixes with retry logic
      const maxRetries = 3;
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          loggingService.info(this.SERVICE_NAME, `Attempt ${attempt}/${maxRetries}`, { url });
          
          // Add timeout and User-Agent for React Native compatibility
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'User-Agent': 'TidesMobile/1.0 React-Native/0.80.2'
            },
            ...(body && { body: JSON.stringify(body) }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          // If we get here, the request succeeded
          loggingService.info(this.SERVICE_NAME, `Request succeeded on attempt ${attempt}`, { 
            status: response.status, 
            statusText: response.statusText 
          });
          
          return await this.handleAgentResponse(response);
          
        } catch (networkError: unknown) {
          lastError = networkError;
          const errorMessage = networkError instanceof Error ? networkError.message : 'Unknown network error';
          
          loggingService.error(this.SERVICE_NAME, `Attempt ${attempt} failed`, { 
            error: errorMessage,
            url 
          });
          
          if (attempt === maxRetries) {
            loggingService.error(this.SERVICE_NAME, `All ${maxRetries} attempts failed`, {
              finalError: errorMessage,
              url
            });
            break;
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          loggingService.info(this.SERVICE_NAME, `Waiting ${delay}ms before retry...`, {});
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // If we get here, all retries failed
      const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown network error';
      throw new Error(`Agent request failed after ${maxRetries} attempts: ${errorMessage}`);
    } catch (error) {
      loggingService.error(
        this.SERVICE_NAME,
        `Request to ${endpoint} failed`,
        error
      );
      throw new Error(
        `Agent communication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async handleAgentResponse(response: Response): Promise<any> {
    loggingService.info(this.SERVICE_NAME, `Response received`, { 
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      loggingService.error(this.SERVICE_NAME, `Agent request failed`, { 
        status: response.status, 
        errorText 
      });
      throw new Error(
        `Agent request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    loggingService.info(this.SERVICE_NAME, `Agent response received`, { 
      data, 
      hasContent: !!data?.content,
      responseKeys: Object.keys(data || {})
    });

    // Transform the response to match expected AgentResponse format
    return {
      content: data.result?.message || "No response from agent",
      message: data.result?.message || "No response from agent", 
      timestamp: new Date().toISOString(),
      type: data.result?.error ? "error" : "success",
      data: data
    };
  }

  async sendMessage(
    message: string,
    context?: TideContext
  ): Promise<AgentResponse> {
    try {
      loggingService.info(this.SERVICE_NAME, "Processing message with enhanced AI", {
        messageLength: message.length,
        hasContext: !!context,
        hasSessionId: !!this.sessionId,
        hasConversationId: !!this.conversationId
      });
      
      // Get userId with fallback to API key extraction
      loggingService.info(this.SERVICE_NAME, "Getting user ID", {});
      
      const userId = await this.getUserId();
      
      if (!userId) {
        loggingService.error(this.SERVICE_NAME, "No user ID available", { userId });
        throw new Error("User ID is required for agent communication");
      }

      loggingService.info(this.SERVICE_NAME, "User ID confirmed, proceeding", { userId });

      // Initialize session and conversation IDs if not already set
      loggingService.info(this.SERVICE_NAME, "Initializing session and conversation IDs", {
        hasSessionId: !!this.sessionId,
        hasConversationId: !!this.conversationId
      });
      
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
        loggingService.info(this.SERVICE_NAME, "Generated new session ID", { sessionId: this.sessionId });
      }
      if (!this.conversationId) {
        this.conversationId = this.generateConversationId();
        loggingService.info(this.SERVICE_NAME, "Generated new conversation ID", { conversationId: this.conversationId });
      }

      // Add user message to history
      this.conversationHistory.push({ role: "user", content: message });
      
      // Keep only last 10 messages to avoid context getting too large
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      loggingService.info(this.SERVICE_NAME, "Conversation context debug", {
        sessionId: this.sessionId,
        conversationId: this.conversationId,
        historyLength: this.conversationHistory.length,
        lastFewMessages: this.conversationHistory.slice(-3)
      });

      // Try AI conversation endpoint first
      loggingService.info(this.SERVICE_NAME, "About to call sendConversationMessage", { 
        endpoint: "conversation",
        userId,
        sessionId: this.sessionId,
        conversationId: this.conversationId
      });
      
      try {
        const conversationResponse = await this.sendConversationMessage(message, {
          userId,
          sessionId: this.sessionId,
          conversationId: this.conversationId,
          tideId: context?.tideId,
          workContext: context?.workContext,
          recentMessages: this.conversationHistory.slice(-5) // Send last 5 messages for context
        });
        
        // Add assistant response to history
        this.conversationHistory.push({ 
          role: "assistant", 
          content: conversationResponse.content 
        });
        
        return conversationResponse;
      } catch (aiError) {
        loggingService.warn(this.SERVICE_NAME, "AI conversation failed, falling back to legacy", aiError);
        
        // Fallback to legacy agent endpoint
        const requestBody = {
          userId,
          question: message,
          context,
          timestamp: new Date().toISOString(),
        };

        return this.makeRequest("question", "POST", requestBody);
      }
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Failed in sendMessage", error);
      throw error;
    }
  }

  /**
   * Send message to AI conversation endpoint
   */
  async sendConversationMessage(
    message: string,
    context: {
      userId: string;
      sessionId: string;
      conversationId: string;
      tideId?: string;
      workContext?: string;
      recentMessages?: Array<{ role: string; content: string }>;
    }
  ): Promise<AgentResponse> {
    const requestBody = {
      message: message.trim(),
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        conversationId: context.conversationId,
        tideId: context.tideId,
        flowContext: "daily", // Default to daily context
        recentMessages: context.recentMessages || []
      },
      analysisType: "conversation",
      timestamp: new Date().toISOString()
    };

    loggingService.info(this.SERVICE_NAME, "Sending AI conversation request", {
      messageLength: message.length,
      userId: context.userId.substring(0, 8) + '...'
    });

    try {
      const response = await this.makeAIRequest(this.AI_ENDPOINTS.conversation, "POST", requestBody);
      
      return {
        content: response.response || response.result?.response || response.result?.analysis || "I understand your message. How can I help?",
        message: response.response || response.result?.response || response.result?.analysis || "I understand your message. How can I help?",
        timestamp: new Date().toISOString(),
        type: response.type || response.result?.type || "text",
        agentId: "ai-conversation",
        suggestedTools: response.suggestedTools || response.result?.suggestedTools || [],
        toolCall: response.toolCall || response.result?.toolCall,
        data: response
      };
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "AI conversation request failed", error);
      throw error;
    }
  }

  /**
   * Classify user intent for tool routing
   */
  async classifyToolIntent(
    message: string,
    availableTools: string[],
    context?: { userId?: string; tideId?: string }
  ): Promise<{
    intent: string;
    toolName?: string;
    parameters?: Record<string, any>;
    confidence: number;
    suggestions?: string[];
  }> {
    const userId = await this.getUserId() || context?.userId;
    
    if (!userId) {
      throw new Error("User ID is required for tool classification");
    }

    const requestBody = {
      message: message.trim(),
      availableTools,
      context: {
        userId,
        tideId: context?.tideId
      },
      analysisType: "tool_classification",
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.makeAIRequest(this.AI_ENDPOINTS.classification, "POST", requestBody);
      
      return {
        intent: response.result?.intent || "conversation",
        toolName: response.result?.toolName,
        parameters: response.result?.parameters || {},
        confidence: response.result?.confidence || 0.3,
        suggestions: response.result?.suggestions || []
      };
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Tool classification failed", error);
      
      // Fallback to simple classification
      return this.fallbackToolClassification(message, availableTools);
    }
  }

  /**
   * Get productivity insights using AI
   */
  async getProductivityInsights(
    analysisDepth: "quick" | "detailed" = "quick"
  ): Promise<AgentResponse> {
    const userId = await this.getUserId();
    
    if (!userId) {
      throw new Error("User ID is required for productivity analysis");
    }

    const requestBody = {
      context: {
        userId,
        sessionId: this.generateSessionId(),
        conversationId: this.generateConversationId()
      },
      analysisDepth,
      analysisType: "productivity",
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.makeAIRequest(this.AI_ENDPOINTS.productivity, "POST", requestBody);
      
      return {
        content: response.result?.analysis || "Productivity analysis completed",
        message: response.result?.analysis || "Productivity analysis completed",
        timestamp: new Date().toISOString(),
        type: "productivity_analysis",
        agentId: "productivity-ai",
        data: response
      };
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Productivity insights failed", error);
      throw error;
    }
  }

  /**
   * Generate flow suggestions
   */
  async generateFlowSuggestions(
    energyLevel: number = 6
  ): Promise<AgentResponse> {
    const userId = await this.getUserId();
    
    if (!userId) {
      throw new Error("User ID is required for flow suggestions");
    }

    const requestBody = {
      context: {
        userId,
        sessionId: this.generateSessionId(),
        conversationId: this.generateConversationId()
      },
      energyLevel,
      analysisType: "flow_suggestions",
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.makeAIRequest(this.AI_ENDPOINTS.flowSuggestions, "POST", requestBody);
      
      return {
        content: response.result?.suggestions || "Consider starting a moderate flow session",
        message: response.result?.suggestions || "Consider starting a moderate flow session",
        timestamp: new Date().toISOString(),
        type: "flow_suggestions",
        agentId: "flow-ai",
        suggestedTools: ["createTide", "startTideFlow"],
        data: response
      };
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Flow suggestions failed", error);
      throw error;
    }
  }

  /**
   * Check AI service health
   */
  async checkAIHealth(): Promise<boolean> {
    try {
      await this.makeAIRequest(this.AI_ENDPOINTS.health, "GET");
      return true;
    } catch (error) {
      loggingService.warn(this.SERVICE_NAME, "AI health check failed", error);
      return false;
    }
  }

  /**
   * Make request to AI endpoints
   */
  private async makeAIRequest(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: any
  ): Promise<any> {
    const apiKey = await authService.getApiKey();
    if (!apiKey) {
      throw new Error("No auth token available for AI service");
    }

    const baseUrl = this.getServerUrl?.() || "https://tides-001.mpazbot.workers.dev";
    if (!this.getServerUrl) {
      loggingService.warn(this.SERVICE_NAME, "Using fallback URL (env001) - MCP context not configured");
    }
    const url = `${baseUrl}${endpoint}`;
    
    loggingService.info(this.SERVICE_NAME, `AI request to: ${url}`, { method });

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Reset conversation context (for new conversations)
   */
  resetConversation(): void {
    this.sessionId = null;
    this.conversationId = null;
    this.conversationHistory = [];
    loggingService.info(this.SERVICE_NAME, "Conversation context reset");
  }

  /**
   * Get current conversation context (for debugging)
   */
  getConversationContext(): { 
    sessionId: string | null; 
    conversationId: string | null; 
    historyLength: number 
  } {
    return {
      sessionId: this.sessionId,
      conversationId: this.conversationId,
      historyLength: this.conversationHistory.length
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Fallback tool classification when AI is unavailable
   */
  private fallbackToolClassification(
    message: string,
    availableTools: string[]
  ): {
    intent: string;
    toolName?: string;
    confidence: number;
    suggestions: string[];
  } {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword matching
    if (lowerMessage.includes("create") || lowerMessage.includes("new")) {
      return {
        intent: "direct_tool",
        toolName: "createTide",
        confidence: 0.6,
        suggestions: ["createTide"]
      };
    }
    
    if (lowerMessage.includes("list") || lowerMessage.includes("show")) {
      return {
        intent: "direct_tool",
        toolName: "getTideList",
        confidence: 0.6,
        suggestions: ["getTideList"]
      };
    }
    
    return {
      intent: "conversation",
      confidence: 0.3,
      suggestions: availableTools.slice(0, 3)
    };
  }

  async checkStatus(): Promise<AgentStatus> {
    try {
      // Check both legacy and AI endpoints
      const [legacyStatus, aiHealthy] = await Promise.allSettled([
        this.makeRequest("status", "GET"),
        this.checkAIHealth()
      ]);
      
      const isLegacyHealthy = legacyStatus.status === 'fulfilled';
      const isAIHealthy = aiHealthy.status === 'fulfilled' && aiHealthy.value;
      
      return {
        isHealthy: isLegacyHealthy || isAIHealthy,
        status: isAIHealthy ? "enhanced" : (isLegacyHealthy ? "legacy" : "degraded"),
        connected: isLegacyHealthy || isAIHealthy,
        version: "v2.0-ai-enhanced",
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: "error",
        connected: false,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async getInsights(): Promise<AgentInsights> {
    const requestBody = {
      timestamp: new Date().toISOString(),
    };

    return this.makeRequest("insights", "POST", requestBody);
  }

  async optimizeTide(tideId: string): Promise<AgentOptimization> {
    const requestBody = {
      tideId,
      timestamp: new Date().toISOString(),
    };

    return this.makeRequest("optimize", "POST", requestBody);
  }

  async updatePreferences(preferences: Record<string, any>): Promise<AgentPreferences> {
    const requestBody = {
      preferences,
      timestamp: new Date().toISOString(),
    };

    return this.makeRequest("preferences", "POST", requestBody);
  }
}

export const agentService = new AgentService();
