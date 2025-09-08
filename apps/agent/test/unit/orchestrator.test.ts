/**
 * Orchestrator Service Unit Tests
 * Tests for intelligent routing and service coordination
 */

import { OrchestratorService } from '../../src/services/orchestrator.js';
import type { Env, ChatRequest } from '../../src/types.js';

// Mock all services
const mockServiceInferrer = {
  inferServiceWithAI: jest.fn()
};

const mockInsightsService = {
  generateInsights: jest.fn()
};

const mockOptimizeService = {
  optimizeSchedule: jest.fn()
};

const mockQuestionsService = {
  processQuestion: jest.fn()
};

const mockPreferencesService = {
  getPreferences: jest.fn(),
  updatePreferences: jest.fn()
};

const mockReportsService = {
  generateReport: jest.fn()
};

// Mock modules
jest.mock('../../src/service-inferrer.js', () => ({
  ServiceInferrer: jest.fn(() => mockServiceInferrer)
}));

jest.mock('../../src/services/insights.js', () => ({
  InsightsService: jest.fn(() => mockInsightsService)
}));

jest.mock('../../src/services/optimize.js', () => ({
  OptimizeService: jest.fn(() => mockOptimizeService)
}));

jest.mock('../../src/services/questions.js', () => ({
  QuestionsService: jest.fn(() => mockQuestionsService)
}));

jest.mock('../../src/services/preferences.js', () => ({
  PreferencesService: jest.fn(() => mockPreferencesService)
}));

jest.mock('../../src/services/reports.js', () => ({
  ReportsService: jest.fn(() => mockReportsService)
}));

