/**
 * Tests for Coordinator Durable Object
 */

import { Coordinator } from '../src/coordinator.js';
import type { Env } from '../src/types.js';

describe('Coordinator', () => {
  let coordinator: Coordinator;
  let mockState: DurableObjectState;
  let mockEnv: Env;

  beforeEach(() => {
    // Mock DurableObjectState
    mockState = {
      id: { toString: () => 'test-coordinator-id' },
      storage: {} as any,
      waitUntil: jest.fn(),
      blockConcurrencyWhile: jest.fn()
    } as any;

    // Mock Environment
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

    coordinator = new Coordinator(mockState, mockEnv);
  });

  describe('GET requests', () => {
    test('should return status on GET /', async () => {
      const request = new Request('https://test.com/', { method: 'GET' });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.services).toContain('insights');
      expect(data.data.services).toContain('optimize');
      expect(data.data.agent_id).toBe('test-coordinator-id');
    });

    test('should return health check on GET /health', async () => {
      const request = new Request('https://test.com/health', { method: 'GET' });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.healthy).toBe(true);
    });

    test('should return 404 for unknown GET endpoints', async () => {
      const request = new Request('https://test.com/unknown', { method: 'GET' });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('CORS handling', () => {
    test('should handle OPTIONS requests', async () => {
      const request = new Request('https://test.com/', { method: 'OPTIONS' });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    });
  });

  describe('Method validation', () => {
    test('should reject unsupported methods', async () => {
      const request = new Request('https://test.com/', { method: 'DELETE' });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(405);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Method DELETE not allowed');
    });
  });

  describe('POST request validation', () => {
    test('should require request body', async () => {
      const request = new Request('https://test.com/insights', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Request body is required');
    });

    test('should reject invalid JSON', async () => {
      const request = new Request('https://test.com/insights', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    test('should require api_key in request body', async () => {
      const request = new Request('https://test.com/insights', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tides_id: 'test-tide' })
      });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('api_key is required in request body');
    });

    test('should require tides_id in request body', async () => {
      const request = new Request('https://test.com/insights', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: 'test-api-key' })
      });
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('tides_id is required in request body');
    });
  });

  describe('Service routing', () => {
    beforeEach(() => {
      // Mock successful auth validation
      const mockAuthService = coordinator['authService'] as any;
      mockAuthService.validateRequest = jest.fn().mockResolvedValue({
        valid: true,
        userId: 'test-user'
      });
    });

    test('should route to insights service', async () => {
      const request = new Request('https://test.com/insights', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: 'test-api-key',
          tides_id: 'test-tide',
          timeframe: '7d'
        })
      });
      
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.metadata.service).toBe('insights');
    });

    test('should return 404 for unknown POST endpoints', async () => {
      const request = new Request('https://test.com/unknown', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: 'test-api-key',
          tides_id: 'test-tide'
        })
      });
      
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('Response format', () => {
    test('should include metadata in responses', async () => {
      const request = new Request('https://test.com/', { method: 'GET' });
      const response = await coordinator.fetch(request);
      
      const data = await response.json();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.service).toBe('coordinator');
      expect(data.metadata.timestamp).toBeDefined();
      expect(data.metadata.processing_time_ms).toBeGreaterThanOrEqual(0);
    });

    test('should set correct CORS headers', async () => {
      const request = new Request('https://test.com/', { method: 'GET' });
      const response = await coordinator.fetch(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});