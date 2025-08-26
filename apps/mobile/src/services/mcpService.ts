// Refactored MCP Service using BaseService architecture and centralized types

import { AuthService } from "./authService";
import { LoggingService } from "./LoggingService";
import { BaseService } from "./base/BaseService";
import { MCPMethods } from "../types/mcp";
import { toolRegistryService, type MobileToolExecutionResult } from "./ToolRegistryService";
import type {
  MCPRequest,
  MCPResponse,
  MCPError,
  TideCreateParams,
  TideFlowParams,
  TideAddEnergyParams,
  TideLinkTaskParams,
  TideListTaskLinksParams,
  TideGetReportParams,
  TidesGetParticipantsParams,
} from "../types/mcp";
import type {
  Tide,
  TideCreateResponse,
  TideListResponse,
  FlowSessionResponse,
  EnergyUpdateResponse,
  TaskLinkResponse,
  TaskLinksListResponse,
  TideReportResponse,
  ParticipantsResponse,
  FlowIntensity,
  FlowType,
  EnergyLevel,
} from "../types";

class TidesMCPService extends BaseService {
  private static readonly SERVICE_NAME = "MCPService";
  private static instance: TidesMCPService | null = null;
  private requestId: number = 0;

  constructor() {
    // Start with a placeholder URL - will be updated when requests are made
    super({
      baseUrl: "",
      headers: {
        'Accept': 'application/json, text/event-stream',
      }
    });
  }

  // Singleton pattern
  static getInstance(): TidesMCPService {
    if (!TidesMCPService.instance) {
      TidesMCPService.instance = new TidesMCPService();
    }
    return TidesMCPService.instance;
  }

  /**
   * Create an MCP JSON-RPC 2.0 request
   */
  private createMCPRequest<T>(method: string, params?: T): MCPRequest<T> {
    return {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method,
      params,
    };
  }

  /**
   * Ensure base URL is set from AuthService
   */
  private async ensureBaseUrl(): Promise<void> {
    if (!this.baseUrl) {
      await AuthService.waitForUrlInitialization();
      this.baseUrl = (AuthService.constructor as any).workerUrl;
      
      LoggingService.debug(
        TidesMCPService.SERVICE_NAME,
        "Base URL set from AuthService",
        { baseUrl: this.baseUrl }
      );
    }
  }

  /**
   * Execute MCP request
   */
  private async mcpRequest<TParams = any, TResult = any>(
    method: string,
    params?: TParams
  ): Promise<TResult> {
    // Ensure we have the correct base URL before making requests
    await this.ensureBaseUrl();
    
    // Create proper MCP tools/call request format
    const mcpRequest = this.createMCPRequest("tools/call", {
      name: method,
      arguments: params || {}
    });
    
    LoggingService.debug(
      TidesMCPService.SERVICE_NAME,
      `MCP Request: ${method}`,
      params
    );

    const response = await this.post<MCPResponse<TResult>>("/mcp", mcpRequest);
    
    if (response.data.error) {
      const err = new Error(response.data.error.message) as Error & MCPError;
      err.code = response.data.error.code;
      err.data = response.data.error.data;
      throw err;
    }

    if (!response.data.result) {
      throw new Error(`No result in MCP response for method: ${method}`);
    }

    // Extract actual data from MCP tool response format
    let result = response.data.result;
    
    // MCP tools return data in content array format
    if (result && typeof result === 'object' && 'content' in result) {
      const mcpResult = result as any;
      if (mcpResult.content && Array.isArray(mcpResult.content) && mcpResult.content.length > 0) {
        const firstContent = mcpResult.content[0];
        if (firstContent.type === 'text' && firstContent.text) {
          try {
            // Parse the JSON string returned by the tool
            result = JSON.parse(firstContent.text);
          } catch (e) {
            // If not JSON, return the text as-is
            result = firstContent.text;
          }
        }
      }
    }

    LoggingService.debug(
      TidesMCPService.SERVICE_NAME,
      `MCP Response: ${method}`,
      result
    );

    return result;
  }

