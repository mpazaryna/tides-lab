/**
 * Integration Tests for Coordinator routing
 */

import { Coordinator } from '../../src/coordinator';
import type { Env } from '../../src/types';

describe('Coordinator Integration', () => {
  let coordinator: Coordinator;
  let mockEnv: Env;
  let validApiKey: string;
  let validUserId: string;
  let validTidesId: string;

  beforeEach(async () => {
    validApiKey = 'tides_testuser_123456789';
    validUserId = 'testuser';
    validTidesId = 'test-tide-123';

    mockEnv = {
      DB: {} as any,
      TIDES_R2: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        head: jest.fn(),
        list: jest.fn()
      } as any,
      TIDES_AUTH_KV: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
      } as any,
      AI: {} as any,
      COORDINATOR: {} as any,
      CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      R2_BUCKET_NAME: 'test-bucket',
      ENVIRONMENT: 'test'
    };

    // Setup valid authentication - mock hashed key directly
    const hashedKey = 'mock-hashed-key-for-testing';
    const mockKV = mockEnv.TIDES_AUTH_KV as any;
    mockKV.get.mockImplementation((key: string) => {
      if (key.startsWith('api_key:')) {
        return Promise.resolve(JSON.stringify({
          user_id: validUserId,
          api_key_hash: hashedKey,
          created_at: new Date().toISOString()
        }));
      }
      if (key === `tide:${validTidesId}`) {
        return Promise.resolve(JSON.stringify({
          tide_id: validTidesId,
          user_id: validUserId,
          created_at: new Date().toISOString()
        }));
      }
      return Promise.resolve(null);
    });

    // Setup R2 tide data
    const mockR2 = mockEnv.TIDES_R2 as any;
    mockR2.get.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        id: validTidesId,
        name: 'Test Productivity Tide',
        user_id: validUserId,
        status: 'active',
        created_at: new Date().toISOString(),
        flow_sessions: []
      })
    });

    // Mock Durable Object state
    const mockState = {
      id: { toString: () => 'test-id' },
      storage: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
      waitUntil: jest.fn(),
      blockConcurrencyWhile: jest.fn(),
      abort: jest.fn(),
      getAlarm: jest.fn(),
      setAlarm: jest.fn(),
      deleteAlarm: jest.fn(),
      acceptWebSocket: jest.fn(),
      getWebSockets: jest.fn(),
      getTags: jest.fn(),
      setTags: jest.fn(),
      props: {},
    } as any;

    coordinator = new Coordinator(mockState, mockEnv);
  });

  describe('POST request routing', () => {
    test('should route to insights service with explicit service', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'insights',
          timeframe: '7d'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.productivity_score).toBeGreaterThan(0);
      expect(body.data.trends).toBeDefined();
    });

    test('should route to optimize service with explicit service', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'optimize',
          preferences: {
            work_hours: { start: '09:00', end: '17:00' }
          }
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.suggested_schedule).toBeDefined();
      expect(body.data.efficiency_gains).toBeDefined();
    });

    test('should route to questions service with explicit service', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'questions',
          question: 'How can I improve my productivity?'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.answer).toBeDefined();
      expect(body.data.confidence).toBeGreaterThan(0);
      expect(body.data.suggested_actions).toBeInstanceOf(Array);
    });

    test('should route to preferences service with explicit service', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'preferences',
          preferences: {
            work_hours: { start: '08:00', end: '16:00' },
            break_duration: 20
          }
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.work_hours).toBeDefined();
      expect(body.data.break_duration).toBeDefined();
    });

    test('should route to reports service with explicit service', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'reports',
          report_type: 'summary',
          period: '30d'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.report_type).toBe('summary');
      expect(body.data.summary).toBeDefined();
    });
  });

  describe('Service inference routing', () => {
    test('should infer insights service from productivity questions', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          question: 'How productive was I today?'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.productivity_score).toBeDefined();
    });

    test('should infer optimize service from optimization questions', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          question: 'How can I optimize my schedule?'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.suggested_schedule).toBeDefined();
    });

    test('should infer reports service from report-related requests', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          report_type: 'detailed'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.report_type).toBe('detailed');
    });

    test('should infer preferences service from preferences data', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          preferences: {
            work_hours: { start: '10:00', end: '18:00' }
          }
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.work_hours).toBeDefined();
    });

    test('should default to questions service for general questions', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          question: 'What are some general productivity tips?'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.answer).toBeDefined();
      expect(body.data.confidence).toBeGreaterThan(0);
    });
  });

  describe('Service precedence', () => {
    test('should prioritize explicit service over inference', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'reports', // Explicit service
          question: 'How productive was I today?' // Would infer insights
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      // Should be a report response, not insights
      expect(body.data.report_type).toBeDefined();
      expect(body.data.summary).toBeDefined();
    });
  });

  describe('Authentication integration', () => {
    test('should reject invalid API key', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'invalid-key',
          tides_id: validTidesId,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid API key format');
    });

    test('should reject missing API key', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tides_id: validTidesId,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('API key is required');
    });

    test('should reject missing tides ID', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Tides ID is required');
    });

    test('should handle authentication service errors', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockRejectedValue(new Error('KV service down'));

      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toContain('temporarily unavailable');
    });
  });

  describe('Error handling', () => {
    test('should handle malformed JSON', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid JSON');
    });

    test('should handle empty request body', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    test('should handle service inference failure', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          random_field: 'random_value'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      // Should default to questions service
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.answer).toBeDefined();
    });

    test('should handle R2 storage errors', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockRejectedValue(new Error('R2 unavailable'));

      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      // Should still return mock data even with storage errors
      expect(body.data).toBeDefined();
    });
  });

  describe('HTTP method support', () => {
    test('should handle GET requests to health endpoint', async () => {
      const request = new Request('https://test.com/health', {
        method: 'GET'
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.status).toBe('healthy');
    });

    test('should handle GET requests to status endpoint', async () => {
      const request = new Request('https://test.com/status', {
        method: 'GET'
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.environment).toBe('test');
    });

    test('should reject unsupported HTTP methods', async () => {
      const methods = ['PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const request = new Request('https://test.com/', { method });
        const response = await coordinator.fetch(request);

        expect(response.status).toBe(405);
      }
    });

    test('should reject GET requests to root endpoint', async () => {
      const request = new Request('https://test.com/', {
        method: 'GET'
      });

      const response = await coordinator.fetch(request);

      expect(response.status).toBe(405);
    });
  });

  describe('Content-Type handling', () => {
    test('should handle missing Content-Type header', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    test('should handle incorrect Content-Type header', async () => {
      const request = new Request('https://test.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          api_key: validApiKey,
          tides_id: validTidesId,
          service: 'insights'
        })
      });

      const response = await coordinator.fetch(request);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});