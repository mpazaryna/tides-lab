/**
 * Utility for fetching tide data via MCP calls
 * No hardcoded fallbacks - fails gracefully when data unavailable
 */

import type { TideInfo, UserContext } from '../types';

export class TideFetcher {
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
  }

  /**
   * Get list of active tides for a user
   * @param activeOnly - Whether to filter for active tides only
   * @returns Promise<TideInfo[]> - Array of tide information, empty array if none found
   */
  async getActiveTides(activeOnly: boolean = true): Promise<TideInfo[]> {
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "tide_list",
          arguments: {
            active_only: activeOnly
          }
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
        console.warn(`[TideFetcher] MCP request failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const mcpResponse = await response.json() as any;
      
      if (mcpResponse.error) {
        console.warn(`[TideFetcher] MCP error: ${mcpResponse.error.message}`);
        return [];
      }

      if (!mcpResponse.result?.content?.[0]?.text) {
        console.warn('[TideFetcher] No content in MCP response');
        return [];
      }

      const content = JSON.parse(mcpResponse.result.content[0].text);
      
      if (!content.tides || !Array.isArray(content.tides)) {
        console.warn('[TideFetcher] No tides array in response content');
        return [];
      }

      return content.tides.map((tide: any) => ({
        id: tide.id,
        name: tide.name || 'Untitled Tide',
        flow_type: tide.flow_type || 'unknown',
        status: tide.status,
        created_at: tide.created_at,
        description: tide.description
      }));

    } catch (error) {
      console.error('[TideFetcher] Failed to fetch tides:', error);
      return [];
    }
  }

  /**
   * Get a specific tide by ID
   */
  async getTideById(tideId: string): Promise<TideInfo | null> {
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "tide_get_raw_json",
          arguments: {
            tide_id: tideId
          }
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
        console.warn(`[TideFetcher] Failed to get tide ${tideId}: ${response.status}`);
        return null;
      }

      const mcpResponse = await response.json() as any;
      
      if (mcpResponse.error) {
        console.warn(`[TideFetcher] MCP error getting tide ${tideId}: ${mcpResponse.error.message}`);
        return null;
      }

      if (!mcpResponse.result?.content?.[0]?.text) {
        console.warn(`[TideFetcher] No content for tide ${tideId}`);
        return null;
      }

      const content = JSON.parse(mcpResponse.result.content[0].text);
      
      if (!content.tide) {
        console.warn(`[TideFetcher] No tide data for ${tideId}`);
        return null;
      }

      const tide = content.tide;
      return {
        id: tide.id,
        name: tide.name || 'Untitled Tide',
        flow_type: tide.flow_type || 'unknown',
        status: tide.status,
        created_at: tide.created_at,
        description: tide.description
      };

    } catch (error) {
      console.error(`[TideFetcher] Failed to get tide ${tideId}:`, error);
      return null;
    }
  }

  /**
   * Find most relevant tide for a question using simple keyword matching
   * In a production system, this would use semantic search or ML
   */
  async getMostRelevantTide(question: string): Promise<string | null> {
    try {
      const tides = await this.getActiveTides();
      
      if (tides.length === 0) {
        return null;
      }

      // Simple keyword matching - look for tide names in question
      const lowerQuestion = question.toLowerCase();
      
      for (const tide of tides) {
        if (lowerQuestion.includes(tide.name.toLowerCase()) ||
            lowerQuestion.includes(tide.flow_type.toLowerCase())) {
          return tide.id;
        }
      }

      // Return first active tide if no specific match
      return tides[0].id;

    } catch (error) {
      console.error('[TideFetcher] Failed to find relevant tide:', error);
      return null;
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
   * Get authorization header based on user context
   */
  private getAuthHeader(): string {
    if (this.userContext.authToken) {
      return `Bearer ${this.userContext.authToken}`;
    }
    
    // Default test tokens based on environment
    const tokenMap = {
      'production': 'Bearer tides_testuser_001',
      'staging': 'Bearer tides_testuser_002', 
      'development': 'Bearer tides_testuser_003'
    };

    return tokenMap[this.userContext.environment] || tokenMap.development;
  }
}