import type { Env } from '../types';

/**
 * Represents a stored message in the HelloAgent
 * @interface Message
 */
interface Message {
  /** The text content of the message */
  text: string;
  /** Unix timestamp when the message was created */
  timestamp: number;
}

/**
 * HelloAgent - A test/demo Durable Object agent that demonstrates the agent pattern
 * 
 * This agent serves as a reference implementation for the Tides autonomous agent system.
 * It showcases key patterns including:
 * - State persistence using Durable Object storage
 * - REST API endpoints for external interaction
 * - WebSocket support for real-time communication
 * - Multi-client broadcasting capabilities
 * - Error handling and recovery
 * 
 * ## REST API Endpoints
 * 
 * ### GET /hello
 * Returns a simple greeting message
 * ```typescript
 * // Response
 * {
 *   message: "Hello from HelloAgent!",
 *   agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
 * }
 * ```
 * 
 * ### POST /hello
 * Returns a personalized greeting
 * ```typescript
 * // Request
 * { name: "React Native" }
 * 
 * // Response
 * {
 *   message: "Hello, React Native!",
 *   timestamp: 1754511234567,
 *   agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
 * }
 * ```
 * 
 * ### GET /visits
 * Increments and returns the visit counter (demonstrates state persistence)
 * ```typescript
 * // Response
 * {
 *   visits: 42,
 *   agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
 * }
 * ```
 * 
 * ### POST /message
 * Stores a message and broadcasts to connected WebSocket clients
 * ```typescript
 * // Request
 * { message: "Hello from React Native!" }
 * 
 * // Response
 * { success: true, message: "Message stored" }
 * ```
 * 
 * ### GET /messages
 * Retrieves all stored messages
 * ```typescript
 * // Response
 * {
 *   messages: [
 *     { text: "Hello world", timestamp: 1754511234567 },
 *     { text: "Another message", timestamp: 1754511234890 }
 *   ],
 *   count: 2
 * }
 * ```
 * 
 * ### GET /stats
 * Returns agent statistics and health information
 * ```typescript
 * // Response
 * {
 *   visits: 42,
 *   messageCount: 15,
 *   connectedClients: 3,
 *   agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482",
 *   uptime: 1754511234567
 * }
 * ```
 * 
 * ### POST /reset
 * Resets all agent state (visits=0, messages=[])
 * ```typescript
 * // Response
 * {
 *   message: "Agent state reset",
 *   agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
 * }
 * ```
 * 
 * ## WebSocket API
 * 
 * Connect to the agent via WebSocket for real-time interaction:
 * ```typescript
 * const ws = new WebSocket('wss://tides-001.mpazbot.workers.dev/agents/hello/ws');
 * ```
 * 
 * ### Welcome Message
 * Sent immediately upon connection:
 * ```typescript
 * {
 *   type: 'welcome',
 *   message: 'Connected to HelloAgent',
 *   agentId: 'f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482',
 *   timestamp: 1754511234567
 * }
 * ```
 * 
 * ### Ping/Pong
 * Test connection health:
 * ```typescript
 * // Send
 * { type: 'ping' }
 * 
 * // Receive
 * { type: 'pong', timestamp: 1754511234567 }
 * ```
 * 
 * ### Echo
 * Echo back any payload:
 * ```typescript
 * // Send
 * { type: 'echo', payload: 'Hello WebSocket!' }
 * 
 * // Receive
 * { type: 'echo_response', payload: 'Hello WebSocket!', timestamp: 1754511234567 }
 * ```
 * 
 * ### Broadcast
 * Send a message to all connected clients:
 * ```typescript
 * // Send
 * { type: 'broadcast', message: 'Hello everyone!' }
 * 
 * // All clients receive
 * {
 *   type: 'broadcast',
 *   from: 'f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482',
 *   message: 'Hello everyone!',
 *   timestamp: 1754511234567
 * }
 * ```
 * 
 * ### Get Stats
 * Request current agent statistics:
 * ```typescript
 * // Send
 * { type: 'get_stats' }
 * 
 * // Receive
 * {
 *   type: 'stats',
 *   visits: 42,
 *   messageCount: 15,
 *   connectedClients: 3
 * }
 * ```
 * 
 * ## React Native Integration Example
 * 
 * ```typescript
 * // REST API usage
 * const response = await fetch('https://tides-001.mpazbot.workers.dev/agents/hello/hello', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'React Native App' })
 * });
 * const data = await response.json();
 * console.log(data.message); // "Hello, React Native App!"
 * 
 * // WebSocket usage
 * const ws = new WebSocket('wss://tides-001.mpazbot.workers.dev/agents/hello/ws');
 * 
 * ws.onmessage = (event) => {
 *   const message = JSON.parse(event.data);
 *   if (message.type === 'welcome') {
 *     console.log('Connected to HelloAgent');
 *   }
 * };
 * 
 * ws.onopen = () => {
 *   // Send ping to test connection
 *   ws.send(JSON.stringify({ type: 'ping' }));
 * };
 * ```
 * 
 * ## State Persistence
 * 
 * The HelloAgent demonstrates Durable Object state persistence patterns:
 * - **Automatic initialization**: Loads state from storage on construction
 * - **Incremental updates**: Saves state after each modification
 * - **Crash recovery**: State survives agent restarts
 * - **Cross-instance isolation**: Each agent ID maintains separate state
 * 
 * ## Error Handling
 * 
 * The agent implements comprehensive error handling:
 * - **400 Bad Request**: Invalid JSON in POST requests
 * - **404 Not Found**: Unknown REST endpoints
 * - **405 Method Not Allowed**: Wrong HTTP method
 * - **500 Internal Server Error**: Unexpected errors with details
 * - **WebSocket errors**: Graceful client disconnection handling
 * 
 * ## Usage in Tides System
 * 
 * HelloAgent serves as a reference for implementing production agents:
 * - **TideAgent**: Autonomous flow session management
 * - **AnalyticsAgent**: Productivity pattern analysis
 * - **NotificationAgent**: Smart reminder system
 * - **CollaborationAgent**: Multi-user session coordination
 * 
 * @example Basic usage from main worker
 * ```typescript
 * // Route to HelloAgent
 * const helloId = env.HELLO_AGENT.idFromName('user-123');
 * const helloAgent = env.HELLO_AGENT.get(helloId);
 * return helloAgent.fetch(request);
 * ```
 */
