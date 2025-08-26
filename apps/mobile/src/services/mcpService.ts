import { authService } from './authService';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

/**
 * MCP Service for Tides Mobile App
 * 
 * IMPORTANT: MCP Server Response Format
 * The server returns tool results wrapped in MCP protocol format:
 * {
 *   "result": {
 *     "content": [{"type": "text", "text": "{actual_data_as_json_string}"}]
 *   },
 *   "jsonrpc": "2.0",
 *   "id": 1
 * }
 * 
 * The actual data (success, tides, etc.) is JSON-stringified inside result.content[0].text
 * and must be parsed to get the real response structure that the app expects.
 */
class MCPService {
  private requestId = 0;
  private baseUrl = '';
  private urlProvider: (() => string) | null = null;

  /**
   * Configure the service with a URL provider from ServerEnvironment context
   */
  setUrlProvider(getServerUrl: () => string): void {
    this.urlProvider = getServerUrl;
    this.baseUrl = getServerUrl();
  }

  async getConnectionStatus() {
    const authToken = await authService.getAuthToken();
    
    if (!authToken || !this.baseUrl) {
      return { isConnected: false, hasAuthToken: !!authToken };
    }

    // Validate auth token format (should be a UUID)
    if (authToken.length < 10 || !authToken.match(/^[a-f0-9-]{8,}$/i)) {
      console.error('[MCPService] Invalid auth token format:', { 
        tokenLength: authToken.length,
        tokenPrefix: authToken.substring(0, 8) + '...'
      });
      return { isConnected: false, hasAuthToken: false };
    }

    // Simple connectivity test with auth token
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log(`[MCPService] Health check status: ${response.status} with auth token`);
      return { isConnected: response.ok, hasAuthToken: !!authToken };
    } catch (error) {
      console.error(`[MCPService] Health check failed:`, error);
      // If health check fails, still return true if we have auth token
      // The actual MCP request will reveal the real connectivity issue
      return { isConnected: false, hasAuthToken: !!authToken };
    }
  }

  async updateServerUrl(url: string) {
    this.baseUrl = url;
    await authService.setWorkerUrl(url);
  }

  /**
   * Get current server URL from provider or fallback
   */
  private getCurrentUrl(): string {
    if (this.urlProvider) {
      return this.urlProvider();
    }
    return this.baseUrl || 'https://tides-001.mpazbot.workers.dev';
  }

  private async request(method: string, params?: any) {
    const authToken = await authService.getAuthToken();
    if (!authToken) throw new Error('No auth token');
    
    // Validate auth token format before making requests
    if (authToken.length < 10 || !authToken.match(/^[a-f0-9-]{8,}$/i)) {
      throw new Error('Invalid auth token format');
    }
    
    const currentUrl = this.getCurrentUrl();
    if (!currentUrl) {
      throw new Error('MCP server URL not configured');
    }

    const body: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    console.log(`[MCPService] Request to ${currentUrl}/mcp:`, {
      method,
      params,
      authTokenPrefix: authToken.substring(0, 10) + '...',
      baseUrl: currentUrl
    });

    // Retry logic for React Native network issues
    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[MCPService] Attempt ${attempt}/${maxRetries}`);
        
        // Add timeout and User-Agent for React Native compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${currentUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${authToken}`,
            'User-Agent': 'TidesMobile/1.0 React-Native/0.80.2'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // If we get here, the request succeeded
        console.log(`[MCPService] Request succeeded on attempt ${attempt}`);
        return await this.handleResponse(response);
        
      } catch (networkError: unknown) {
        lastError = networkError;
        const errorMessage = networkError instanceof Error ? networkError.message : 'Unknown network error';
        
        console.error(`[MCPService] Attempt ${attempt} failed:`, errorMessage);
        
        if (attempt === maxRetries) {
          console.error(`[MCPService] All ${maxRetries} attempts failed. Final error:`, {
            name: networkError instanceof Error ? networkError.name : 'Unknown',
            message: errorMessage,
            stack: networkError instanceof Error ? networkError.stack : undefined,
            url: `${currentUrl}/mcp`
          });
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`[MCPService] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown network error';
    throw new Error(`Network request failed after ${maxRetries} attempts: ${errorMessage}`);
  }

  private async handleResponse(response: Response) {
    console.log(`[MCPService] Response status: ${response.status} ${response.statusText}`);
    const headers = Object.fromEntries(response.headers.entries());
    console.log(`[MCPService] Response headers:`, headers);
    console.log(`[MCPService] Content-Type specifically:`, response.headers.get('content-type'));

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      console.log(`[MCPService] Error response content-type:`, contentType);
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.log(`[MCPService] JSON error data:`, errorData);
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      } else {
        const errorText = await response.text();
        console.log(`[MCPService] Plain text error:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
    }

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    console.log(`[MCPService] Response content-type: ${contentType}`);
    console.log(`[MCPService] Raw response:`, responseText);

    try {
      let jsonData;
      
      // Parse based on actual content type returned by server
      if (contentType.includes('text/event-stream')) {
        console.log(`[MCPService] Parsing as Server-Sent Events`);
        const jsonMatch = responseText.match(/^data: (.+)$/m);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('No data field found in SSE response');
        }
      } else {
        console.log(`[MCPService] Parsing as standard JSON`);
        jsonData = JSON.parse(responseText);
      }

      console.log(`[MCPService] Parsed response:`, jsonData);
      if (jsonData.error) throw new Error(jsonData.error.message);
      
      // Handle nested JSON response format from MCP tools
      if (jsonData.result?.content?.[0]?.text) {
        const innerData = JSON.parse(jsonData.result.content[0].text);
        console.log(`[MCPService] Extracted inner data:`, innerData);
        return innerData;
      }
      
      return jsonData.result;
    } catch (parseError) {
      console.error(`[MCPService] JSON parse error:`, parseError);
      console.error(`[MCPService] Response that failed to parse:`, responseText);
      throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`);
    }
  }

  tool(name: string, args?: any) {
    return this.request('tools/call', { name, arguments: args || {} });
  }

  async createTide(name: string, description?: string, flowType?: string) {
    return this.tool('tide_create', { name, description, flow_type: flowType });
  }

  async listTides() {
    return this.tool('tide_list', {});
  }

  async addEnergyToTide(tideId: string, energyLevel: string, context?: string) {
    return this.tool('tide_add_energy', { tide_id: tideId, energy_level: energyLevel, context });
  }

  async startTideFlow(tideId: string, intensity?: string, duration?: number, initialEnergy?: string, workContext?: string) {
    return this.tool('tide_flow', { tide_id: tideId, intensity, duration, initial_energy: initialEnergy, work_context: workContext });
  }

  async getTideReport(tideId: string, format?: string) {
    return this.tool('tide_get_report', { tide_id: tideId, format });
  }

  async linkTaskToTide(tideId: string, taskUrl: string, taskTitle: string, taskType?: string) {
    return this.tool('tide_link_task', { tide_id: tideId, task_url: taskUrl, task_title: taskTitle, task_type: taskType });
  }

  async listTaskLinks(tideId: string) {
    return this.tool('tide_list_task_links', { tide_id: tideId });
  }

  async getTideParticipants(statusFilter?: string, dateFrom?: string, dateTo?: string, limit?: number) {
    return this.tool('tides_get_participants', { status_filter: statusFilter, date_from: dateFrom, date_to: dateTo, limit });
  }

  /**
   * Call any MCP tool by name with arguments
   * This is a generic method for calling AI tools and other MCP tools
   */
  async callTool(name: string, args?: any) {
    return this.tool(name, args);
  }
}

export const mcpService = new MCPService();