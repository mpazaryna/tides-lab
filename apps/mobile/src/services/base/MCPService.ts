// MCP Service extending BaseService for JSON-RPC 2.0 communication

import { BaseService } from './BaseService';
import {
  MCPMethods,
} from '../../types/mcp';
import type {
  MCPRequest,
  MCPResponse,
  MCPError,
  TideCreateParams,
  TideListParams,
  TideFlowParams,
  TideAddEnergyParams,
  TideLinkTaskParams,
  TideListTaskLinksParams,
  TideGetReportParams,
  TidesGetParticipantsParams,
} from '../../types/mcp';
import type {
  TideCreateResponse,
  TideListResponse,
  FlowSessionResponse,
  EnergyUpdateResponse,
  TaskLinkResponse,
  TaskLinksListResponse,
  TideReportResponse,
  ParticipantsResponse,
} from '../../types/api';

export class MCPService extends BaseService {
  private requestId: number = 0;

  /**
   * Create an MCP JSON-RPC 2.0 request
   */
  private createMCPRequest<T>(method: string, params?: T): MCPRequest<T> {
    return {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };
  }

  /**
   * Execute MCP request
   */
  protected async mcpRequest<TParams = any, TResult = any>(
    method: string,
    params?: TParams
  ): Promise<TResult> {
    const mcpRequest = this.createMCPRequest(method, params);
    
    this.logRequest('debug', `MCP Request: ${method}`, params);

    const response = await this.post<MCPResponse<TResult>>('/mcp', mcpRequest);
    
    if (response.data.error) {
      throw this.createMCPError(response.data.error);
    }

    if (!response.data.result) {
      throw new Error(`No result in MCP response for method: ${method}`);
    }

    this.logRequest('debug', `MCP Response: ${method}`, response.data.result);

    return response.data.result;
  }

  /**
   * Create MCP-specific error
   */
  private createMCPError(error: MCPError): Error {
    const err = new Error(error.message);
    err.name = 'MCPError';
    (err as any).code = error.code;
    (err as any).data = error.data;
    return err;
  }

  // Tide management methods

  async createTide(params: TideCreateParams): Promise<TideCreateResponse> {
    return this.mcpRequest<TideCreateParams, TideCreateResponse>(
      MCPMethods.TIDE_CREATE,
      params
    );
  }

  async listTides(params?: TideListParams): Promise<TideListResponse> {
    return this.mcpRequest<TideListParams, TideListResponse>(
      MCPMethods.TIDE_LIST,
      params
    );
  }

  async startTideFlow(params: TideFlowParams): Promise<FlowSessionResponse> {
    return this.mcpRequest<TideFlowParams, FlowSessionResponse>(
      MCPMethods.TIDE_FLOW,
      params
    );
  }

  async addEnergyToTide(params: TideAddEnergyParams): Promise<EnergyUpdateResponse> {
    return this.mcpRequest<TideAddEnergyParams, EnergyUpdateResponse>(
      MCPMethods.TIDE_ADD_ENERGY,
      params
    );
  }

  async linkTaskToTide(params: TideLinkTaskParams): Promise<TaskLinkResponse> {
    return this.mcpRequest<TideLinkTaskParams, TaskLinkResponse>(
      MCPMethods.TIDE_LINK_TASK,
      params
    );
  }

  async listTaskLinks(params: TideListTaskLinksParams): Promise<TaskLinksListResponse> {
    return this.mcpRequest<TideListTaskLinksParams, TaskLinksListResponse>(
      MCPMethods.TIDE_LIST_TASK_LINKS,
      params
    );
  }

  async getTideReport(params: TideGetReportParams): Promise<TideReportResponse> {
    return this.mcpRequest<TideGetReportParams, TideReportResponse>(
      MCPMethods.TIDE_GET_REPORT,
      params
    );
  }

  async getParticipants(params?: TidesGetParticipantsParams): Promise<ParticipantsResponse> {
    return this.mcpRequest<TidesGetParticipantsParams, ParticipantsResponse>(
      MCPMethods.TIDES_GET_PARTICIPANTS,
      params
    );
  }

  // System methods

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.mcpRequest(MCPMethods.HEALTH_CHECK);
  }

  async listTools(): Promise<{ tools: string[] }> {
    return this.mcpRequest(MCPMethods.LIST_TOOLS);
  }
}