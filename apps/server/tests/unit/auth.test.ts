import { validateApiKey, authenticate } from '../../src/auth';

describe('Authentication Module', () => {
  describe('validateApiKey', () => {
    it('should accept documented test API keys', async () => {
      const testKeys = [
        { key: 'tides_testuser_001', expectedUserId: 'testuser001' },
        { key: 'tides_testuser_002', expectedUserId: 'testuser002' },
        { key: 'tides_testuser_003', expectedUserId: 'testuser003' },
        { key: 'tides_testuser_004', expectedUserId: 'testuser004' },
        { key: 'tides_testuser_005', expectedUserId: 'testuser005' }
      ];

      for (const { key, expectedUserId } of testKeys) {
        const result = await validateApiKey(key);
        
        expect(result).not.toBeNull();
        expect(result?.userId).toBe(expectedUserId);
        expect(result?.email).toBe(`${expectedUserId}@example.com`);
        expect(result?.keyId).toBe(key);
      }
    });

    it('should reject API key without tides_ prefix', async () => {
      const apiKey = 'invalid_key_123';
      const result = await validateApiKey(apiKey);
      
      expect(result).toBeNull();
    });

    it('should reject empty API key', async () => {
      const result = await validateApiKey('');
      expect(result).toBeNull();
    });

    it('should reject null API key', async () => {
      const result = await validateApiKey(null as any);
      expect(result).toBeNull();
    });

    it('should reject API keys that are not documented test keys', async () => {
      const invalidKeys = [
        'tides_user123_abc456',  // Wrong format
        'tides_testuser_006',    // Not in allowed range
        'tides_testuser_000',    // Not in allowed range
        'tides_test',            // Too short
        'tides_',                // Only prefix
        'tides_othuser_001'      // Wrong user prefix
      ];

      for (const key of invalidKeys) {
        const result = await validateApiKey(key);
        expect(result).toBeNull();
      }
    });
  });

  describe('authenticate', () => {
    it('should authenticate valid Bearer token with documented API key', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'Authorization': 'Bearer tides_testuser_001'
        }
      });
      
      const result = await authenticate(request);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('testuser001');
      expect(result?.keyId).toBe('tides_testuser_001');
    });

    it('should return null for missing Authorization header', async () => {
      const request = new Request('https://example.com');
      const result = await authenticate(request);
      
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer token', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'Authorization': 'Basic dXNlcjpwYXNz'
        }
      });
      
      const result = await authenticate(request);
      
      expect(result).toBeNull();
    });

    it('should return null for Bearer token with invalid API key', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'Authorization': 'Bearer tides_user123_xyz789'
        }
      });
      
      const result = await authenticate(request);
      
      expect(result).toBeNull();
    });

    it('should return null for Bearer token without tides_ prefix', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'Authorization': 'Bearer invalid_key_123'
        }
      });
      
      const result = await authenticate(request);
      
      expect(result).toBeNull();
    });

    it('should handle case-insensitive Authorization header', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'authorization': 'Bearer tides_testuser_002'
        }
      });
      
      const result = await authenticate(request);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('testuser002');
    });
  });
});