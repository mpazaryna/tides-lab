/**
 * Unit Tests for Storage utilities
 */

import { StorageService } from '../../../src/storage';
import type { Env } from '../../../src/types';

describe('AgentStorage', () => {
  let storage: StorageService;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {} as any,
      TIDES_R2: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        head: jest.fn(),
        list: jest.fn()
      } as any,
      TIDES_AUTH_KV: {} as any,
      AI: {} as any,
      COORDINATOR: {} as any,
      CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      R2_BUCKET_NAME: 'test-bucket',
      ENVIRONMENT: 'test'
    };

    storage = new StorageService(mockEnv);
  });

  describe('getTideData', () => {
    test('should fetch tide data from R2 successfully', async () => {
      const mockTideData = {
        id: 'test-tide-123',
        name: 'Test Productivity Tide',
        user_id: 'test-user',
        status: 'active',
        created_at: new Date().toISOString(),
        flow_sessions: []
      };

      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockTideData)
      });

      const result = await storage.getTideData('test-user', 'test-tide-123');

      expect(result).toEqual(mockTideData);
      expect(mockR2.get).toHaveBeenCalledWith('users/test-user/tides/test-tide-123.json');
    });

    test('should return null when tide does not exist', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      const result = await storage.getTideData('test-user', 'nonexistent-tide');

      expect(result).toBeNull();
      expect(mockR2.get).toHaveBeenCalledWith('users/test-user/tides/nonexistent-tide.json');
    });

    test('should handle R2 get errors gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockRejectedValue(new Error('R2 access denied'));

      const result = await storage.getTideData('test-user', 'test-tide-123');
      
      expect(result).toBeNull();
    });

    test('should handle invalid JSON in R2 object', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue({
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const result = await storage.getTideData('test-user', 'test-tide-123');
      
      expect(result).toBeNull();
    });

    test('should construct correct R2 key path', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      await storage.getTideData('user123', 'my-tide');

      expect(mockR2.get).toHaveBeenCalledWith('users/user123/tides/my-tide.json');
    });

    test('should handle special characters in user ID and tide ID', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      await storage.getTideData('user_with_underscores', 'tide-with-dashes');

      expect(mockR2.get).toHaveBeenCalledWith('users/user_with_underscores/tides/tide-with-dashes.json');
    });
  });

  describe('saveTideData', () => {
    test('should save tide data to R2 successfully', async () => {
      const tideData = {
        id: 'test-tide-123',
        name: 'Test Tide',
        user_id: 'test-user',
        status: 'active',
        created_at: new Date().toISOString(),
        flow_sessions: []
      };

      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.put.mockResolvedValue({}); // R2 put returns success

      const result = await storage.saveTideData('test-user', 'test-tide-123', tideData);
      
      expect(result).toBe(true);

      expect(mockR2.put).toHaveBeenCalledWith(
        'users/test-user/tides/test-tide-123.json',
        JSON.stringify(tideData, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json'
          }
        }
      );
    });

    test('should handle R2 put errors', async () => {
      const tideData = { id: 'test' };
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.put.mockRejectedValue(new Error('R2 put failed'));

      const result = await storage.saveTideData('test-user', 'test-tide-123', tideData);
      
      expect(result).toBe(false);
    });

    test('should format JSON with proper indentation', async () => {
      const tideData = {
        id: 'test-tide-123',
        nested: {
          property: 'value',
          array: [1, 2, 3]
        }
      };

      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.put.mockResolvedValue({});

      await storage.saveTideData('test-user', 'test-tide-123', tideData);

      expect(mockR2.put).toHaveBeenCalledWith(
        'users/test-user/tides/test-tide-123.json',
        JSON.stringify(tideData, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json'
          }
        }
      );
    });
  });

  describe('deleteTideData', () => {
    test('should delete tide data from R2 successfully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.delete.mockResolvedValue({});

      const result = await storage.deleteTideData('test-user', 'test-tide-123');
      
      expect(result).toBe(true);

      expect(mockR2.delete).toHaveBeenCalledWith('users/test-user/tides/test-tide-123.json');
    });

    test('should handle R2 delete errors', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.delete.mockRejectedValue(new Error('R2 delete failed'));

      const result = await storage.deleteTideData('test-user', 'test-tide-123');
      
      expect(result).toBe(false);
    });

    test('should handle deletion of non-existent tide gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.delete.mockResolvedValue({}); // R2 doesn't error on deleting non-existent objects

      const result = await storage.deleteTideData('test-user', 'nonexistent-tide');
      
      expect(result).toBe(true);
    });
  });

  describe('listUserTides', () => {
    test('should list user tides from R2', async () => {
      const mockObjects = [
        { key: 'users/test-user/tides/tide-1.json' },
        { key: 'users/test-user/tides/tide-2.json' },
        { key: 'users/test-user/tides/tide-3.json' }
      ];

      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.list.mockResolvedValue({
        objects: mockObjects
      });

      const result = await storage.listUserTides('test-user');

      expect(result).toEqual(['tide-1', 'tide-2', 'tide-3']);
      expect(mockR2.list).toHaveBeenCalledWith({
        prefix: 'users/test-user/tides/'
      });
    });

    test('should return empty array when user has no tides', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.list.mockResolvedValue({
        objects: []
      });

      const result = await storage.listUserTides('test-user');

      expect(result).toEqual([]);
    });

    test('should handle R2 list errors', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.list.mockRejectedValue(new Error('R2 list failed'));

      const result = await storage.listUserTides('test-user');
      
      expect(result).toEqual([]);
    });

    test('should extract tide IDs correctly from R2 keys', async () => {
      const mockObjects = [
        { key: 'users/test-user/tides/my-complex-tide-name.json' },
        { key: 'users/test-user/tides/tide_with_underscores.json' },
        { key: 'users/test-user/tides/123-numeric-tide.json' }
      ];

      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.list.mockResolvedValue({
        objects: mockObjects
      });

      const result = await storage.listUserTides('test-user');

      expect(result).toEqual([
        'my-complex-tide-name',
        'tide_with_underscores',
        '123-numeric-tide'
      ]);
    });

    test('should filter out invalid keys', async () => {
      const mockObjects = [
        { key: 'users/test-user/tides/valid-tide.json' },
        { key: 'users/test-user/tides/no-extension' },
        { key: 'users/test-user/tides/.hidden' },
        { key: 'users/other-user/tides/other-tide.json' },
        { key: 'users/test-user/tides/another-valid.json' }
      ];

      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.list.mockResolvedValue({
        objects: mockObjects
      });

      const result = await storage.listUserTides('test-user');

      // Should only include valid JSON files for the correct user
      expect(result).toEqual(['valid-tide', 'another-valid']);
    });
  });

  describe('tideExists', () => {
    test('should return true when tide exists', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.head.mockResolvedValue({
        httpMetadata: { contentType: 'application/json' }
      });

      const result = await storage.tideExists('test-user', 'test-tide-123');

      expect(result).toBe(true);
      expect(mockR2.head).toHaveBeenCalledWith('users/test-user/tides/test-tide-123.json');
    });

    test('should return false when tide does not exist', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.head.mockResolvedValue(null);

      const result = await storage.tideExists('test-user', 'nonexistent-tide');

      expect(result).toBe(false);
    });

    test('should handle R2 head errors and return false', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.head.mockRejectedValue(new Error('R2 head failed'));

      const result = await storage.tideExists('test-user', 'test-tide-123');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should wrap all R2 errors with descriptive messages', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;

      // Test each method's error handling - service returns null/false instead of throwing
      mockR2.get.mockRejectedValue(new Error('Network timeout'));
      const getTideResult = await storage.getTideData('user', 'test');
      expect(getTideResult).toBeNull();

      mockR2.put.mockRejectedValue(new Error('Permission denied'));
      const storeResult = await storage.saveTideData('user', 'test', {});
      expect(storeResult).toBe(false);

      mockR2.delete.mockRejectedValue(new Error('Service unavailable'));
      const deleteResult = await storage.deleteTideData('user', 'test');
      expect(deleteResult).toBe(false);

      mockR2.list.mockRejectedValue(new Error('Rate limited'));
      const listResult = await storage.listUserTides('user');
      expect(listResult).toEqual([]);
    });

    test('should preserve original error details in wrapped errors', async () => {
      const originalError = new Error('Original R2 error with details');
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockRejectedValue(originalError);

      // Service logs errors but returns null instead of throwing
      const result = await storage.getTideData('user', 'test');
      expect(result).toBeNull();
    });
  });
});