  /**
   * Update server URL
   */
  async updateServerUrl(newUrl: string): Promise<void> {
    const currentUrl = this.baseUrl ? this.buildUrl("/mcp") : "not-set";
    
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Updating server URL",
      { oldUrl: currentUrl, newUrl },
      "MCP_015"
    );

    // Clean the URL if it has /mcp suffix
    const cleanUrl = newUrl.endsWith("/mcp") ? newUrl.slice(0, -4) : newUrl;
    
    // Update the AuthService URL (this persists the URL)
    await AuthService.setWorkerUrl(cleanUrl);
    
    // Update our base URL immediately
    this.baseUrl = cleanUrl;
    
    LoggingService.debug(
      TidesMCPService.SERVICE_NAME,
      "Base URL updated in MCPService",
      { baseUrl: this.baseUrl }
    );
  }

  /**
   * Create a new tide
   */
  async createTide(
    name: string,
    description?: string,
    flowType: FlowType = "project"
  ): Promise<TideCreateResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Creating tide",
      { name, flowType },
      "MCP_005"
    );

    const params: TideCreateParams = {
      name,
      description,
      flow_type: flowType,
    };

    return this.mcpRequest<TideCreateParams, TideCreateResponse>(
      MCPMethods.TIDE_CREATE,
      params
    );
  }

  /**
   * List all tides
   */
  async listTides(): Promise<TideListResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Listing tides",
      undefined,
      "MCP_006"
    );

    return this.mcpRequest<undefined, TideListResponse>(MCPMethods.TIDE_LIST);
  }

  /**
   * Start a tide flow session
   */
  async startTideFlow(
    tideId: string,
    intensity: FlowIntensity = "moderate",
    duration: number = 25,
    energyLevel: "low" | "medium" | "high" = "high",
    workContext: string = "General work"
  ): Promise<FlowSessionResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Starting tide flow",
      { tideId, intensity, duration },
      "MCP_007"
    );

    const params: TideFlowParams = {
      tide_id: tideId,
      intensity,
      duration,
      energy_level: energyLevel,
      work_context: workContext,
    };

    return this.mcpRequest<TideFlowParams, FlowSessionResponse>(
      MCPMethods.TIDE_FLOW,
      params
    );
  }

  /**
   * Add energy to a tide
   */
  async addEnergyToTide(
    tideId: string,
    energyLevel: EnergyLevel,
    context?: string
  ): Promise<EnergyUpdateResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Adding energy to tide",
      { tideId, energyLevel },
      "MCP_008"
    );

    const params: TideAddEnergyParams = {
      tide_id: tideId,
      energy_level: energyLevel,
      context,
    };

    return this.mcpRequest<TideAddEnergyParams, EnergyUpdateResponse>(
      MCPMethods.TIDE_ADD_ENERGY,
      params
    );
  }

  /**
   * Link a task to a tide
   */
  async linkTaskToTide(
    tideId: string,
    taskUrl: string,
    taskTitle: string,
    taskType: string = "general"
  ): Promise<TaskLinkResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Linking task to tide",
      { tideId, taskTitle },
      "MCP_009"
    );

    const params: TideLinkTaskParams = {
      tide_id: tideId,
      task_url: taskUrl,
      task_title: taskTitle,
      task_type: taskType,
    };

    return this.mcpRequest<TideLinkTaskParams, TaskLinkResponse>(
      MCPMethods.TIDE_LINK_TASK,
      params
    );
  }

  /**
   * List task links for a tide
   */
  async listTaskLinks(tideId: string): Promise<TaskLinksListResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Listing task links for tide",
      { tideId },
      "MCP_010"
    );

    const params: TideListTaskLinksParams = {
      tide_id: tideId,
    };

    return this.mcpRequest<TideListTaskLinksParams, TaskLinksListResponse>(
      MCPMethods.TIDE_LIST_TASK_LINKS,
      params
    );
  }

  /**
   * Get tide report
   */
  async getTideReport(
    tideId: string,
    format: "json" | "markdown" | "csv" = "json"
  ): Promise<TideReportResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Getting tide report",
      { tideId, format },
      "MCP_011"
    );

    const params: TideGetReportParams = {
      tide_id: tideId,
      format,
    };

    return this.mcpRequest<TideGetReportParams, TideReportResponse>(
      MCPMethods.TIDE_GET_REPORT,
      params
    );
  }

  /**
   * Get tide participants
   */
  async getTideParticipants(
    statusFilter?: string,
    dateFrom?: string,
    dateTo?: string,
    limit?: number
  ): Promise<ParticipantsResponse> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Getting tide participants",
      { statusFilter, dateFrom, dateTo, limit },
      "MCP_012"
    );

    const params: TidesGetParticipantsParams = {
      status: statusFilter as any,
      date_from: dateFrom,
      date_to: dateTo,
      limit,
    };

    return this.mcpRequest<TidesGetParticipantsParams, ParticipantsResponse>(
      MCPMethods.TIDES_GET_PARTICIPANTS,
      params
    );
  }

  /**
   * Connection health check
   */
  async ping(): Promise<{ status: string; timestamp: string }> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Pinging MCP server",
      undefined,
      "MCP_013"
    );

    try {
      // Try to list tides as a simple health check
      const response = await this.listTides();
      return {
        status: response.success ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      LoggingService.error(
        TidesMCPService.SERVICE_NAME,
        "MCP server ping failed",
        { error },
        "MCP_014"
      );
      return {
        status: "disconnected",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    hasApiKey: boolean;
    workerUrl: string;
  }> {
    await this.ensureBaseUrl();
    
    const apiKey = await AuthService.getApiKey();
    const hasApiKey = !!apiKey;

    let isConnected = false;
    if (hasApiKey) {
      try {
        const pingResult = await this.ping();
        isConnected = pingResult.status === "connected";
      } catch {
        isConnected = false;
      }
    }

    const baseUrl = this.buildUrl("/mcp");
    return {
      isConnected,
      hasApiKey,
      workerUrl: baseUrl,
    };
  }

  /**
   * Get current server URL
   */
  async getCurrentServerUrl(): Promise<string> {
    await this.ensureBaseUrl();
    return this.buildUrl("/mcp");
  }

  // ===============================
  // Tool Registry Direct Access Methods
  // ===============================

  /**
   * Get all available tool names from the registry
   */
  getAvailableToolNames(): string[] {
    return toolRegistryService.getToolNames();
  }

  /**
   * Get tools organized by category
   */
  getToolsByCategory(category?: string) {
    return toolRegistryService.getToolsByCategory(category);
  }

  /**
   * Get metadata for a specific tool
   */
  getToolMetadata(toolName: string) {
    return toolRegistryService.getToolMetadata(toolName);
  }

  /**
   * Find tool by partial name match (for autocomplete)
   */
  findToolByPartialName(partialName: string): string | undefined {
    return toolRegistryService.findToolByPartialName(partialName);
  }

  /**
   * Validate tool parameters
   */
  validateToolParams(toolName: string, params: Record<string, any>) {
    return toolRegistryService.validateToolParams(toolName, params);
  }

  /**
   * Execute a tool dynamically through the registry
   * This provides an alternative to the hardcoded methods above
   */
  async executeToolDirect(toolName: string, params: Record<string, any> = {}): Promise<MobileToolExecutionResult> {
    LoggingService.info(
      TidesMCPService.SERVICE_NAME,
      "Executing tool via direct registry access",
      { toolName, params },
      "MCP_DIRECT_001"
    );

    return toolRegistryService.execute(toolName, params);
  }

  /**
   * Get registry statistics and health info
   */
  getRegistryStats() {
    return toolRegistryService.getRegistryStats();
  }
}

// Export singleton instance
export const mcpService = TidesMCPService.getInstance();

// Re-export types for backward compatibility
export type {
  Tide,
  TideCreateResponse,
  TideListResponse,
  FlowSessionResponse,
  EnergyUpdateResponse,
  TideReportResponse,
  TaskLinkResponse,
  TaskLinksListResponse,
  ParticipantsResponse,
};

// Export additional types that the original service exported
export type FlowSession = FlowSessionResponse;
export type EnergyUpdate = EnergyUpdateResponse;
export type TideReport = TideReportResponse;
export type TaskLink = TaskLinkResponse;
export type TaskLinksResponse = TaskLinksListResponse;