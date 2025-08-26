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
    const apiKey = await authService.getApiKey();
    
    if (!apiKey || !this.baseUrl) {
      return { isConnected: false, hasApiKey: !!apiKey };
    }

    // Validate API key format (should be tides_userId_randomId format)
    const isValidFormat = apiKey.match(/^tides_[a-f0-9-]{36}_[a-z0-9]{6}$/i);
    
    if (!isValidFormat) {
      console.error('[MCPService] Invalid auth token format:', { 
        tokenLength: apiKey.length,
        tokenPrefix: apiKey.substring(0, 12) + '...',
        expectedFormat: 'tides_userId_randomId'
      });
      return { isConnected: false, hasApiKey: false };
    }

    // Simple connectivity test with API key
    // TODO: Remove debug logging before production release
    console.log('[DEBUG] MCP Health Check Details:', {
      url: `${this.baseUrl}/ai/health`,
      apiKey: apiKey,
      tokenLength: apiKey.length,
      tokenFormat: apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 10),
      startsWithTides: apiKey.startsWith('tides_'),
      isValidFormat: !!apiKey.match(/^tides_[a-f0-9-]{36}_[a-z0-9]{6}$/i)
    });
    
    try {
      const response = await fetch(`${this.baseUrl}/ai/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      console.log(`[MCPService] Health check status: ${response.status} with API key`);
      
      if (response.status === 401) {
        const responseText = await response.text();
        // TODO: Replace debug logging with proper error analytics
        console.log('[DEBUG] 401 Response details:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: responseText,
          headers: Object.fromEntries(response.headers.entries())
        });
      }
      return { isConnected: response.ok, hasApiKey: !!apiKey };
    } catch (error) {
      console.error(`[MCPService] Health check failed:`, error);
      // TODO: Implement proper health check fallback strategy
      // If health check fails, still return true if we have API key
      // The actual MCP request will reveal the real connectivity issue
      return { isConnected: false, hasApiKey: !!apiKey };
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
    const apiKey = await authService.getApiKey();
    if (!apiKey) throw new Error('No API key');
    
    // Validate API key format before making requests
    const isValidFormat = apiKey.match(/^tides_[a-f0-9-]{36}_[a-z0-9]{6}$/i);
    
    if (!isValidFormat) {
      throw new Error('Invalid API key format - expected tides_userId_randomId');
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
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
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
            'Authorization': `Bearer ${apiKey}`,
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
   * Smart Flow - Always uses hierarchical flow since hierarchical tides always exist
   * Combines the best of tide_flow and tide_start_hierarchical_flow
   * Now supports context-aware execution with optional contextTideId
   */
  async startSmartFlow(intensity?: string, duration?: number, workContext?: string, contextTideId?: string) {
    // Get time of day for smart defaults
    const hour = new Date().getHours();
    const timeBasedContext = 
      hour < 12 ? 'morning planning' :
      hour < 17 ? 'afternoon focus' : 
      'evening deep work';

    const params: any = {
      intensity: intensity || 'moderate',
      duration_minutes: duration || 25,
      work_context: workContext || timeBasedContext,
    };

    // Add context tide if provided
    if (contextTideId) {
      params.context_tide_id = contextTideId;
    }

    return this.tool('tide_start_hierarchical_flow', params);
  }

  /**
   * Hierarchical Context Management Methods
   * These methods align with the hierarchical tide system
   */

  async getOrCreateDailyTide(timezone?: string) {
    return this.tool('tide_get_or_create_daily', { 
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone 
    });
  }

  async switchContext(contextType: 'daily' | 'weekly' | 'monthly' | 'project', date?: string) {
    return this.tool('tide_switch_context', {
      context_type: contextType,
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  async listContexts(date?: string, includeEmpty = true) {
    return this.tool('tide_list_contexts', {
      date: date || new Date().toISOString().split('T')[0],
      include_empty: includeEmpty,
    });
  }

  async getTodaysSummary(date?: string) {
    return this.tool('tide_get_todays_summary', {
      date: date || new Date().toISOString().split('T')[0],
    });
  }

  async getRawTideJson(tideId: string) {
    return this.tool('tide_get_raw_json', { tide_id: tideId });
  }


  /**
   * Context-aware energy addition
   */
  async addEnergyToContext(contextTideId: string, energyLevel: string, context?: string) {
    return this.tool('tide_add_energy', {
      tide_id: contextTideId, // Use context tide
      energy_level: energyLevel,
      context: context || `Energy added at ${new Date().toLocaleTimeString()}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
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