export class HelloAgent implements DurableObject {
  /** Durable Object state interface for persistence */
  private state: DurableObjectState;
  
  /** Environment bindings and configuration */
  private env: Env;
  
  /** Visit counter - demonstrates persistent numeric state */
  private visits: number = 0;
  
  /** Message storage - demonstrates persistent array state */
  private messages: Message[] = [];
  
  /** Active WebSocket connections for real-time communication */
  private connectedClients: Set<WebSocket> = new Set();

  /**
   * Creates a new HelloAgent instance
   * 
   * The constructor automatically initializes state from Durable Object storage,
   * ensuring the agent resumes with previous state after restarts.
   * 
   * @param state - Durable Object state interface
   * @param env - Environment bindings (HELLO_AGENT, DB, etc.)
   */
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // Initialize from storage using blockConcurrencyWhile to ensure
    // state is loaded before processing any requests
    this.state.blockConcurrencyWhile(async () => {
      await this.initialize();
    });
  }

  /**
   * Initializes agent state from Durable Object storage
   * 
   * This method is called during construction to restore persistent state.
   * It handles cases where storage is empty (new agent) or contains previous state.
   * 
   * @private
   * @returns Promise that resolves when initialization is complete
   */
  async initialize() {
    // TODO: Add state migration handling for schema changes
    // TODO: Implement data validation for loaded state
    // Load visit counter from storage
    const storedVisits = await this.state.storage.get<number>('visits');
    if (storedVisits !== undefined) {
      this.visits = storedVisits;
    }

    // Load message history from storage  
    const storedMessages = await this.state.storage.get<Message[]>('messages');
    if (storedMessages) {
      this.messages = storedMessages;
    }
  }

  /**
   * Main request handler for the HelloAgent
   * 
   * Routes incoming HTTP requests to appropriate handlers based on:
   * - WebSocket upgrade requests → handleWebSocket()
   * - REST API endpoints → specific handler methods
   * 
   * Implements comprehensive error handling and returns JSON responses.
   * 
   * @param request - Incoming HTTP request
   * @returns Promise resolving to HTTP response
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      await this.handleWebSocket(pair[1]);
      return new Response(null, { 
        status: 101, 
        webSocket: pair[0] 
      });
    }

    // REST API route handling with comprehensive error handling
    try {
      switch (path) {
        case '/hello':
          return this.handleHello(request);
        
        case '/visits':
          return this.handleVisits();
        
        case '/message':
          return this.handleMessage(request);
        
        case '/messages':
          return this.handleGetMessages();
        
        case '/reset':
          if (request.method === 'POST') {
            return this.handleReset();
          }
          break;
        
        case '/stats':
          return this.handleStats();
      }

      // Return 404 for unknown endpoints
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // Handle unexpected errors gracefully
      // TODO: Add error reporting and logging for production debugging
      // TODO: Implement error rate limiting to prevent spam
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handles GET/POST requests to /hello endpoint
   * 
   * - GET: Returns simple greeting with agent ID
   * - POST: Returns personalized greeting with optional name from request body
   * 
   * @param request - HTTP request object
   * @returns JSON response with greeting message
   * @private
   */
  private async handleHello(request: Request): Promise<Response> {
    if (request.method === 'POST') {
      try {
        const body = await request.json() as { name?: string };
        return new Response(JSON.stringify({
          message: body.name ? `Hello, ${body.name}!` : 'Hello!',
          timestamp: Date.now(),
          agentId: this.state.id.toString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Hello from HelloAgent!',
      agentId: this.state.id.toString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Handles GET requests to /visits endpoint
   * 
   * Increments the visit counter and persists to storage.
   * Demonstrates state persistence patterns for Durable Objects.
   * 
   * @returns JSON response with current visit count
   * @private
   */
  private async handleVisits(): Promise<Response> {
    this.visits++;
    await this.state.storage.put('visits', this.visits);

    return new Response(JSON.stringify({
      visits: this.visits,
      agentId: this.state.id.toString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Handles POST requests to /message endpoint
   * 
   * Stores a message in persistent storage and broadcasts to all connected
   * WebSocket clients. Demonstrates both persistence and real-time communication.
   * 
   * @param request - HTTP request with JSON body containing message
   * @returns JSON response confirming message storage
   * @private
   */
  private async handleMessage(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json() as { message: string };
      const message: Message = {
        text: body.message,
        timestamp: Date.now()
      };

      // Store message persistently
      // TODO: Add message size validation and limits
      // TODO: Implement message retention policy (e.g., max 1000 messages)
      this.messages.push(message);
      await this.state.storage.put('messages', this.messages);

      // Broadcast to connected WebSocket clients for real-time updates
      await this.broadcast({
        type: 'new_message',
        message: message
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Message stored'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handles GET requests to /messages endpoint
   * 
   * Returns all stored messages with metadata.
   * 
   * @returns JSON response with message array and count
   * @private
   */
  private async handleGetMessages(): Promise<Response> {
    return new Response(JSON.stringify({
      messages: this.messages,
      count: this.messages.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Handles POST requests to /reset endpoint
   * 
   * Resets all agent state to initial values and persists changes.
   * Useful for testing and demo purposes.
   * 
   * @returns JSON response confirming reset
   * @private
   */
  private async handleReset(): Promise<Response> {
    this.visits = 0;
    this.messages = [];
    await this.state.storage.put('visits', 0);
    await this.state.storage.put('messages', []);

    return new Response(JSON.stringify({
      message: 'Agent state reset',
      agentId: this.state.id.toString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Handles GET requests to /stats endpoint
   * 
   * Returns current agent statistics including state and connection info.
   * Useful for health monitoring and debugging.
   * 
   * @returns JSON response with comprehensive agent statistics
   * @private
   */
  private async handleStats(): Promise<Response> {
    return new Response(JSON.stringify({
      visits: this.visits,
      messageCount: this.messages.length,
      connectedClients: this.connectedClients.size,
      agentId: this.state.id.toString(),
      uptime: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Handles WebSocket connection setup and lifecycle management
   * 
   * Sets up event listeners for:
   * - message: Routes to handleWebSocketMessage()
   * - close: Cleans up connection tracking
   * - error: Handles connection errors gracefully
   * 
   * Sends a welcome message upon successful connection.
   * 
   * @param webSocket - WebSocket connection to handle
   * @returns Promise that resolves when setup is complete
   */
  async handleWebSocket(webSocket: WebSocket): Promise<void> {
    try {
      webSocket.accept();
      this.connectedClients.add(webSocket);

      // Send welcome message with agent info
      webSocket.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to HelloAgent',
        agentId: this.state.id.toString(),
        timestamp: Date.now()
      }));

      // Handle incoming WebSocket messages
      webSocket.addEventListener('message', async (event) => {
        try {
          const data = JSON.parse(event.data as string);
          await this.handleWebSocketMessage(webSocket, data);
        } catch (e) {
          webSocket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Clean up on connection close
      webSocket.addEventListener('close', () => {
        this.connectedClients.delete(webSocket);
      });

      // Handle connection errors
      webSocket.addEventListener('error', () => {
        this.connectedClients.delete(webSocket);
      });

    } catch (error) {
      webSocket.close();
    }
  }

  /**
   * Routes WebSocket messages to appropriate handlers
   * 
   * Supports these message types:
   * - ping: Responds with pong for connection testing
   * - echo: Echoes back the payload
   * - broadcast: Sends message to all connected clients
   * - get_stats: Returns current agent statistics
   * 
   * @param webSocket - The WebSocket connection that sent the message
   * @param data - Parsed JSON message data
   * @private
   */
  private async handleWebSocketMessage(webSocket: WebSocket, data: any): Promise<void> {
    switch (data.type) {
      case 'ping':
        webSocket.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        break;

      case 'echo':
        webSocket.send(JSON.stringify({
          type: 'echo_response',
          payload: data.payload,
          timestamp: Date.now()
        }));
        break;

      case 'broadcast':
        await this.broadcast({
          type: 'broadcast',
          from: this.state.id.toString(),
          message: data.message,
          timestamp: Date.now()
        });
        break;

      case 'get_stats':
        webSocket.send(JSON.stringify({
          type: 'stats',
          visits: this.visits,
          messageCount: this.messages.length,
          connectedClients: this.connectedClients.size
        }));
        break;

      default:
        webSocket.send(JSON.stringify({
          type: 'unknown_command',
          message: `Unknown command: ${data.type}`
        }));
    }
  }

  /**
   * Broadcasts a message to all connected WebSocket clients
   * 
   * Automatically handles connection cleanup by removing clients
   * that are no longer connected or fail to receive the message.
   * 
   * This method is used for:
   * - Broadcasting new stored messages to all clients
   * - Distributing broadcast commands from one client to all others
   * - System-wide notifications or updates
   * 
   * @param message - Message object to broadcast (will be JSON stringified)
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcast(message: any): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    for (const client of this.connectedClients) {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(messageStr);
        } else {
          // Remove disconnected clients
          this.connectedClients.delete(client);
        }
      } catch (e) {
        // Remove clients that failed to receive message
        this.connectedClients.delete(client);
      }
    }
  }
}