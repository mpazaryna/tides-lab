import { authService } from "./authService";
import { loggingService } from "./loggingService";

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

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: any
  ): Promise<any> {
    try {
      const apiKey = await authService.getApiKey();
      if (!apiKey) {
        throw new Error("No API key available");
      }

      // Temporarily use the known working server URL
      const baseUrl = "https://tides-006.mpazbot.workers.dev";
      const url = `${baseUrl}/agents/tide-productivity/${endpoint}`;
      
      loggingService.info(this.SERVICE_NAME, `Agent request URL: ${url}`, {});

      loggingService.info(this.SERVICE_NAME, `Making ${method} request`, { 
        url, 
        requestBody: JSON.stringify(body, null, 2)
      });

      const response = await fetch(url, {
        method,
        headers: {
        'Content-Type': 'application/json, text/event-stream',
        'Authorization': `Bearer ${apiKey}`
        },
        ...(body && { body: JSON.stringify(body) }),
      });

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
      loggingService.debug(
        this.SERVICE_NAME,
        `Request to ${endpoint} successful`,
        { status: response.status }
      );

      // Transform the response to match expected AgentResponse format
      return {
        content: data.result?.message || "No response from agent",
        message: data.result?.message || "No response from agent", 
        timestamp: new Date().toISOString(),
        type: data.result?.error ? "error" : "success",
        data: data
      };
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

  async sendMessage(
    message: string,
    context?: TideContext
  ): Promise<AgentResponse> {
    try {
      loggingService.info(this.SERVICE_NAME, "Getting user for agent request", {});
      
      // Get userId from auth service
      const user = await authService.getCurrentUser();
      const userId = user?.id;
      
      loggingService.info(this.SERVICE_NAME, "User retrieved", { hasUser: !!user, userId: userId?.substring(0, 8) + '...' });
      
      if (!userId) {
        throw new Error("User ID is required for agent communication");
      }

      const requestBody = {
        userId,
        question: message, // Server expects 'question', not 'message'
        context,
        timestamp: new Date().toISOString(),
      };

      loggingService.info(this.SERVICE_NAME, "Sending agent request", { 
        question: message.substring(0, 50),
        hasContext: !!context,
        userId: userId.substring(0, 8) + '...'
      });

      return this.makeRequest("question", "POST", requestBody);
    } catch (error) {
      loggingService.error(this.SERVICE_NAME, "Failed in sendMessage", error);
      throw error;
    }
  }

  async checkStatus(): Promise<AgentStatus> {
    return this.makeRequest("status", "GET");
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
