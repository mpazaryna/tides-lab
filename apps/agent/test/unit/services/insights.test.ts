/**
 * Tests for InsightsService
 */

import { InsightsService } from '../../../src/services/insights';
import type { Env, InsightsRequest } from '../../../src/types';
import { setupR2MockWithRealData } from '../../helpers/tideDataHelper';

describe('InsightsService', () => {
  let insightsService: InsightsService;
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

    insightsService = new InsightsService(mockEnv);
  });

  describe('generateInsights', () => {
    test('should generate insights with default timeframe', async () => {
      // Use real tide data structure from R2
      const mockTideData = setupR2MockWithRealData(mockEnv);
      
      const request: InsightsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default'
      };

      const result = await insightsService.generateInsights(request, 'test-user');

      expect(result.productivity_score).toBeGreaterThanOrEqual(60);
      expect(result.productivity_score).toBeLessThanOrEqual(100);
      expect(result.trends).toBeDefined();
      expect(result.trends.daily_average).toBeGreaterThanOrEqual(70);
      expect(result.trends.weekly_pattern).toHaveLength(7);
      expect(result.trends.improvement_areas).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Verify it uses real data structure by checking non-empty recommendations
      expect(result.recommendations.length).toBeGreaterThan(2);
      expect(result.recommendations.every(rec => typeof rec === 'string' && rec.length > 10)).toBe(true);
    });

    test('should generate insights with custom timeframe', async () => {
      // Use real tide data structure
      setupR2MockWithRealData(mockEnv);
      
      const request: InsightsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        timeframe: '30d'
      };

      const result = await insightsService.generateInsights(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.productivity_score).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.trends.weekly_pattern).toHaveLength(7);
    });

    test('should throw error for missing tide data', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      const request: InsightsRequest = {
        api_key: 'test-api-key',
        tides_id: 'nonexistent-tide'
      };

      await expect(insightsService.generateInsights(request, 'test-user'))
        .rejects.toThrow('No tide data found for user: test-user, tide: nonexistent-tide');
    });
  });

  describe('analyzeFocusAreas', () => {
    test('should analyze default focus areas', async () => {
      const request: InsightsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123'
      };

      const result = await insightsService.analyzeFocusAreas(request, 'test-user');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(Object.keys(result)).toEqual(['coding', 'meetings', 'planning', 'learning']);
      
      Object.values(result).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(60);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    test('should analyze custom focus areas', async () => {
      const request: InsightsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        focus_areas: ['writing', 'research']
      };

      const result = await insightsService.analyzeFocusAreas(request, 'test-user');

      expect(result).toBeDefined();
      expect(Object.keys(result)).toEqual(['writing', 'research']);
      
      Object.values(result).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(60);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getProductivityTrends', () => {
    test('should generate trends for default 30 days', async () => {
      const result = await insightsService.getProductivityTrends('test-tide-123', 'test-user');

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(30);
      
      result.forEach(trend => {
        expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(trend.score).toBeGreaterThanOrEqual(65);
        expect(trend.score).toBeLessThanOrEqual(95);
      });

      // Verify dates are in chronological order (oldest first)
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime()).toBeGreaterThan(new Date(result[i-1].date).getTime());
      }
    });

    test('should generate trends for custom number of days', async () => {
      const result = await insightsService.getProductivityTrends('test-tide-123', 'test-user', 7);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(7);
    });
  });
});