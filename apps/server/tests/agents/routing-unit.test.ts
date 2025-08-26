// Test the agent routing logic without importing the full index.ts

describe('Agent Routing Logic', () => {
  // Simulated routing function extracted from index.ts
  async function handleAgentRequest(request: Request, env: any, url: URL): Promise<Response> {
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
      return new Response('Invalid agent path', { status: 400 });
    }
    
    const agentType = pathParts[0]; // 'agents'
    const agentName = pathParts[1]; // 'hello', 'tide', etc.
    const agentPath = '/' + pathParts.slice(2).join('/'); // remaining path
    
    // Route to appropriate agent based on name
    switch (agentName) {
      case 'hello':
        if (!env.HELLO_AGENT) {
          return new Response('HelloAgent not configured', { status: 500 });
        }
        // Use a stable ID for testing, or derive from user/session
        const helloId = env.HELLO_AGENT.idFromName('test-instance');
        const helloAgent = env.HELLO_AGENT.get(helloId);
        
        // Rewrite URL to remove /agents/hello prefix
        const agentUrl = new URL(request.url);
        agentUrl.pathname = agentPath || '/';
        const agentRequest = new Request(agentUrl.toString(), request);
        
        return helloAgent.fetch(agentRequest);
      
      default:
        return new Response(`Unknown agent: ${agentName}`, { status: 404 });
    }
  }

  let mockEnv: any;
  let mockHelloAgent: any;

  beforeEach(() => {
    // Mock HelloAgent instance
    mockHelloAgent = {
      fetch: jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Hello from HelloAgent!' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    };

    // Mock environment with HelloAgent binding
    mockEnv = {
      HELLO_AGENT: {
        idFromName: jest.fn().mockReturnValue('test-id'),
        get: jest.fn().mockReturnValue(mockHelloAgent)
      }
    };
  });

  describe('Basic routing', () => {
    it('should route /agents/hello/* to HelloAgent', async () => {
      const url = new URL('http://example.com/agents/hello/test');
      const request = new Request(url.toString());
      
      await handleAgentRequest(request, mockEnv, url);

      expect(mockEnv.HELLO_AGENT.idFromName).toHaveBeenCalledWith('test-instance');
      expect(mockEnv.HELLO_AGENT.get).toHaveBeenCalledWith('test-id');
      expect(mockHelloAgent.fetch).toHaveBeenCalled();
    });

    it('should rewrite paths correctly for agents', async () => {
      const url = new URL('http://example.com/agents/hello/visits');
      const request = new Request(url.toString());
      
      await handleAgentRequest(request, mockEnv, url);

      // Check that the agent received the rewritten path
      const agentRequest = mockHelloAgent.fetch.mock.calls[0][0];
      const agentUrl = new URL(agentRequest.url);
      expect(agentUrl.pathname).toBe('/visits');
    });

    it('should preserve request method and headers', async () => {
      const url = new URL('http://example.com/agents/hello/message');
      const request = new Request(url.toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test-value'
        },
        body: JSON.stringify({ message: 'Test' })
      });

      await handleAgentRequest(request, mockEnv, url);

      const agentRequest = mockHelloAgent.fetch.mock.calls[0][0];
      expect(agentRequest.method).toBe('POST');
      expect(agentRequest.headers.get('Content-Type')).toBe('application/json');
      expect(agentRequest.headers.get('X-Custom-Header')).toBe('test-value');
    });

    it('should handle root agent path', async () => {
      const url = new URL('http://example.com/agents/hello');
      const request = new Request(url.toString());
      
      await handleAgentRequest(request, mockEnv, url);

      const agentRequest = mockHelloAgent.fetch.mock.calls[0][0];
      const agentUrl = new URL(agentRequest.url);
      expect(agentUrl.pathname).toBe('/');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown agents', async () => {
      const url = new URL('http://example.com/agents/unknown/test');
      const request = new Request(url.toString());
      
      const response = await handleAgentRequest(request, mockEnv, url);
      
      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toBe('Unknown agent: unknown');
    });

    it('should return 400 for invalid agent paths', async () => {
      const url = new URL('http://example.com/agents/');
      const request = new Request(url.toString());
      
      const response = await handleAgentRequest(request, mockEnv, url);
      
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('Invalid agent path');
    });

    it('should return 500 if HelloAgent is not configured', async () => {
      delete mockEnv.HELLO_AGENT;
      
      const url = new URL('http://example.com/agents/hello/test');
      const request = new Request(url.toString());
      
      const response = await handleAgentRequest(request, mockEnv, url);
      
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('HelloAgent not configured');
    });
  });

  describe('WebSocket support', () => {
    it('should pass WebSocket upgrade requests through', async () => {
      const url = new URL('http://example.com/agents/hello/ws');
      const request = new Request(url.toString(), {
        headers: { 'Upgrade': 'websocket' }
      });

      // Mock Response with status 101 (WebSocket upgrade)
      const mockResponse = { status: 101, headers: new Headers() } as any;
      mockHelloAgent.fetch.mockResolvedValue(mockResponse);

      const response = await handleAgentRequest(request, mockEnv, url);
      
      expect(response.status).toBe(101);
      expect(mockHelloAgent.fetch).toHaveBeenCalled();
      
      const agentRequest = mockHelloAgent.fetch.mock.calls[0][0];
      expect(agentRequest.headers.get('Upgrade')).toBe('websocket');
    });
  });

  describe('Multiple agents', () => {
    it('should support multiple agent types', async () => {
      // This test shows the pattern is extensible
      const testCases = [
        { name: 'hello', configured: true, expected: 200 },
        { name: 'tide', configured: false, expected: 404 },
        { name: 'analytics', configured: false, expected: 404 }
      ];

      for (const testCase of testCases) {
        const url = new URL(`http://example.com/agents/${testCase.name}/test`);
        const request = new Request(url.toString());
        
        const response = await handleAgentRequest(request, mockEnv, url);
        
        if (testCase.configured) {
          expect(response.status).toBe(testCase.expected);
        } else {
          expect(response.status).toBe(404);
          const text = await response.text();
          expect(text).toBe(`Unknown agent: ${testCase.name}`);
        }
      }
    });
  });
});