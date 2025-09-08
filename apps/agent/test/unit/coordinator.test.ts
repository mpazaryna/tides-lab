/**
 * Coordinator Unit Tests
 * Tests for the lightweight HTTP layer that delegates to orchestrator
 */

import { Coordinator } from '../../src/coordinator.js';
import type { Env } from '../../src/types.js';

// Mock the orchestrator
const mockOrchestratorService = {
  handleRequest: jest.fn()
};

// Mock AuthService
const mockAuthService = {
  validateApiKey: jest.fn()
};

// Mock AITester
const mockAITester = {
  runAllTests: jest.fn()
};

// Mock modules
jest.mock('../../src/services/orchestrator.js', () => ({
  OrchestratorService: jest.fn(() => mockOrchestratorService)
}));

jest.mock('../../src/auth.js', () => ({
  AuthService: jest.fn(() => mockAuthService)
}));

jest.mock('../../src/ai-test.js', () => ({
  AITester: jest.fn(() => mockAITester)
}));

describe('Coordinator', () => {
  let coordinator: Coordinator;
  let mockState: DurableObjectState;
  let mockEnv: Env;

  beforeEach(() => {
    // Setup mocks
    mockState = {
      id: { toString: () => 'test-coordinator-id' }
    } as DurableObjectState;

    mockEnv = {
      AI: 'mock-ai',
      TIDES_AUTH_KV: 'mock-kv',
      TIDES_R2: 'mock-r2'
    } as any;

    // Reset mocks
    jest.clearAllMocks();
    
    coordinator = new Coordinator(mockState, mockEnv);
  });

  describe('Construction', () => {
    it('should create coordinator instance', () => {
      expect(coordinator).toBeInstanceOf(Coordinator);
    });

    it('should initialize services', () => {
      expect(coordinator).toBeDefined();
    });
  });

  describe('GET Requests', () => {
    it('should handle status endpoint', async () => {
      const request = new Request('https://test.com/status', { method: 'GET' });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.architecture).toBe('coordinator → orchestrator → services');
    });

    it('should handle health endpoint', async () => {
      const request = new Request('https://test.com/health', { method: 'GET' });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.healthy).toBe(true);
    });

    it('should handle ai-test endpoint', async () => {
      mockAITester.runAllTests.mockResolvedValue({ tests_passed: 5, tests_failed: 0 });
      
      const request = new Request('https://test.com/ai-test', { method: 'GET' });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAITester.runAllTests).toHaveBeenCalled();
    });

    it('should return 404 for unknown GET endpoints', async () => {
      const request = new Request('https://test.com/unknown', { method: 'GET' });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('POST Requests - Authentication', () => {
    it('should reject requests without body', async () => {
      const request = new Request('https://test.com/coordinator', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Request body is required');
    });

    it('should reject requests with invalid API key', async () => {
      mockAuthService.validateApiKey.mockResolvedValue({ valid: false });
      
      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'invalid-key',
          message: 'test message'
        })
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid API key');
    });

    it('should authenticate valid API key', async () => {
      mockAuthService.validateApiKey.mockResolvedValue({ 
        valid: true, 
        userId: 'test-user-123' 
      });
      
      mockOrchestratorService.handleRequest.mockResolvedValue({
        data: { message: 'test response' },
        service: 'chat',
        inferenceInfo: { confidence: 95, reasoning: 'test' }
      });
      
      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'valid-key',
          message: 'test message'
        })
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockAuthService.validateApiKey).toHaveBeenCalledWith('valid-key');
      expect(mockOrchestratorService.handleRequest).toHaveBeenCalled();
    });
  });

  describe('POST Requests - Orchestrator Delegation', () => {
    beforeEach(() => {
      mockAuthService.validateApiKey.mockResolvedValue({ 
        valid: true, 
        userId: 'test-user-123' 
      });
    });

    it('should delegate to orchestrator for coordinator endpoint', async () => {
      const mockResult = {
        data: { productivity_score: 85 },
        service: 'insights',
        inferenceInfo: { confidence: 90, reasoning: 'AI inference' }
      };
      mockOrchestratorService.handleRequest.mockResolvedValue(mockResult);

      const requestBody = {
        api_key: 'valid-key',
        message: 'show me insights',
        tides_id: 'test-tide'
      };

      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.productivity_score).toBe(85);
      expect(data.metadata.service).toBe('insights');
      expect(mockOrchestratorService.handleRequest).toHaveBeenCalledWith(
        requestBody,
        'test-user-123',
        '/coordinator'
      );
    });

    it('should handle orchestrator errors gracefully', async () => {
      mockOrchestratorService.handleRequest.mockRejectedValue(
        new Error('Orchestrator failed')
      );

      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'valid-key',
          message: 'test message'
        })
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Orchestrator failed');
      // service field may not be present in error responses
    });

    it('should pass pathname to orchestrator for legacy endpoints', async () => {
      mockOrchestratorService.handleRequest.mockResolvedValue({
        data: { message: 'chat response' },
        service: 'chat',
        inferenceInfo: { confidence: 100, reasoning: 'legacy endpoint' }
      });

      const request = new Request('https://test.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'valid-key',
          message: 'hello'
        })
      });
      
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(200);
      expect(mockOrchestratorService.handleRequest).toHaveBeenCalledWith(
        expect.any(Object),
        'test-user-123',
        '/chat'
      );
    });
  });

  describe('R2 Test Endpoint', () => {
    it('should handle R2 test requests', async () => {
      const mockR2 = {
        get: jest.fn().mockResolvedValue({
          json: () => Promise.resolve({ test: 'data' }),
          size: 100,
          httpMetadata: { contentType: 'application/json' }
        })
      };
      
      mockEnv.TIDES_R2 = mockR2 as any;
      coordinator = new Coordinator(mockState, mockEnv);

      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          r2_test_path: 'test/path/file.json'
        })
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.test_result).toBe('file_found');
      expect(mockR2.get).toHaveBeenCalledWith('test/path/file.json');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const request = new Request('https://test.com/coordinator', { method: 'OPTIONS' });
      
      const response = await coordinator.fetch(request);
      
      expect(response.status).toBe(204); // OPTIONS returns 204 No Content
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should include CORS headers in responses', async () => {
      const request = new Request('https://test.com/status', { method: 'GET' });
      
      const response = await coordinator.fetch(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      mockAuthService.validateApiKey.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new Request('https://test.com/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'valid-key',
          message: 'test'
        })
      });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should validate HTTP methods', async () => {
      const request = new Request('https://test.com/coordinator', { method: 'DELETE' });
      
      const response = await coordinator.fetch(request);
      const data = await response.json();
      
      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
    });
  });
});