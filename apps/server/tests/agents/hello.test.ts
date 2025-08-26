import { HelloAgent } from '@agents/hello';
import { Env } from '@agents/types';

// Mock WebSocketPair globally
(globalThis as any).WebSocketPair = class {
  0: any;
  1: any;
  constructor() {
    this[0] = { send: jest.fn(), close: jest.fn() };
    this[1] = { send: jest.fn(), close: jest.fn(), accept: jest.fn(), addEventListener: jest.fn() };
  }
};

describe('HelloAgent', () => {
  let agent: HelloAgent;
  let state: any; // Mock DurableObjectState
  let env: Env;

  beforeEach(() => {
    // Mock storage with Map-like interface
    const storageMap = new Map();
    const mockStorage = {
      get: jest.fn((key) => Promise.resolve(storageMap.get(key))),
      put: jest.fn((key, value) => {
        storageMap.set(key, value);
        return Promise.resolve();
      }),
      delete: jest.fn((key) => {
        storageMap.delete(key);
        return Promise.resolve();
      }),
      list: jest.fn(() => Promise.resolve(storageMap))
    };

    // Mock DurableObjectState
    state = {
      storage: mockStorage,
      id: { toString: () => 'test-agent-id', name: 'test-agent' } as any,
      waitUntil: jest.fn(),
      blockConcurrencyWhile: jest.fn((fn) => fn())
    } as any;

    // Mock environment
    env = {} as Env;

    agent = new HelloAgent(state, env);
  });

  describe('REST API', () => {
    it('should respond to GET /hello with greeting', async () => {
      const request = new Request('http://example.com/hello');
      const response = await agent.fetch(request);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.message).toBe('Hello from HelloAgent!');
      expect(data.agentId).toBe('test-agent-id');
    });

    it('should handle POST /hello with name', async () => {
      const request = new Request('http://example.com/hello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Tides' })
      });

      const response = await agent.fetch(request);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.message).toBe('Hello, Tides!');
      expect(data.timestamp).toBeDefined();
    });

    it('should track visit count', async () => {
      // First visit
      let request = new Request('http://example.com/visits');
      let response = await agent.fetch(request);
      let data = await response.json() as any;

      expect(data.visits).toBe(1);

      // Second visit
      request = new Request('http://example.com/visits');
      response = await agent.fetch(request);
      data = await response.json() as any;

      expect(data.visits).toBe(2);
    });

    it('should store and retrieve messages', async () => {
      // Store a message
      const storeRequest = new Request('http://example.com/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' })
      });

      let response = await agent.fetch(storeRequest);
      expect(response.status).toBe(200);

      // Retrieve messages
      const getRequest = new Request('http://example.com/messages');
      response = await agent.fetch(getRequest);
      const data = await response.json() as any;

      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].text).toBe('Test message');
      expect(data.messages[0].timestamp).toBeDefined();
    });

    it('should handle state reset', async () => {
      // Add some visits
      await agent.fetch(new Request('http://example.com/visits'));
      await agent.fetch(new Request('http://example.com/visits'));

      // Reset
      const request = new Request('http://example.com/reset', {
        method: 'POST'
      });
      const response = await agent.fetch(request);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.message).toBe('Agent state reset');

      // Check visits are reset
      const visitsResponse = await agent.fetch(new Request('http://example.com/visits'));
      const visitsData = await visitsResponse.json() as any;
      expect(visitsData.visits).toBe(1);
    });

    it('should return 404 for unknown routes', async () => {
      const request = new Request('http://example.com/unknown');
      const response = await agent.fetch(request);

      expect(response.status).toBe(404);
    });
  });

  describe('WebSocket', () => {
    it('should accept WebSocket connections', async () => {
      const request = new Request('http://example.com/ws', {
        headers: { 'Upgrade': 'websocket' }
      });

      // Mock the Response constructor to allow status 101
      const originalResponse = globalThis.Response;
      globalThis.Response = jest.fn((_body, init) => {
        return { 
          status: init?.status || 200, 
          webSocket: (init as any)?.webSocket 
        } as any;
      }) as any;

      const response = await agent.fetch(request);

      expect(response.status).toBe(101);
      expect((response as any).webSocket).toBeDefined();

      // Restore original Response
      globalThis.Response = originalResponse;
    });

    it('should handle WebSocket messages', async () => {
      // This is more complex to test without a real WebSocket environment
      // We'll test the message handler directly
      const mockSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        accept: jest.fn()
      } as any;

      // Simulate WebSocket connection
      await agent.handleWebSocket(mockSocket);

      // Verify socket was accepted
      expect(mockSocket.accept).toHaveBeenCalled();

      // Get the message handler that was registered
      const messageCall = mockSocket.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      );
      expect(messageCall).toBeDefined();

      // Simulate a ping message
      const messageHandler = messageCall[1];
      await messageHandler({ data: JSON.stringify({ type: 'ping' }) });

      // Verify pong was sent (after welcome message)
      expect(mockSocket.send).toHaveBeenCalledTimes(2);
      const pongCall = mockSocket.send.mock.calls[1][0];
      const pongData = JSON.parse(pongCall);
      expect(pongData.type).toBe('pong');
      expect(pongData.timestamp).toBeDefined();
    });

    it('should broadcast messages to connected clients', async () => {
      const mockSocket1 = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        accept: jest.fn(),
        readyState: 1 // OPEN
      } as any;

      const mockSocket2 = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        accept: jest.fn(),
        readyState: 1 // OPEN
      } as any;

      // Connect two clients
      await agent.handleWebSocket(mockSocket1);
      await agent.handleWebSocket(mockSocket2);

      // Broadcast a message
      await agent.broadcast({ type: 'announcement', message: 'Hello everyone!' });

      // Both clients should receive the message
      expect(mockSocket1.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'announcement', message: 'Hello everyone!' })
      );
      expect(mockSocket2.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'announcement', message: 'Hello everyone!' })
      );
    });

    it('should handle WebSocket echo command', async () => {
      const mockSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        accept: jest.fn()
      } as any;

      await agent.handleWebSocket(mockSocket);

      // Get the message handler
      const messageCall = mockSocket.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      );
      const messageHandler = messageCall[1];

      // Send echo command
      await messageHandler({ 
        data: JSON.stringify({ 
          type: 'echo', 
          payload: 'Test echo message' 
        }) 
      });

      // Verify echo response (after welcome message)
      expect(mockSocket.send).toHaveBeenCalledTimes(2);
      const echoCall = mockSocket.send.mock.calls[1][0];
      const echoData = JSON.parse(echoCall);
      expect(echoData.type).toBe('echo_response');
      expect(echoData.payload).toBe('Test echo message');
      expect(echoData.timestamp).toBeDefined();
    });

    it('should track connected clients count', async () => {
      const mockSocket1 = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        accept: jest.fn(),
        readyState: 1
      } as any;

      // Connect a client
      await agent.handleWebSocket(mockSocket1);

      // Check stats
      const request = new Request('http://example.com/stats');
      const response = await agent.fetch(request);
      const data = await response.json() as any;

      expect(data.connectedClients).toBe(1);
    });
  });

  describe('State persistence', () => {
    it('should persist state to storage', async () => {
      const mockStorage = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        list: jest.fn()
      };

      state.storage = mockStorage as any;
      agent = new HelloAgent(state, env);

      // Trigger a visit to save state
      await agent.fetch(new Request('http://example.com/visits'));

      // Verify state was saved
      expect(mockStorage.put).toHaveBeenCalledWith('visits', 1);
    });

    it('should load state from storage on init', async () => {
      const mockStorage = {
        get: jest.fn().mockResolvedValue(5),
        put: jest.fn(),
        delete: jest.fn(),
        list: jest.fn()
      };

      state.storage = mockStorage as any;
      agent = new HelloAgent(state, env);

      // Initialize the agent (this happens in constructor)
      await agent.initialize();

      // Check that visits were loaded
      const request = new Request('http://example.com/visits');
      const response = await agent.fetch(request);
      const data = await response.json() as any;

      // Should increment from loaded value
      expect(data.visits).toBe(6);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in POST requests', async () => {
      const request = new Request('http://example.com/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await agent.fetch(request);
      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle WebSocket errors gracefully', async () => {
      const mockSocket = {
        send: jest.fn().mockImplementation(() => {
          throw new Error('Socket error');
        }),
        close: jest.fn(),
        addEventListener: jest.fn(),
        accept: jest.fn()
      } as any;

      // Should not throw
      await expect(agent.handleWebSocket(mockSocket)).resolves.not.toThrow();
      expect(mockSocket.close).toHaveBeenCalled();
    });
  });
});