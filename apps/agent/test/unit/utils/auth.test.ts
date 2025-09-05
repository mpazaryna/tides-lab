/**
 * Unit Tests for Auth utilities
 */

import { validateRequest, hashApiKey } from '../../../src/auth';
import type { Env } from '../../../src/types';

describe('Auth Utilities', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {} as any,
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
  });

  describe('hashApiKey', () => {
    test('should hash API key consistently', async () => {
      const apiKey = 'tides_testuser_123456789';
      
      const hash1 = await hashApiKey(apiKey);
      const hash2 = await hashApiKey(apiKey);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    test('should produce different hashes for different keys', async () => {
      const apiKey1 = 'tides_user1_123';
      const apiKey2 = 'tides_user2_456';
      
      const hash1 = await hashApiKey(apiKey1);
      const hash2 = await hashApiKey(apiKey2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', async () => {
      const hash = await hashApiKey('');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    test('should handle special characters', async () => {
      const specialKey = 'tides_user@test.com_!@#$%^&*()';
      
      expect(async () => await hashApiKey(specialKey)).not.toThrow();
      const hash = await hashApiKey(specialKey);
      expect(hash).toBeDefined();
    });

    test('should produce consistent hex-encoded output', async () => {
      const apiKey = 'tides_testuser_123';
      const hash = await hashApiKey(apiKey);
      
      // SHA-256 hash should be 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('validateRequest', () => {
    beforeEach(() => {
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockClear();
    });

    test('should validate successful request', async () => {
      const apiKey = 'tides_testuser_123456789';
      const hashedKey = await hashApiKey(apiKey);
      const tidesId = 'test-tide-123';
      const userId = 'testuser';

      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue(JSON.stringify({
        user_id: userId,
        api_key_hash: hashedKey,
        created_at: new Date().toISOString()
      }));

      const result = await validateRequest(apiKey, tidesId, mockEnv);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
      expect(result.error).toBeUndefined();
      expect(mockKV.get).toHaveBeenCalledWith(`api_key:${hashedKey}`);
    });

    test('should reject invalid API key format', async () => {
      const invalidKeys = [
        'invalid-key',
        'tides_user', // Missing random part
        'wrong_format_123',
        '',
        'tides__123' // Empty user part
      ];

      for (const apiKey of invalidKeys) {
        const result = await validateRequest(apiKey, 'test-tide', mockEnv);
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid API key format');
        expect(result.userId).toBeUndefined();
      }
    });

    test('should reject non-existent API key', async () => {
      const apiKey = 'tides_testuser_123456789';
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue(null);

      const result = await validateRequest(apiKey, 'test-tide', mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(result.userId).toBeUndefined();
    });

    test('should handle KV lookup errors', async () => {
      const apiKey = 'tides_testuser_123456789';
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockRejectedValue(new Error('KV service unavailable'));

      const result = await validateRequest(apiKey, 'test-tide', mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Authentication service temporarily unavailable');
      expect(result.userId).toBeUndefined();
    });

    test('should handle invalid JSON in KV store', async () => {
      const apiKey = 'tides_testuser_123456789';
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue('invalid json');

      const result = await validateRequest(apiKey, 'test-tide', mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(result.userId).toBeUndefined();
    });

    test('should extract user ID from API key correctly', async () => {
      const testCases = [
        { apiKey: 'tides_john_123', expectedUserId: 'john' },
        { apiKey: 'tides_user123_456', expectedUserId: 'user123' },
        { apiKey: 'tides_test@example.com_789', expectedUserId: 'test@example.com' },
        { apiKey: 'tides_user_with_underscores_999', expectedUserId: 'user_with_underscores' }
      ];

      for (const { apiKey, expectedUserId } of testCases) {
        const hashedKey = await hashApiKey(apiKey);
        const mockKV = mockEnv.TIDES_AUTH_KV as any;
        mockKV.get.mockImplementation((key: string) => {
          if (key === `api_key:${hashedKey}`) {
            return Promise.resolve(JSON.stringify({
              user_id: expectedUserId,
              api_key_hash: hashedKey
            }));
          }
          return Promise.resolve(null);
        });

        const result = await validateRequest(apiKey, 'test-tide', mockEnv);

        expect(result.valid).toBe(true);
        expect(result.userId).toBe(expectedUserId);
      }
    });

    test('should validate tides ID ownership', async () => {
      const apiKey = 'tides_testuser_123';
      const hashedKey = await hashApiKey(apiKey);
      const userId = 'testuser';
      const tidesId = 'user-owned-tide';

      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockImplementation((key: string) => {
        if (key === `api_key:${hashedKey}`) {
          return Promise.resolve(JSON.stringify({
            user_id: userId,
            api_key_hash: hashedKey
          }));
        }
        if (key === `tide:${tidesId}`) {
          return Promise.resolve(JSON.stringify({
            tide_id: tidesId,
            user_id: userId,
            created_at: new Date().toISOString()
          }));
        }
        return Promise.resolve(null);
      });

      const result = await validateRequest(apiKey, tidesId, mockEnv);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
    });

    test('should reject tides ID owned by different user', async () => {
      const apiKey = 'tides_user1_123';
      const hashedKey = await hashApiKey(apiKey);
      const userId = 'user1';
      const tidesId = 'user2-owned-tide';

      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockImplementation((key: string) => {
        if (key === `api_key:${hashedKey}`) {
          return Promise.resolve(JSON.stringify({
            user_id: userId,
            api_key_hash: hashedKey
          }));
        }
        if (key === `tide:${tidesId}`) {
          return Promise.resolve(JSON.stringify({
            tide_id: tidesId,
            user_id: 'user2', // Different user
            created_at: new Date().toISOString()
          }));
        }
        return Promise.resolve(null);
      });

      const result = await validateRequest(apiKey, tidesId, mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tides ID does not belong to authenticated user');
      expect(result.userId).toBeUndefined();
    });

    test('should handle non-existent tides ID gracefully', async () => {
      const apiKey = 'tides_testuser_123';
      const hashedKey = await hashApiKey(apiKey);
      const userId = 'testuser';
      const tidesId = 'nonexistent-tide';

      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockImplementation((key: string) => {
        if (key === `api_key:${hashedKey}`) {
          return Promise.resolve(JSON.stringify({
            user_id: userId,
            api_key_hash: hashedKey
          }));
        }
        if (key === `tide:${tidesId}`) {
          return Promise.resolve(null); // Tide doesn't exist
        }
        return Promise.resolve(null);
      });

      // For non-existent tides, we might want to allow the request
      // and let the service handle the "tide not found" case
      const result = await validateRequest(apiKey, tidesId, mockEnv);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(userId);
    });

    test('should handle missing tides_id parameter', async () => {
      const apiKey = 'tides_testuser_123';
      
      const result = await validateRequest(apiKey, '', mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tides ID is required');
    });

    test('should handle missing api_key parameter', async () => {
      const result = await validateRequest('', 'test-tide', mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });

    test('should validate API key hash matches', async () => {
      const apiKey = 'tides_testuser_123';
      const wrongHashedKey = await hashApiKey('tides_testuser_456'); // Different key
      const userId = 'testuser';

      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      mockKV.get.mockResolvedValue(JSON.stringify({
        user_id: userId,
        api_key_hash: wrongHashedKey // Hash doesn't match the provided key
      }));

      const result = await validateRequest(apiKey, 'test-tide', mockEnv);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('edge cases', () => {
    test('should handle very long API keys', async () => {
      const longKey = 'tides_' + 'a'.repeat(100) + '_' + '1'.repeat(50);
      
      expect(async () => await hashApiKey(longKey)).not.toThrow();
      const hash = await hashApiKey(longKey);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle unicode characters in API key', async () => {
      const unicodeKey = 'tides_user🚀_123';
      
      expect(async () => await hashApiKey(unicodeKey)).not.toThrow();
      const hash = await hashApiKey(unicodeKey);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle null/undefined inputs gracefully', async () => {
      const result1 = await validateRequest(null as any, 'test-tide', mockEnv);
      const result2 = await validateRequest(undefined as any, 'test-tide', mockEnv);
      const result3 = await validateRequest('tides_test_123', null as any, mockEnv);
      const result4 = await validateRequest('tides_test_123', undefined as any, mockEnv);

      [result1, result2, result3, result4].forEach(result => {
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should handle concurrent validation requests', async () => {
      const apiKey = 'tides_testuser_123';
      const hashedKey = await hashApiKey(apiKey);
      const mockKV = mockEnv.TIDES_AUTH_KV as any;
      
      mockKV.get.mockResolvedValue(JSON.stringify({
        user_id: 'testuser',
        api_key_hash: hashedKey
      }));

      // Run multiple validations concurrently
      const promises = Array.from({ length: 10 }, (_, i) => 
        validateRequest(apiKey, `tide-${i}`, mockEnv)
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.valid).toBe(true);
        expect(result.userId).toBe('testuser');
      });

      // Should have made the appropriate number of KV calls
      expect(mockKV.get).toHaveBeenCalledTimes(20); // 10 api key calls + 10 tide calls
    });
  });
});