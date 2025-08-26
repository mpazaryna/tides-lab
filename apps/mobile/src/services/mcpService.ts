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

  async getConnectionStatus() {
    const apiKey = await authService.getApiKey();
    return { isConnected: !!apiKey, hasApiKey: !!apiKey };
  }

  async updateServerUrl(url: string) {
    this.baseUrl = url;
    await authService.setWorkerUrl(url);
  }

  private async request(method: string, params?: any) {
    const apiKey = await authService.getApiKey();
    if (!apiKey) throw new Error('No API key');

    const body: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    console.log(`[MCPService] Request to ${this.baseUrl}/mcp:`, {
      method,
      params,
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

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

  private tool(name: string, args?: any) {
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
}

export const mcpService = new MCPService();