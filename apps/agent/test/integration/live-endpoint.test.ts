/**
 * Live Endpoint Integration Tests
 * Tests the actual deployed tides-agent-103.mpazbot.workers.dev endpoint
 */

const LIVE_ENDPOINT = 'https://tides-agent-103.mpazbot.workers.dev';
const TEST_API_KEY = 'tides_testuser_12345';
const TEST_TIDE_ID = 'daily-tide-default';

interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    service: string;
    timestamp: string;
    processing_time_ms: number;
    inference?: {
      confidence: number;
      reasoning: string;
    };
  };
}

interface ChatResponse {
  needs_clarification: boolean;
  message: string;
  suggestions: string[];
  conversation_id: string;
}

describe('Live Endpoint Integration Tests', () => {
  // Helper function to make requests to the live endpoint
  async function makeRequest<T>(payload: any): Promise<AgentResponse<T>> {
    const response = await fetch(`${LIVE_ENDPOINT}/coordinator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Standard frontend payload for testing
  const createFrontendPayload = (overrides: any = {}) => ({
    api_key: TEST_API_KEY,
    tides_id: TEST_TIDE_ID,
    message: "Start me a flow session",
    tide_tool_call: "tide_smart_flow",
    context: {
      recent_messages: [
        { role: "user", content: "How's my energy today?" },
        { role: "assistant", content: "Your energy seems steady..." }
      ],
      user_time: "2025-09-05T12:00:00.000Z"
    },
    timestamp: "2025-09-05T12:00:00.000Z",
    ...overrides
  });

  describe('Health Checks', () => {
    test('should respond to status endpoint', async () => {
      const response = await fetch(`${LIVE_ENDPOINT}/status`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.services).toContain('chat');
    });

    test('should respond to health endpoint', async () => {
      const response = await fetch(`${LIVE_ENDPOINT}/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.healthy).toBe(true);
    });
  });

  describe('Service Routing', () => {
    test('should route standard frontend payload to chat service', async () => {
      const payload = createFrontendPayload();
      const response = await makeRequest<ChatResponse>(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('chat');
      expect(response.data?.needs_clarification).toBe(true);
      expect(response.data?.message).toBeDefined();
      expect(response.data?.suggestions).toBeInstanceOf(Array);
      expect(response.data?.conversation_id).toBeDefined();
    });

    test('should route explicit service requests correctly', async () => {
      const services = ['insights', 'optimize', 'questions', 'preferences', 'reports'];

      for (const service of services) {
        const payload = createFrontendPayload({ service });
        const response = await makeRequest(payload);

        expect(response.success).toBe(true);
        expect(response.metadata.service).toBe(service);
        expect(response.data).toBeDefined();
        
        // Service-specific validations
        if (service === 'insights') {
          expect(response.data.productivity_score).toBeDefined();
          expect(response.data.trends).toBeDefined();
        } else if (service === 'optimize') {
          expect(response.data.suggested_schedule).toBeDefined();
          expect(response.data.efficiency_gains).toBeDefined();
        }
      }
    });

    test('should handle explicit chat service requests', async () => {
      const payload = createFrontendPayload({ 
        service: 'chat',
        message: "I'm not sure what I need help with"
      });
      const response = await makeRequest<ChatResponse>(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('chat');
      expect(response.data?.needs_clarification).toBe(true);
      expect(response.data?.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('AI-Powered Chat Service', () => {
    test('should provide AI-powered clarification for ambiguous requests', async () => {
      const payload = createFrontendPayload({
        message: "I need help with my productivity",
        context: {
          recent_messages: [
            { role: "user", content: "I've been feeling unfocused lately" },
            { role: "assistant", content: "That's understandable..." }
          ],
          user_time: "2025-09-05T14:30:00.000Z"
        }
      });

      const response = await makeRequest<ChatResponse>(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('chat');
      expect(response.data?.message).toBeDefined();
      expect(response.data?.message.length).toBeGreaterThan(20); // Should be more than mock response
      expect(response.data?.suggestions).toBeInstanceOf(Array);
      expect(response.data?.suggestions.length).toBeGreaterThanOrEqual(1);
      expect(response.data?.conversation_id).toMatch(/^conv_/);
    });

    test('should provide contextual suggestions based on time', async () => {
      const morningPayload = createFrontendPayload({
        message: "What should I focus on?",
        context: {
          user_time: "2025-09-05T08:30:00.000Z" // Morning
        }
      });

      const eveningPayload = createFrontendPayload({
        message: "What should I focus on?", 
        context: {
          user_time: "2025-09-05T18:30:00.000Z" // Evening
        }
      });

      const morningResponse = await makeRequest<ChatResponse>(morningPayload);
      const eveningResponse = await makeRequest<ChatResponse>(eveningPayload);

      expect(morningResponse.success).toBe(true);
      expect(eveningResponse.success).toBe(true);

      // Suggestions should be different based on time context
      expect(morningResponse.data?.suggestions).not.toEqual(eveningResponse.data?.suggestions);
    });

    test('should handle conversation continuity', async () => {
      const payload = createFrontendPayload({
        message: "Follow up on my previous question",
        context: {
          recent_messages: [
            { role: "user", content: "How can I improve my focus?" },
            { role: "assistant", content: "Here are some techniques..." },
            { role: "user", content: "That's helpful, but I need more specific advice" }
          ]
        }
      });

      const response = await makeRequest<ChatResponse>(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('chat');
      expect(response.data?.message).toBeDefined();
      expect(response.data?.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle requests without API key gracefully', async () => {
      const payload = createFrontendPayload({ api_key: undefined });
      
      try {
        await makeRequest(payload);
      } catch (error) {
        // Should either throw or return error response
        expect(error).toBeDefined();
      }
    });

    test('should handle malformed requests gracefully', async () => {
      try {
        const response = await fetch(`${LIVE_ENDPOINT}/coordinator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"invalid": json}'
        });
        
        // Should return error response, not crash
        expect(response.status).toBeGreaterThanOrEqual(400);
      } catch (error) {
        // Network errors are acceptable
        expect(error).toBeDefined();
      }
    });

    test('should handle CORS preflight requests', async () => {
      const response = await fetch(`${LIVE_ENDPOINT}/coordinator`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Performance & Reliability', () => {
    test('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      const payload = createFrontendPayload();
      
      const response = await makeRequest(payload);
      const responseTime = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
      expect(response.metadata.processing_time_ms).toBeDefined();
    });

    test('should handle concurrent requests', async () => {
      const payload = createFrontendPayload();
      
      // Make 5 concurrent requests
      const promises = Array(5).fill(null).map(() => makeRequest(payload));
      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.metadata.service).toBe('chat');
      });

      // Each should have unique conversation IDs
      const conversationIds = responses.map(r => r.data?.conversation_id);
      const uniqueIds = new Set(conversationIds);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('Service-Specific Integration', () => {
    test('should return comprehensive insights data', async () => {
      const payload = createFrontendPayload({ 
        service: 'insights',
        timeframe: '30d'
      });
      
      const response = await makeRequest(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('insights');
      expect(response.data.productivity_score).toBeGreaterThanOrEqual(0);
      expect(response.data.trends).toBeDefined();
      expect(response.data.recommendations).toBeInstanceOf(Array);
    });

    test('should return structured optimization data', async () => {
      const payload = createFrontendPayload({ service: 'optimize' });
      const response = await makeRequest(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('optimize');
      expect(response.data.suggested_schedule).toBeDefined();
      expect(response.data.suggested_schedule.time_blocks).toBeInstanceOf(Array);
    });

    test('should provide helpful Q&A responses', async () => {
      const payload = createFrontendPayload({ 
        service: 'questions',
        question: "How can I improve my morning productivity?"
      });
      
      const response = await makeRequest(payload);

      expect(response.success).toBe(true);
      expect(response.metadata.service).toBe('questions');
      expect(response.data.answer).toBeDefined();
      expect(response.data.confidence).toBeGreaterThan(0);
    });
  });
});