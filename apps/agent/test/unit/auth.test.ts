/**
 * Tests for AuthService
 */

import { AuthService } from '../../src/auth.js';
import type { Env } from '../../src/types.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {
        prepare: jest.fn()
      } as any,
      TIDES_R2: {} as any,
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

    authService = new AuthService(mockEnv);
  });

  describe('validateApiKey', () => {
    test('should validate correct API key', async () => {
      const mockDB = mockEnv.DB as any;
      
      // First call is for SELECT query, second is for UPDATE query
      mockDB.prepare.mockReturnValueOnce({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          user_id: 'test-user-123',
          name: 'Test API Key'
        })
      }).mockReturnValueOnce({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({})
      });

      const result = await authService.validateApiKey('test-api-key');
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('test-user-123');
      expect(mockDB.prepare).toHaveBeenCalledTimes(2);
    });

    test('should reject invalid API key', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue(null);

      const result = await authService.validateApiKey('invalid-api-key');
      
      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    test('should handle KV lookup errors', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockRejectedValue(new Error('KV error'));

      const result = await authService.validateApiKey('test-api-key');
      
      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    test('should handle malformed user data', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue('invalid json');

      const result = await authService.validateApiKey('test-api-key');
      
      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });
  });

  describe('validateTidesId', () => {
    test('should validate basic tide ID format', async () => {
      const result = await authService.validateTidesId('test-tide-123', 'test-user');
      
      expect(result).toBe(true);
    });

    test('should reject empty tide ID', async () => {
      const result = await authService.validateTidesId('', 'test-user');
      
      expect(result).toBe(false);
    });

    test('should reject non-string tide ID', async () => {
      const result = await authService.validateTidesId(null as any, 'test-user');
      
      expect(result).toBe(false);
    });
  });

  describe('validateRequest', () => {
    test('should validate complete valid request', async () => {
      const mockDB = mockEnv.DB as any;
      
      // Mock both SELECT and UPDATE queries
      mockDB.prepare.mockReturnValueOnce({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          user_id: 'test-user-123',
          name: 'Test API Key'
        })
      }).mockReturnValueOnce({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({})
      });

      const request = new Request('https://test.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'valid-api-key',
          tides_id: 'test-tide-123'
        })
      });

      const result = await authService.validateRequest(request);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('test-user-123');
      expect(result.error).toBeUndefined();
    });

    test('should reject request missing api_key', async () => {
      const request = new Request('https://test.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tides_id: 'test-tide-123'
        })
      });

      const result = await authService.validateRequest(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('api_key is required in request body');
    });

    test('should reject request missing tides_id', async () => {
      const request = new Request('https://test.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'valid-api-key'
        })
      });

      const result = await authService.validateRequest(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('tides_id is required in request body');
    });

    test('should reject request with invalid API key', async () => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue(null);

      const request = new Request('https://test.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'invalid-api-key',
          tides_id: 'test-tide-123'
        })
      });

      const result = await authService.validateRequest(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    test('should handle malformed request body', async () => {
      const request = new Request('https://test.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const result = await authService.validateRequest(request);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to validate request');
    });
  });
});