describe('OrchestratorService', () => {
  let orchestrator: OrchestratorService;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      AI: 'mock-ai',
      TIDES_AUTH_KV: 'mock-kv',
      TIDES_R2: 'mock-r2'
    } as any;

    // Reset all mocks
    jest.clearAllMocks();
    
    orchestrator = new OrchestratorService(mockEnv);
  });

  describe('Construction', () => {
    it('should create orchestrator instance', () => {
      expect(orchestrator).toBeInstanceOf(OrchestratorService);
    });

    it('should initialize all services', () => {
      expect(orchestrator).toBeDefined();
    });
  });

  describe('handleRequest - Explicit Service Routing', () => {
    it('should route to insights service with explicit service param', async () => {
      const mockResult = { productivity_score: 85, trends: {} };
      mockInsightsService.generateInsights.mockResolvedValue(mockResult);

      const body = {
        service: 'insights',
        api_key: 'test-key',
        tides_id: 'test-tide'
      };

      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.data).toBe(mockResult);
      expect(result.service).toBe('insights');
      expect(result.inferenceInfo.confidence).toBe(100);
      expect(result.inferenceInfo.reasoning).toBe('Explicit service parameter');
      expect(mockInsightsService.generateInsights).toHaveBeenCalledWith(body, 'test-user');
    });

    it('should route to optimize service with explicit service param', async () => {
      const mockResult = { recommendations: ['work at 9am'] };
      mockOptimizeService.optimizeSchedule.mockResolvedValue(mockResult);

      const body = { service: 'optimize', api_key: 'test-key', tides_id: 'test-tide' };
      
      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.service).toBe('optimize');
      expect(mockOptimizeService.optimizeSchedule).toHaveBeenCalledWith(body, 'test-user');
    });

    it('should route to questions service with explicit service param', async () => {
      const mockResult = { answer: 'You are productive!' };
      mockQuestionsService.processQuestion.mockResolvedValue(mockResult);

      const body = { service: 'questions', api_key: 'test-key', tides_id: 'test-tide' };
      
      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.service).toBe('questions');
      expect(mockQuestionsService.processQuestion).toHaveBeenCalledWith(body, 'test-user', 'test-key');
    });

    it('should route to preferences service for getting preferences', async () => {
      const mockResult = { work_hours: '9-5' };
      mockPreferencesService.getPreferences.mockResolvedValue(mockResult);

      const body = { service: 'preferences', api_key: 'test-key', tides_id: 'test-tide' };
      
      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.service).toBe('preferences');
      expect(mockPreferencesService.getPreferences).toHaveBeenCalledWith('test-user');
    });

    it('should route to preferences service for updating preferences', async () => {
      const mockResult = { work_hours: '10-6' };
      mockPreferencesService.updatePreferences.mockResolvedValue(mockResult);

      const body = { 
        service: 'preferences', 
        preferences: { work_hours: '10-6' },
        api_key: 'test-key', 
        tides_id: 'test-tide' 
      };
      
      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.service).toBe('preferences');
      expect(mockPreferencesService.updatePreferences).toHaveBeenCalledWith(body, 'test-user');
    });

    it('should route to reports service with explicit service param', async () => {
      const mockResult = { summary: 'You had a good week' };
      mockReportsService.generateReport.mockResolvedValue(mockResult);

      const body = { service: 'reports', api_key: 'test-key', tides_id: 'test-tide' };
      
      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.service).toBe('reports');
      expect(mockReportsService.generateReport).toHaveBeenCalledWith(body, 'test-user');
    });
  });

  describe('handleRequest - AI Inference Routing', () => {
    it('should use AI inference when no explicit service provided', async () => {
      mockServiceInferrer.inferServiceWithAI.mockResolvedValue({ 
        service: 'insights', 
        confidence: 85 
      });
      mockInsightsService.generateInsights.mockResolvedValue({ productivity_score: 90 });

      const body = {
        message: 'How productive was I today?',
        api_key: 'test-key',
        tides_id: 'test-tide'
      };

      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(mockServiceInferrer.inferServiceWithAI).toHaveBeenCalledWith(body);
      expect(result.service).toBe('insights');
      expect(result.inferenceInfo.confidence).toBe(85);
      expect(result.inferenceInfo.reasoning).toBe('AI-powered semantic analysis');
    });

    it('should handle chat service from AI inference', async () => {
      mockServiceInferrer.inferServiceWithAI.mockResolvedValue({ 
        service: 'chat', 
        confidence: 60 
      });

      const body = {
        message: 'Hello there',
        api_key: 'test-key',
        tides_id: 'test-tide'
      };

      // Mock the processRequest method (which would normally be called for chat)
      const mockProcessRequest = jest.spyOn(orchestrator, 'processRequest');
      mockProcessRequest.mockResolvedValue({ 
        message: 'Hello! How can I help?',
        conversation_id: 'test-123'
      });

      const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

      expect(result.service).toBe('chat');
      expect(mockProcessRequest).toHaveBeenCalledWith(body, 'test-user');
      
      mockProcessRequest.mockRestore();
    });

    it('should infer different services based on message content', async () => {
      const testCases = [
        { message: 'optimize my schedule', expectedService: 'optimize' },
        { message: 'show me insights', expectedService: 'insights' },
        { message: 'generate a report', expectedService: 'reports' },
        { message: 'what are my settings', expectedService: 'preferences' }
      ];

      for (const testCase of testCases) {
        mockServiceInferrer.inferServiceWithAI.mockResolvedValue({ 
          service: testCase.expectedService, 
          confidence: 80 
        });

        // Mock the appropriate service
        const services = {
          optimize: mockOptimizeService.optimizeSchedule,
          insights: mockInsightsService.generateInsights,
          reports: mockReportsService.generateReport,
          preferences: mockPreferencesService.getPreferences
        };
        services[testCase.expectedService].mockResolvedValue({ test: 'result' });

        const body = {
          message: testCase.message,
          api_key: 'test-key',
          tides_id: 'test-tide'
        };

        const result = await orchestrator.handleRequest(body, 'test-user', '/coordinator');

        expect(result.service).toBe(testCase.expectedService);
        expect(mockServiceInferrer.inferServiceWithAI).toHaveBeenCalledWith(body);
      }
    });
  });

  describe('handleRequest - Legacy Endpoint Support', () => {
    it('should handle legacy direct endpoints', async () => {
      mockInsightsService.generateInsights.mockResolvedValue({ productivity_score: 75 });

      const body = { api_key: 'test-key', tides_id: 'test-tide' };
      
      const result = await orchestrator.handleRequest(body, 'test-user', '/insights');

      expect(result.service).toBe('insights');
      expect(result.inferenceInfo.reasoning).toBe('Explicit endpoint');
      expect(mockInsightsService.generateInsights).toHaveBeenCalledWith(body, 'test-user');
    });

    it('should handle all legacy endpoints', async () => {
      const legacyEndpoints = [
        { path: '/insights', service: 'insights', mock: mockInsightsService.generateInsights },
        { path: '/optimize', service: 'optimize', mock: mockOptimizeService.optimizeSchedule },
        { path: '/questions', service: 'questions', mock: mockQuestionsService.processQuestion },
        { path: '/preferences', service: 'preferences', mock: mockPreferencesService.getPreferences },
        { path: '/reports', service: 'reports', mock: mockReportsService.generateReport }
      ];

      for (const endpoint of legacyEndpoints) {
        endpoint.mock.mockResolvedValue({ test: 'result' });

        const body = { api_key: 'test-key', tides_id: 'test-tide' };
        const result = await orchestrator.handleRequest(body, 'test-user', endpoint.path);

        expect(result.service).toBe(endpoint.service);
      }
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid services', async () => {
      const body = { 
        service: 'invalid-service',
        api_key: 'test-key', 
        tides_id: 'test-tide' 
      };

      await expect(orchestrator.handleRequest(body, 'test-user', '/coordinator'))
        .rejects.toThrow('Invalid service: invalid-service');
    });

    it('should reject invalid legacy endpoints', async () => {
      const body = { api_key: 'test-key', tides_id: 'test-tide' };

      await expect(orchestrator.handleRequest(body, 'test-user', '/invalid'))
        .rejects.toThrow('Invalid service: invalid');
    });

    it('should handle service execution errors', async () => {
      mockInsightsService.generateInsights.mockRejectedValue(new Error('Service failed'));

      const body = { 
        service: 'insights',
        api_key: 'test-key', 
        tides_id: 'test-tide' 
      };

      await expect(orchestrator.handleRequest(body, 'test-user', '/coordinator'))
        .rejects.toThrow('Service failed');
    });

    it('should handle AI inference errors gracefully', async () => {
      mockServiceInferrer.inferServiceWithAI.mockRejectedValue(new Error('AI failed'));

      const body = {
        message: 'test message',
        api_key: 'test-key',
        tides_id: 'test-tide'
      };

      await expect(orchestrator.handleRequest(body, 'test-user', '/coordinator'))
        .rejects.toThrow('AI failed');
    });
  });

  describe('processRequest - Chat Functionality', () => {
    const mockRequest: ChatRequest = {
      message: 'Hello, how are you?',
      api_key: 'test-key',
      tides_id: 'test-tide'
    };

    it('should handle basic chat requests', async () => {
      const result = await orchestrator.processRequest(mockRequest, 'test-user');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should detect service patterns and route appropriately', async () => {
      mockServiceInferrer.inferServiceWithAI.mockResolvedValue({ 
        service: 'insights', 
        confidence: 85 
      });
      mockInsightsService.generateInsights.mockResolvedValue({ productivity_score: 80 });

      const insightsRequest = {
        ...mockRequest,
        message: 'show me my productivity insights'
      };

      // Test that it detects insights pattern
      const result = await orchestrator.processRequest(insightsRequest, 'test-user');

      // The method should detect "insights" pattern and route to insights service
      expect(result).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should check confidence thresholds correctly', () => {
      expect(orchestrator.needsClarification(60)).toBe(true);
      expect(orchestrator.needsClarification(80)).toBe(false);
    });
  });
});