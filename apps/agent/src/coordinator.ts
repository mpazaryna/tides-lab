/**
 * Coordinator - Main Durable Object for Tides Agent
 * Routes requests to appropriate micro-services
 */

import type { Env, AgentRequest } from './types.js';
import { ResponseBuilder } from './responses.js';
import { AuthService } from './auth.js';
import { ServiceInferrer } from './service-inferrer.js';
import { InsightsService } from './services/insights.js';
import { OptimizeService } from './services/optimize.js';
import { QuestionsService } from './services/questions.js';
import { PreferencesService } from './services/preferences.js';
import { ReportsService } from './services/reports.js';
import { ChatService } from './services/chat.js';
import { AITester } from './ai-test.js';

export class Coordinator implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  // Services
  private authService: AuthService;
  private insightsService: InsightsService;
  private optimizeService: OptimizeService;
  private questionsService: QuestionsService;
  private preferencesService: PreferencesService;
  private reportsService: ReportsService;
  private chatService: ChatService;
  private aiTester: AITester;
  private serviceInferrer: ServiceInferrer;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // Initialize services
    this.authService = new AuthService(env);
    this.insightsService = new InsightsService(env);
    this.optimizeService = new OptimizeService(env);
    this.questionsService = new QuestionsService(env);
    this.preferencesService = new PreferencesService(env);
    this.reportsService = new ReportsService(env);
    this.chatService = new ChatService(env);
    this.aiTester = new AITester(env);
    this.serviceInferrer = new ServiceInferrer(env);

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
            services: ['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat'],
            version: '1.0.0',
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
   * Handle POST requests - route to appropriate service
   */
  private async handlePostRequest(request: Request, pathname: string, startTime: number): Promise<Response> {
    // Parse and validate request body
    const { data: body, error: parseError } = await ResponseBuilder.parseRequestBody<AgentRequest & { service?: string }>(request);
    if (parseError) return parseError;
    
    if (!body) {
      return ResponseBuilder.error('Request body is required', 400, 'coordinator');
    }

    // Determine target service using intelligent inference
    let targetService: string;
    let inferenceInfo = { confidence: 100, reasoning: 'Explicit endpoint' };
    
    if (pathname === '/coordinator' || pathname === '/') {
      // Use intelligent service inference with chat fallback for coordinator endpoint
      const aiInference = await this.serviceInferrer.inferServiceWithAI(body);
      const inferredService = aiInference.service;
      
      if (!inferredService) {
        // This should rarely happen now with chat fallback, but keep for safety
        const suggestion = ServiceInferrer.suggestService(body);
        return ResponseBuilder.error(
          `Could not determine service from request content. Suggested: ${suggestion.suggested} (${suggestion.confidence}% confidence). Reason: ${suggestion.reasoning}. Add 'service' field to be explicit.`,
          400,
          'coordinator'
        );
      }
      
      targetService = inferredService;
      inferenceInfo = { 
        confidence: aiInference.confidence, 
        reasoning: body.service ? 'Explicit service field' : 'AI-powered semantic analysis' 
      };
      
      console.log(`[Coordinator] Service inferred: ${targetService} (${aiInference.confidence}% confidence)`);
    } else {
      // Legacy direct endpoint support (for backwards compatibility)
      targetService = pathname.substring(1); // Remove leading slash
    }

    // Validate service
    const validServices = ['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat'];
    if (!validServices.includes(targetService)) {
      return ResponseBuilder.error(
        `Invalid service: ${targetService}. Available services: ${validServices.join(', ')}`,
        400,
        'coordinator'
      );
    }

    // Mock authentication for TDD/iOS integration
    console.log(`[Coordinator] Using mock authentication for TDD development`);
    console.log(`[Coordinator] Request API key: ${body.api_key?.substring(0, 10)}...`);
    console.log(`[Coordinator] Target service: ${targetService}`);
    
    // Mock authentication - accept any API key and use testuser101 as default user
    const userId = 'testuser101';
    console.log(`[Coordinator] Mock authentication successful for user: ${userId}`);

    // Route to appropriate service
    try {
      switch (targetService) {
        case 'insights':
          const insightsResult = await this.insightsService.generateInsights(body as any, userId);
          return this.buildSuccessResponse(insightsResult, 'insights', startTime, inferenceInfo);

        case 'optimize':
          const optimizeResult = await this.optimizeService.optimizeSchedule(body as any, userId);
          return this.buildSuccessResponse(optimizeResult, 'optimize', startTime, inferenceInfo);

        case 'questions':
          const questionsResult = await this.questionsService.processQuestion(body as any, userId);
          return this.buildSuccessResponse(questionsResult, 'questions', startTime, inferenceInfo);

        case 'preferences':
          if ('preferences' in body && body.preferences) {
            // Update preferences
            const updateResult = await this.preferencesService.updatePreferences(body as any, userId);
            return this.buildSuccessResponse(updateResult, 'preferences', startTime, inferenceInfo);
          } else {
            // Get preferences
            const getResult = await this.preferencesService.getPreferences(userId);
            return this.buildSuccessResponse(getResult, 'preferences', startTime, inferenceInfo);
          }

        case 'reports':
          const reportsResult = await this.reportsService.generateReport(body as any, userId);
          return this.buildSuccessResponse(reportsResult, 'reports', startTime, inferenceInfo);

        case 'chat':
          const chatResult = await this.chatService.clarifyIntent(body as any, userId);
          return this.buildSuccessResponse(chatResult, 'chat', startTime, inferenceInfo);

        default:
          return ResponseBuilder.error(
            `Service ${targetService} not implemented`,
            500,
            'coordinator'
          );
      }

    } catch (error) {
      console.error(`[Coordinator] Service error for ${targetService}:`, error);
      return ResponseBuilder.error(
        error instanceof Error ? error.message : 'Service error',
        500,
        targetService
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
}