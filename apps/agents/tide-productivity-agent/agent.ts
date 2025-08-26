/**
 * TideProductivityAgent - Refactored Durable Object Agent
 * 
 * Clean, modular implementation of the productivity analysis agent
 * using service-oriented architecture and proper separation of concerns.
 */

import type { Env } from '../types';
import type { StatusResponse, UserContext } from './types';
import { MCPClient, AIAnalyzer, WebSocketManager, PreferencesStore } from './services';
import { TideFetcher } from './utils';
import { InsightsHandler, OptimizeHandler, QuestionsHandler, PreferencesHandler } from './handlers';

export class TideProductivityAgent implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  // Services - initialized in constructor
  private mcpClient!: MCPClient;
  private aiAnalyzer!: AIAnalyzer;
  private webSocketManager!: WebSocketManager;
  private preferencesStore!: PreferencesStore;
  private tideFetcher!: TideFetcher;
  
  // Handlers - initialized in constructor
  private insightsHandler!: InsightsHandler;
  private optimizeHandler!: OptimizeHandler;
  private questionsHandler!: QuestionsHandler;
  private preferencesHandler!: PreferencesHandler;

  // Agent lifecycle
  private startupTime: number;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.startupTime = Date.now();
    
    // Initialize services and handlers when the agent starts
    this.state.blockConcurrencyWhile(async () => {
      await this.initialize();
    });
  }

  /**
   * Initialize all services and handlers
   */
  private async initialize(): Promise<void> {
    // TODO: Add health checks for external dependencies
    // TODO: Implement graceful degradation if services fail to initialize
    try {
      // Determine environment context
      const environment = this.getEnvironment();
      const userContext: UserContext = {
        userId: 'system', // Default, overridden per request
        environment
      };

      // Initialize services
      this.mcpClient = new MCPClient(userContext);
      this.aiAnalyzer = new AIAnalyzer(this.env.AI);
      this.webSocketManager = new WebSocketManager();
      this.preferencesStore = new PreferencesStore(this.state.storage);
      this.tideFetcher = new TideFetcher(userContext);

      // Initialize handlers with service dependencies
      this.insightsHandler = new InsightsHandler(this.mcpClient, this.aiAnalyzer, this.tideFetcher);
      this.optimizeHandler = new OptimizeHandler(this.mcpClient, this.aiAnalyzer, this.tideFetcher);
      this.questionsHandler = new QuestionsHandler(this.mcpClient, this.aiAnalyzer, this.tideFetcher, this.webSocketManager);
      this.preferencesHandler = new PreferencesHandler(this.preferencesStore);

    } catch (error) {
      console.error('[TideProductivityAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Main fetch handler - routes requests to appropriate handlers
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    try {
      // Handle WebSocket upgrade requests
      if (request.headers.get('upgrade') === 'websocket') {
        return this.handleWebSocketUpgrade(request);
      }

      // Route to appropriate handler based on pathname
      switch (url.pathname) {
        case '/insights':
          return this.insightsHandler.handleRequest(request);
          
        case '/optimize':
          return this.optimizeHandler.handleRequest(request);
          
        case '/question':
          return this.questionsHandler.handleRequest(request);
          
        case '/preferences':
          return this.preferencesHandler.handleRequest(request);
          
        case '/status':
          return this.handleStatusRequest();
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            availableEndpoints: ['/insights', '/optimize', '/question', '/preferences', '/status'],
            webSocketEndpoint: 'ws://your-domain/agents/tide-productivity/ws'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }

    } catch (error) {
      console.error('[TideProductivityAgent] Request handling failed:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle WebSocket upgrade for real-time communication
   */
  private handleWebSocketUpgrade(_request: Request): Response {
    // TODO: Add WebSocket authentication and authorization
    // TODO: Implement connection rate limiting
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.webSocketManager.handleConnection(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle status/health check requests
   */
  private handleStatusRequest(): Response {
    const wsStats = this.webSocketManager.getStats();
    
    const status: StatusResponse = {
      status: 'healthy',
      agentId: this.state.id.toString(),
      connectedClients: wsStats.connectedClients,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startupTime
    };

    return new Response(JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Determine the current environment
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    const envValue = this.env.ENVIRONMENT;
    
    if (envValue === 'production') return 'production';
    if (envValue === 'staging') return 'staging';
    return 'development';
  }

  /**
   * Cleanup method (called when agent is being destroyed)
   */
  async cleanup(): Promise<void> {
    // TODO: Persist important agent state before cleanup
    // TODO: Notify connected clients about agent shutdown
    try {
      // Cleanup inactive WebSocket connections
      this.webSocketManager?.cleanupInactiveConnections();
    } catch (error) {
      console.error('[TideProductivityAgent] Cleanup error:', error);
    }
  }
}