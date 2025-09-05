/**
 * Unit Tests for OptimizeService
 */

import { OptimizeService } from '../../../src/services/optimize';
import type { Env, OptimizeRequest } from '../../../src/types';
import { setupR2MockWithRealData } from '../../helpers/tideDataHelper';

describe('OptimizeService', () => {
  let optimizeService: OptimizeService;
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

    // Setup R2 mock with real data by default for all tests
    setupR2MockWithRealData(mockEnv);

    optimizeService = new OptimizeService(mockEnv);
  });

  describe('optimizeSchedule', () => {
    test('should generate optimization with default preferences', async () => {

      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default'
      };

      const result = await optimizeService.optimizeSchedule(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.suggested_schedule).toBeDefined();
      expect(result.suggested_schedule.time_blocks).toBeInstanceOf(Array);
      expect(result.suggested_schedule.time_blocks.length).toBeGreaterThan(0);
      expect(result.efficiency_gains).toBeDefined();
      expect(result.efficiency_gains.estimated_time_saved).toBeGreaterThanOrEqual(30);
      expect(result.efficiency_gains.estimated_time_saved).toBeLessThanOrEqual(90);
      expect(result.efficiency_gains.focus_improvement).toBeGreaterThanOrEqual(20);
      expect(result.efficiency_gains.focus_improvement).toBeLessThanOrEqual(50);

      // Validate time block structure
      result.suggested_schedule.time_blocks.forEach(block => {
        expect(block.start).toMatch(/^\d{2}:\d{2}$/);
        expect(block.end).toMatch(/^\d{2}:\d{2}$/);
        expect(typeof block.activity).toBe('string');
        expect(typeof block.priority).toBe('number');
        expect(block.priority).toBeGreaterThanOrEqual(1);
        expect(block.priority).toBeLessThanOrEqual(3);
      });
    });

    test('should generate optimization with custom preferences', async () => {

      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        preferences: {
          work_hours: { start: '08:00', end: '16:00' },
          break_duration: 20,
          focus_time_blocks: 120
        }
      };

      const result = await optimizeService.optimizeSchedule(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.suggested_schedule.time_blocks.length).toBeGreaterThan(0);
    });

    test('should handle missing tide data gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'nonexistent-tide'
      };

      await expect(optimizeService.optimizeSchedule(request, 'test-user'))
        .rejects.toThrow('No tide data found for user: test-user, tide: nonexistent-tide');
    });
  });

  describe('analyzeCurrentSchedule', () => {
    test('should return schedule analysis with efficiency score', async () => {
      const result = await optimizeService.analyzeCurrentSchedule('test-tide-123', 'test-user');

      expect(result.efficiency_score).toBeGreaterThanOrEqual(60);
      expect(result.efficiency_score).toBeLessThanOrEqual(100);
      expect(result.bottlenecks).toBeInstanceOf(Array);
      expect(result.bottlenecks.length).toBeGreaterThan(0);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Validate content quality
      result.bottlenecks.forEach(bottleneck => {
        expect(typeof bottleneck).toBe('string');
        expect(bottleneck.length).toBeGreaterThan(10);
      });

      result.suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(10);
      });
    });
  });

  describe('getProductivityTips', () => {
    test('should return array of productivity tips', async () => {
      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default'
      };

      const result = await optimizeService.getProductivityTips(request, 'test-user');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(4); // Should return 4 random tips
      
      result.forEach(tip => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(20); // Meaningful tips should be substantial
      });

      // Verify tips are from the expected pool
      const allTips = [
        'Try the Pomodoro Technique: 25 minutes focused work, 5 minute break',
        'Use the 2-minute rule: if a task takes less than 2 minutes, do it immediately',
        'Batch similar tasks together to minimize context switching',
        'Schedule your most challenging work during your peak energy hours',
        'Keep a "done" list alongside your to-do list for motivation',
        'Use time-blocking to protect focused work time',
        'Take regular breaks to maintain mental clarity',
        'Review and adjust your schedule weekly based on what worked'
      ];

      result.forEach(tip => {
        expect(allTips).toContain(tip);
      });
    });

    test('should return different tips on multiple calls', async () => {
      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default'
      };

      const result1 = await optimizeService.getProductivityTips(request, 'test-user');
      const result2 = await optimizeService.getProductivityTips(request, 'test-user');

      // While there's a small chance they could be the same, it's highly unlikely
      // This tests the randomization aspect
      expect(result1).not.toEqual(result2);
    });
  });

  describe('error handling', () => {
    test('should handle R2 storage errors gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockRejectedValue(new Error('R2 storage error'));

      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default'
      };

      // StorageService catches R2 errors and returns null,
      // so OptimizeService throws "No tide data found" error
      await expect(optimizeService.optimizeSchedule(request, 'test-user'))
        .rejects.toThrow('No tide data found for user: test-user, tide: daily-tide-default');
    });
  });

  describe('data validation', () => {
    test('should handle undefined preferences gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          id: 'test-tide-123',
          name: 'Test Tide'
        })
      });

      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        preferences: undefined
      };

      const result = await optimizeService.optimizeSchedule(request, 'test-user');
      expect(result).toBeDefined();
    });

    test('should handle empty constraints gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          id: 'test-tide-123',
          name: 'Test Tide'
        })
      });

      const request: OptimizeRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        constraints: {}
      };

      const result = await optimizeService.optimizeSchedule(request, 'test-user');
      expect(result).toBeDefined();
    });
  });
});