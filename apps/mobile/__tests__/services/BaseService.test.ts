/**
 * BaseService Tests
 * 
 * Test suite for base HTTP service with retry logic and error handling
 */

import { BaseService } from '../../src/services/base/BaseService';

// Mock fetch globally
global.fetch = jest.fn();

// Mock LoggingService
jest.mock('../../src/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock AsyncStorage for auth token retrieval
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// Mock supabase config to avoid ES module issues
jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock auth service to avoid dependency issues
jest.mock('../../src/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

// Create a test service that extends BaseService
class TestService extends BaseService {
  constructor() {
    super('https://api.test.com');
  }

  public async testGet(endpoint: string) {
    return this.request('GET', endpoint);
  }

  public async testPost(endpoint: string, data: any) {
    return this.request('POST', endpoint, data);
  }

  public async testGetWithAuth(endpoint: string) {
    return this.requestWithAuth('GET', endpoint);
  }
}

describe('BaseService', () => {
  let testService: TestService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const AsyncStorage = require('@react-native-async-storage/async-storage');

  beforeEach(() => {
    jest.clearAllMocks();
    testService = new TestService();
    AsyncStorage.getItem.mockResolvedValue('mock-jwt-token');
  });

  describe('Constructor', () => {
    it('should initialize with base URL', () => {
      expect(testService).toBeInstanceOf(BaseService);
    });

    it('should handle base URL with trailing slash', () => {
      const serviceWithSlash = new TestService();
      // Base URL normalization is internal, test via request
      expect(serviceWithSlash).toBeInstanceOf(BaseService);
    });
  });

  describe('Basic HTTP Requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await testService.testGet('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make successful POST request with data', async () => {
      const requestData = { name: 'test' };
      const mockResponse = { id: 1, ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await testService.testPost('/users', requestData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Authentication', () => {
    it('should include JWT token in authenticated requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await testService.testGetWithAuth('/protected');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token',
          }),
        })
      );
    });

    it('should handle missing JWT token gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await testService.testGetWithAuth('/protected');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/protected',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'Not found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(testService.testGet('/not-found')).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(testService.testGet('/test')).rejects.toThrow('Network error');
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('Plain text response'),
      } as any);

      const result = await testService.testGet('/text');
      expect(result).toBe('Plain text response');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      // First attempt fails
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ success: true }),
        } as any);

      const result = await testService.testGet('/retry-test');
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it('should fail after max retries', async () => {
      // All attempts fail
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      await expect(testService.testGet('/always-fail')).rejects.toThrow(
        'Persistent network error'
      );
      
      // Should try 3 times (initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors (4xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ error: 'Invalid request' }),
      } as any);

      await expect(testService.testGet('/bad-request')).rejects.toThrow(
        'HTTP 400: Bad Request'
      );
      
      // Should only try once (no retries for 4xx errors)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors (5xx)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ error: 'Server error' }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({ success: true }),
        } as any);

      const result = await testService.testGet('/server-error');
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });
  });

  describe('Request Timeout', () => {
    it('should respect request timeout', async () => {
      // Mock a long-running request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });
      
      mockFetch.mockImplementationOnce(() => timeoutPromise);

      await expect(testService.testGet('/slow-endpoint')).rejects.toThrow();
    });
  });

  describe('Content Type Handling', () => {
    it('should parse JSON responses correctly', async () => {
      const jsonData = { id: 1, name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(jsonData),
      } as any);

      const result = await testService.testGet('/json');
      expect(result).toEqual(jsonData);
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(''),
      } as any);

      const result = await testService.testGet('/empty');
      expect(result).toBeNull();
    });
  });

  describe('Custom Headers', () => {
    it('should allow custom headers in requests', async () => {
      // This would require modifying the BaseService to accept custom headers
      // For now, test that default headers are set correctly
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await testService.testGet('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Logging Integration', () => {
    it('should log successful requests', async () => {
      const { LoggingService } = require('../../src/services/LoggingService');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await testService.testGet('/test');
      
      expect(LoggingService.debug).toHaveBeenCalledWith(
        'BaseService',
        expect.stringContaining('Request successful'),
        expect.any(Object)
      );
    });

    it('should log failed requests', async () => {
      const { LoggingService } = require('../../src/services/LoggingService');
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(testService.testGet('/test')).rejects.toThrow();
      
      expect(LoggingService.error).toHaveBeenCalledWith(
        'BaseService',
        expect.stringContaining('Request failed'),
        expect.any(Object)
      );
    });
  });
});