import { R2RestApiStorage } from '../../src/storage/r2-rest';
import { CreateTideInput } from '../../src/storage';

// Mock fetch for testing
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('R2RestApiStorage', () => {
  let storage: R2RestApiStorage;
  let mockConfig = {
    accountId: 'test-account-id',
    bucketName: 'test-bucket',
    apiToken: 'test-token',
  };

  beforeEach(() => {
    storage = new R2RestApiStorage(mockConfig);
    mockFetch.mockReset();
  });

  describe('createTide', () => {
    it('should create a tide and store via REST API', async () => {
      const input: CreateTideInput = {
        name: 'Test Tide',
        flow_type: 'daily',
        description: 'A test tide'
      };

      // Mock successful responses
      mockFetch
        .mockResolvedValueOnce({ ok: true }) // Tide file PUT
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Index GET (doesn't exist initially)
        .mockResolvedValueOnce({ ok: true }); // Index file PUT

      const tide = await storage.createTide(input);

      expect(tide.id).toMatch(/^tide_\d+_[a-z0-9]+$/);
      expect(tide.name).toBe('Test Tide');
      expect(tide.flow_type).toBe('daily');
      expect(tide.description).toBe('A test tide');
      expect(tide.status).toBe('active');

      // Verify at least the tide creation call was made
      // Note: Index update happens asynchronously so we only check for the tide PUT
      expect(mockFetch).toHaveBeenCalled();
      
      // Check tide file PUT
      const firstCall = mockFetch.mock.calls[0];
      expect(firstCall[0]).toBe(`https://api.cloudflare.com/client/v4/accounts/test-account-id/r2/buckets/test-bucket/objects/tides/${tide.id}.json`);
      expect(firstCall[1]).toMatchObject({
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
      expect(firstCall[1].body).toContain('"name": "Test Tide"');
    });

    it('should handle API errors gracefully', async () => {
      const input: CreateTideInput = {
        name: 'Failed Tide',
        flow_type: 'weekly'
      };

      // Mock failed PUT response
      mockFetch.mockResolvedValueOnce({ 
        ok: false, 
        status: 403, 
        statusText: 'Forbidden' 
      });

      await expect(storage.createTide(input)).rejects.toThrow(
        'Failed to put object tides/tide_'
      );
    });
  });

  describe('getTide', () => {
    it('should retrieve tide via REST API', async () => {
      const tideData = {
        id: 'tide_123',
        name: 'Retrieved Tide',
        flow_type: 'project'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tideData,
      });

      const result = await storage.getTide('tide_123');

      expect(result).toEqual(tideData);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.cloudflare.com/client/v4/accounts/test-account-id/r2/buckets/test-bucket/objects/tides/tide_123.json`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token',
          },
        })
      );
    });

    it('should return null for 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await storage.getTide('non-existent');
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await storage.getTide('error-tide');
      expect(result).toBeNull();
    });
  });

  describe('listTides', () => {
    it('should list tides from index via REST API', async () => {
      const indexData = {
        tides: [
          {
            id: 'tide_1',
            name: 'First Tide',
            flow_type: 'daily',
            status: 'active',
            created_at: '2025-07-31T10:00:00Z',
            flow_count: 5,
            last_flow: '2025-07-31T09:00:00Z',
          },
          {
            id: 'tide_2',
            name: 'Second Tide',
            flow_type: 'weekly',
            status: 'completed',
            created_at: '2025-07-30T10:00:00Z',
            flow_count: 2,
            last_flow: null,
          },
        ],
        updated_at: '2025-07-31T10:30:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => indexData,
      });

      const result = await storage.listTides();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('First Tide');
      expect(result[1].name).toBe('Second Tide');
      
      // Check that newer tide is first (sorted by created_at desc)
      expect(new Date(result[0].created_at).getTime()).toBeGreaterThan(
        new Date(result[1].created_at).getTime()
      );
    });

    it('should filter tides by flow_type', async () => {
      const indexData = {
        tides: [
          {
            id: 'tide_1',
            name: 'Daily Tide',
            flow_type: 'daily',
            status: 'active',
            created_at: '2025-07-31T10:00:00Z',
            flow_count: 0,
            last_flow: null,
          },
          {
            id: 'tide_2',
            name: 'Weekly Tide',
            flow_type: 'weekly',
            status: 'active',
            created_at: '2025-07-30T10:00:00Z',
            flow_count: 0,
            last_flow: null,
          },
        ],
        updated_at: '2025-07-31T10:30:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => indexData,
      });

      const result = await storage.listTides({ flow_type: 'daily' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Daily Tide');
    });

    it('should return empty array when no index exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await storage.listTides();
      expect(result).toEqual([]);
    });
  });

  describe('URL generation', () => {
    it('should generate correct API URLs', async () => {
      // This test verifies the private getApiUrl method through public method calls
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await storage.getTide('test-id');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/accounts/test-account-id/r2/buckets/test-bucket/objects/tides/test-id.json',
        expect.any(Object)
      );
    });
  });
});