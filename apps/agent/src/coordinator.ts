/**
 * Coordinator - Main Durable Object for Tides Agent
 * Routes requests to appropriate micro-services
 */

import type { Env, AgentRequest } from './types.js';
import { ResponseBuilder } from './responses.js';
import { AuthService } from './auth.js';
import { OrchestratorService } from './services/orchestrator.js';
import { AITester } from './ai-test.js';

export class Coordinator implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  // Lightweight service layer - orchestrator handles all business logic
  private authService: AuthService;
  private orchestratorService: OrchestratorService;
  private aiTester: AITester;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // Initialize lightweight service layer
    this.authService = new AuthService(env);
    this.orchestratorService = new OrchestratorService(env);
    this.aiTester = new AITester(env);

    console.log(`[Coordinator] Initialized for agent: ${state.id.toString()}`);
  }

  /**
   * Main request handler - routes to appropriate service
   */
  async fetch(request: Request): Promise<Response> {
    const startTime = performance.now();
    const url = new URL(request.url);
    
    console.log(`[Coordinator] ${request.method} ${url.pathname}`);

    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return ResponseBuilder.corsResponse();
      }

      // Validate request method
      const methodError = ResponseBuilder.validateMethod(request, ['GET', 'POST']);
      if (methodError) return methodError;

      // Handle GET requests (status, health checks, etc.)
      if (request.method === 'GET') {
        return await this.handleGetRequest(url.pathname, startTime);
      }

      // Handle POST requests (main service endpoints)
      return await this.handlePostRequest(request, url.pathname, startTime);

    } catch (error) {
      console.error(`[Coordinator] Unhandled error:`, error);
      return ResponseBuilder.error(
        'Internal server error',
        500,
        'coordinator'
      );
    }
  }

  /**
   * Handle GET requests
   */
  private async handleGetRequest(pathname: string, startTime: number): Promise<Response> {
    switch (pathname) {
      case '/status':
      case '/':
        return ResponseBuilder.success(
          {
            status: 'healthy',
            architecture: 'coordinator → orchestrator → services',
            available_services: ['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat'],
            version: '2.0.0',
            agent_id: this.state.id.toString()
          },
          'coordinator',
          performance.now() - startTime
        );

      case '/health':
        return ResponseBuilder.success(
          { healthy: true },
          'coordinator',
          performance.now() - startTime
        );

      case '/ai-test':
        console.log('[Coordinator] Running AI isolation tests...');
        const aiTestResults = await this.aiTester.runAllTests();
        return ResponseBuilder.success(
          aiTestResults,
          'ai-test',
          performance.now() - startTime
        );

      default:
        return ResponseBuilder.error(
          `GET ${pathname} not found. Available endpoints: /status, /health, /ai-test`,
          404,
          'coordinator'
        );
    }
  }

  /**
   * Handle POST requests - lightweight HTTP layer, delegates to orchestrator
   */
  private async handlePostRequest(request: Request, pathname: string, startTime: number): Promise<Response> {
    // Parse and validate request body
    const { data: body, error: parseError } = await ResponseBuilder.parseRequestBody<AgentRequest & { service?: string, r2_test_path?: string }>(request);
    if (parseError) return parseError;
    
    if (!body) {
      return ResponseBuilder.error('Request body is required', 400, 'coordinator');
    }

    // Special TDD test endpoint for direct R2 file path testing
    if (body.r2_test_path) {
      return await this.handleR2TestRequest(body.r2_test_path, startTime);
    }

    // Authentication
    console.log(`[Coordinator] Authenticating request`);
    const authResult = await this.authService.validateApiKey(body.api_key);
    if (!authResult.valid || !authResult.userId) {
      return ResponseBuilder.error('Invalid API key', 401, 'coordinator');
    }
    
    const userId = authResult.userId;
    console.log(`[Coordinator] Authentication successful for user: ${userId}`);

    // Delegate everything to orchestrator - it handles routing, inference, and execution
    try {
      const result = await this.orchestratorService.handleRequest(body, userId, pathname);
      return this.buildSuccessResponseWithTide(
        result.data, 
        result.service, 
        startTime, 
        result.inferenceInfo, 
        body, 
        userId
      );
    } catch (error) {
      console.error(`[Coordinator] Orchestrator error:`, error);
      return ResponseBuilder.error(
        error instanceof Error ? error.message : 'Service error',
        500,
        'orchestrator'
      );
    }
  }

  /**
   * Build success response with enhanced metadata including inference info
   */
  private buildSuccessResponse(data: any, service: string, startTime: number, inferenceInfo: any): Response {
    const response = {
      success: true,
      data,
      metadata: {
        service,
        timestamp: new Date().toISOString(),
        processing_time_ms: performance.now() - startTime,
        inference: inferenceInfo.confidence < 100 ? {
          confidence: inferenceInfo.confidence,
          reasoning: inferenceInfo.reasoning
        } : undefined
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  /**
   * Build success response with tide data included for debugging
   */
  private async buildSuccessResponseWithTide(data: any, service: string, startTime: number, inferenceInfo: any, requestBody: any, userId: string): Promise<Response> {
    // Get tide data for debugging if tides_id is provided
    let tideData = null;
    if (requestBody.tides_id) {
      try {
        const storage = new (await import('./storage.js')).StorageService(this.env);
        tideData = await storage.getTideDataFromAnySource(userId, requestBody.tides_id);
      } catch (error) {
        console.warn(`[Coordinator] Could not fetch tide data for debugging:`, error);
      }
    }

    const response: any = {
      success: true,
      data,
      metadata: {
        service,
        timestamp: new Date().toISOString(),
        processing_time_ms: performance.now() - startTime,
        inference: inferenceInfo.confidence < 100 ? {
          confidence: inferenceInfo.confidence,
          reasoning: inferenceInfo.reasoning
        } : undefined
      }
    };

    // Add tide data as separate top-level section for debugging
    if (tideData) {
      response.tide = {
        id: tideData.id,
        name: tideData.name,
        flow_sessions: tideData.flow_sessions || [],
        energy_updates: tideData.energy_updates || [],
        task_links: tideData.task_links || []
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  /**
   * Handle direct R2 file path testing requests for TDD
   * Bypasses authentication and user lookup for direct file access testing
   */
  private async handleR2TestRequest(r2Path: string, startTime: number): Promise<Response> {
    try {
      console.log(`[Coordinator] R2 Test Request - Direct path: ${r2Path}`);
      
      // Direct R2 file fetch without user lookup
      const r2Object = await this.env.TIDES_R2.get(r2Path);
      
      if (!r2Object) {
        return ResponseBuilder.success({
          test_result: 'file_not_found',
          r2_path: r2Path,
          bucket: this.env.R2_BUCKET_NAME || 'unknown',
          environment: this.env.ENVIRONMENT || 'unknown'
        }, {
          service: 'r2-test',
          timestamp: new Date().toISOString(),
          processing_time_ms: performance.now() - startTime
        });
      }

      const fileContent = await r2Object.json();
      
      return ResponseBuilder.success({
        test_result: 'file_found',
        r2_path: r2Path,
        bucket: this.env.R2_BUCKET_NAME || 'unknown',
        environment: this.env.ENVIRONMENT || 'unknown',
        file_size: r2Object.size,
        content_type: r2Object.httpMetadata?.contentType || 'unknown',
        tide_data: fileContent
      }, {
        service: 'r2-test',
        timestamp: new Date().toISOString(),
        processing_time_ms: performance.now() - startTime
      });

    } catch (error) {
      console.error(`[Coordinator] R2 Test Request failed:`, error);
      return ResponseBuilder.error(
        `R2 test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'r2-test'
      );
    }
  }
}