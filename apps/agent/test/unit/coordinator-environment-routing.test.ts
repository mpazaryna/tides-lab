/**
 * Coordinator Environment-Specific Routing Integration Tests
 * 
 * Tests that the coordinator routes requests to services and
 * services properly use environment-specific storage (without full coordinator instantiation)
 */

import { InsightsService } from '../../src/services/insights.js';
import { OptimizeService } from '../../src/services/optimize.js';
import { QuestionsService } from '../../src/services/questions.js';
import { ReportsService } from '../../src/services/reports.js';

describe('Coordinator Environment-Specific Routing Integration', () => {
  let mockEnv: any;
  let mockTideData: any;
  let insightsService: InsightsService;
  let optimizeService: OptimizeService; 
  let questionsService: QuestionsService;
  let reportsService: ReportsService;

  beforeEach(() => {
    // Setup mock environment for simple environment-specific storage
    mockEnv = {
      // Primary TIDES_R2 bucket (environment-specific)
      TIDES_R2: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        head: jest.fn(),
        list: jest.fn()
      },
      DB: {},
      TIDES_AUTH_KV: {},
      AI: {},
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      R2_BUCKET_NAME: 'tides-003-storage',
      ENVIRONMENT: 'development'
    };

    // Mock tide data matching the structure services expect
    mockTideData = {
      id: 'test-environment-tide',
      user_id: 'testuser101',
      name: 'Environment-Specific Test Tide',
      description: 'Testing environment-specific data access',
      type: 'daily',
      created_at: '2025-09-06T12:00:00.000Z',
      flow_sessions: [
        {
          id: 'flow_001',
          started_at: '2025-09-06T09:00:00.000Z',
          ended_at: '2025-09-06T09:45:00.000Z',
          duration: 45,
          intensity: 'moderate',
          focus_area: 'development'
        }
      ],
      energy_updates: [
        {
          id: 'energy_001',
          timestamp: '2025-09-06T09:00:00.000Z',
          energy_level: '8',
          context: 'Morning productivity'
        }
      ],
      task_links: [
        {
          id: 'task_001',
          task_type: 'github_issue',
          task_id: 'issue-456',
          linked_at: '2025-09-06T09:15:00.000Z',
          context: 'Implementation work'
        }
      ]
    };

    // TIDES_R2 has the data (environment-specific bucket)
    mockEnv.TIDES_R2.get.mockResolvedValue({
      json: async () => mockTideData,
      text: async () => JSON.stringify(mockTideData)
    });

    // Initialize services (same as coordinator does)
    insightsService = new InsightsService(mockEnv);
    optimizeService = new OptimizeService(mockEnv);
    questionsService = new QuestionsService(mockEnv);
    reportsService = new ReportsService(mockEnv);
  });

  describe('Service Routing with Environment-Specific Storage', () => {
    it('should route insights requests through environment-specific storage', async () => {
      // Arrange - Request matching what coordinator would receive
      const request = {
        api_key: 'tides_testuser101_routing123',
        tides_id: 'test-environment-tide',
        timeframe: '7d'
      };
      const userId = 'testuser101'; // Coordinator uses mock auth with this user

      console.log('🔍 Testing insights service routing with environment-specific storage');

      // Act - Service call as coordinator would make it
      const result = await insightsService.generateInsights(request, userId);

      // Assert - Service should return valid insights
      expect(result).toBeDefined();
      expect(result.productivity_score).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.recommendations).toBeDefined();

      // Verify environment-specific bucket was used
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Insights routing with environment-specific storage successful');
    });

    it('should route optimize requests with environment-specific data access', async () => {
      // Arrange
      const request = {
        api_key: 'tides_testuser101_optimize789',
        tides_id: 'test-environment-tide',
        preferences: {
          work_hours: { start: '09:00', end: '17:00' },
          break_duration: 15
        }
      };
      const userId = 'testuser101';

      console.log('🔍 Testing optimize service routing with environment-specific access');

      // Act
      const result = await optimizeService.optimizeSchedule(request, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.suggested_schedule).toBeDefined();
      expect(result.efficiency_gains).toBeDefined();

      // Verify environment-specific bucket was used
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Optimize routing with environment-specific access successful');
    });

    it('should route questions requests with environment-specific context retrieval', async () => {
      // Arrange
      const request = {
        api_key: 'tides_testuser101_questions456',
        tides_id: 'test-environment-tide',
        question: 'How can I improve my focus sessions?',
        context: 'Looking to optimize my development workflow'
      };
      const userId = 'testuser101';

      console.log('🔍 Testing questions service routing with environment-specific context');

      // Act
      const result = await questionsService.processQuestion(request, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.related_insights).toBeDefined();
      expect(result.suggested_actions).toBeDefined();

      // Verify environment-specific bucket was used
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Questions routing with environment-specific context successful');
    });

    it('should route reports requests with environment-specific data aggregation', async () => {
      // Arrange
      const request = {
        api_key: 'tides_testuser101_reports123',
        tides_id: 'test-environment-tide',
        report_type: 'summary' as const,
        period: '30d'
      };
      const userId = 'testuser101';

      console.log('🔍 Testing reports service routing with environment-specific aggregation');

      // Act
      const result = await reportsService.generateReport(request, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.report_type).toBe('summary');
      expect(result.period).toBe('30d');
      expect(result.summary).toBeDefined();

      // Verify environment-specific bucket was used
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Reports routing with environment-specific aggregation successful');
    });
  });

  describe('Coordinator-Style Error Handling', () => {
    it('should handle service errors gracefully when tide not found in environment bucket', async () => {
      // Arrange - Environment bucket doesn't have the data
      mockEnv.TIDES_R2.get.mockResolvedValue(null);

      const request = {
        api_key: 'tides_testuser101_notfound999',
        tides_id: 'nonexistent-tide',
        timeframe: '7d'
      };
      const userId = 'testuser101';

      console.log('🔍 Testing coordinator-style error handling for missing data');

      // Act & Assert
      await expect(insightsService.generateInsights(request, userId))
        .rejects.toThrow('No tide data found for user: testuser101, tide: nonexistent-tide');

      // Verify environment bucket was searched
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Coordinator-style error handling verified');
    });

    it('should demonstrate environment-specific bucket usage', async () => {
      // Arrange - Environment bucket has the data (as expected)
      const environmentTideData = {
        ...mockTideData,
        name: 'Environment-Specific Tide Data',
        description: 'Data stored in the correct environment bucket'
      };

      mockEnv.TIDES_R2.get.mockResolvedValue({
        json: async () => environmentTideData,
        text: async () => JSON.stringify(environmentTideData)
      });

      const request = {
        api_key: 'tides_testuser101_environment888',
        tides_id: 'test-environment-tide',
        timeframe: '7d'
      };
      const userId = 'testuser101';

      console.log('🔍 Testing environment-specific bucket usage');

      // Act
      const result = await insightsService.generateInsights(request, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.productivity_score).toBeDefined();

      // Environment bucket should be used directly
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Environment-specific bucket usage verified');
    });
  });

  describe('Performance and Reliability', () => {
    it('should maintain coordinator-level performance with environment-specific access', async () => {
      // Arrange
      const request = {
        api_key: 'tides_testuser101_perf555',
        tides_id: 'test-environment-tide',
        timeframe: '7d'
      };
      const userId = 'testuser101';

      console.log('🔍 Testing coordinator-level performance with environment-specific access');

      const startTime = performance.now();

      // Act
      const result = await insightsService.generateInsights(request, userId);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(100); // Should complete quickly in test environment

      // Verify single bucket access
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log(`✅ Environment-specific coordinator performance: ${responseTime.toFixed(2)}ms`);
    });

    it('should handle environment bucket failure gracefully', async () => {
      // Arrange - Environment bucket fails
      mockEnv.TIDES_R2.get.mockRejectedValue(new Error('Environment bucket unavailable'));

      const request = {
        api_key: 'tides_testuser101_resilient777',
        tides_id: 'test-environment-tide',
        timeframe: '7d'
      };
      const userId = 'testuser101';

      console.log('🔍 Testing coordinator-level resilience to environment bucket failure');

      // Act & Assert
      await expect(insightsService.generateInsights(request, userId))
        .rejects.toThrow('No tide data found for user: testuser101, tide: test-environment-tide');

      // Verify environment bucket was attempted
      expect(mockEnv.TIDES_R2.get).toHaveBeenCalledWith(`users/${userId}/tides/${request.tides_id}.json`);

      console.log('✅ Coordinator-level environment bucket failure handling verified');
    });
  });
});