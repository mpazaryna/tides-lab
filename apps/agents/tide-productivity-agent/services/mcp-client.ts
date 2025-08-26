/**
 * MCP Client Service - Handles communication with MCP server
 */

import type { MCPPromptArgs, UserContext } from '../types';

export interface MCPResponse {
  result?: {
    messages: Array<{
      role: string;
      content: { text: string } | string;
    }>;
  };
  error?: {
    message: string;
    code?: number;
  };
}

export class MCPClient {
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
  }

  /**
   * Get a prompt from the MCP server
   */
  async getPrompt(promptName: string, args: MCPPromptArgs): Promise<MCPResponse> {
    // TODO: Add request caching to reduce MCP server load
    // TODO: Implement exponential backoff for retries
    // TODO: Add circuit breaker pattern for MCP availability
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "prompts/get",
        params: {
          name: promptName,
          arguments: args
        }
      };

      const endpoint = this.getMCPEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
      }

      const mcpResponse = await response.json() as MCPResponse;
      return mcpResponse;

    } catch (error) {
      console.error(`[MCPClient] Failed to get MCP prompt ${promptName}:`, error);
      
      // Return fallback prompts for critical operations
      return this.getFallbackPrompt(promptName, args);
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, args: any): Promise<MCPResponse> {
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      const endpoint = this.getMCPEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`MCP tool call failed: ${response.status} ${response.statusText}`);
      }

      const mcpResponse = await response.json() as MCPResponse;
      return mcpResponse;

    } catch (error) {
      console.error(`[MCPClient] Failed to call MCP tool ${toolName}:`, error);
      
      return {
        error: {
          message: `MCP tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: -1
        }
      };
    }
  }

  /**
   * Get MCP endpoint based on environment
   */
  private getMCPEndpoint(): string {
    const envMap = {
      'production': 'https://tides-001.mpazbot.workers.dev/mcp',
      'staging': 'https://tides-002.mpazbot.workers.dev/mcp', 
      'development': 'https://tides-003.mpazbot.workers.dev/mcp'
    };

    return envMap[this.userContext.environment] || envMap.development;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    if (this.userContext.authToken) {
      return `Bearer ${this.userContext.authToken}`;
    }
    
    // TODO: Remove hardcoded test tokens and implement proper auth
    // TODO: Add token refresh mechanism for expired tokens
    const tokenMap = {
      'production': 'Bearer tides_testuser_001',
      'staging': 'Bearer tides_testuser_002', 
      'development': 'Bearer tides_testuser_003'
    };

    return tokenMap[this.userContext.environment] || tokenMap.development;
  }

  /**
   * Provide fallback prompts when MCP server is unavailable
   */
  private getFallbackPrompt(promptName: string, args: MCPPromptArgs): MCPResponse {
    // TODO: Load fallback prompts from external config/database
    // TODO: Add versioning for fallback prompts
    const fallbackPrompts = {
      'custom_tide_analysis': {
        result: {
          messages: [{
            role: 'user',
            content: `Analyze productivity for tide ${args.tide_id}. Question: "${args.analysis_question}". Provide specific, actionable insights based on available data patterns.`
          }]
        }
      },
      
      'productivity_insights': {
        result: {
          messages: [{
            role: 'user', 
            content: `Generate productivity insights for tide ${args.tide_id} over ${args.time_period}. Focus on patterns and recommendations.`
          }]
        }
      },
      
      'optimize_energy': {
        result: {
          messages: [{
            role: 'user',
            content: `Provide energy optimization recommendations for tide ${args.tide_id}. Focus on scheduling and energy management strategies.`
          }]
        }
      }
    };

    return fallbackPrompts[promptName as keyof typeof fallbackPrompts] || {
      error: {
        message: `Unknown prompt: ${promptName}`,
        code: -2
      }
    };
  }
}