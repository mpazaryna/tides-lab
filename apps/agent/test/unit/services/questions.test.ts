/**
 * Unit Tests for QuestionsService
 */

import { QuestionsService } from '../../../src/services/questions';
import type { Env, QuestionsRequest } from '../../../src/types';
import { setupR2MockWithRealData } from '../../helpers/tideDataHelper';

describe('QuestionsService', () => {
  let questionsService: QuestionsService;
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

    questionsService = new QuestionsService(mockEnv);
  });

  describe('processQuestion', () => {

    test('should process morning productivity question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'How can I improve my morning productivity?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe('string');
      expect(result.answer.length).toBeGreaterThan(50);
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.related_insights).toBeInstanceOf(Array);
      expect(result.suggested_actions).toBeInstanceOf(Array);
      expect(result.suggested_actions.length).toBeGreaterThan(0);

      // Should contain morning-specific advice
      expect(result.answer.toLowerCase()).toMatch(/morning|routine|energy|hour/);
      expect(result.related_insights.some(insight => 
        insight.toLowerCase().includes('morning') || insight.toLowerCase().includes('9')
      )).toBe(true);
    });

    test('should process break/rest related question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'When should I take breaks for optimal productivity?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer.toLowerCase()).toMatch(/break|rest|90|minute|hour/);
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.suggested_actions.some(action => 
        action.toLowerCase().includes('break') || 
        action.toLowerCase().includes('session') || 
        action.toLowerCase().includes('patterns') ||
        action.toLowerCase().includes('minutes')
      )).toBe(true);
    });

    test('should process focus/distraction question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'How can I maintain focus during deep work?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer.toLowerCase()).toMatch(/focus|distraction|interruption|environment/);
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.suggested_actions.some(action => 
        action.toLowerCase().includes('focus') || 
        action.toLowerCase().includes('distraction') ||
        action.toLowerCase().includes('block')
      )).toBe(true);
    });

    test('should process prioritization question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'How do I prioritize tasks when everything seems urgent?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer.toLowerCase()).toMatch(/priority|urgent|important|eisenhower|matrix|productivity|sessions|performance|hours/);
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.suggested_actions.some(action => 
        action.toLowerCase().includes('priority') || 
        action.toLowerCase().includes('patterns') ||
        action.toLowerCase().includes('sessions') ||
        action.toLowerCase().includes('metrics') ||
        action.toLowerCase().includes('experiment')
      )).toBe(true);
    });

    test('should process general productivity question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'What are the best productivity strategies?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.related_insights.length).toBeGreaterThan(0);
      expect(result.suggested_actions.length).toBeGreaterThan(0);
    });

    test('should include tide context in response', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'How can I improve my workflow?',
        context: 'remote work'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.related_insights.some(insight => 
        insight.toLowerCase().includes('session') || 
        insight.toLowerCase().includes('tasks') ||
        insight.toLowerCase().includes('focus') ||
        insight.toLowerCase().includes('primary')
      )).toBe(true);
    });

    test('should handle missing tide data', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue(null);

      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'nonexistent-tide',
        question: 'How can I be more productive?'
      };

      await expect(questionsService.processQuestion(request, 'test-user'))
        .rejects.toThrow('No tide data found for user: test-user, tide: nonexistent-tide');
    });
  });

  describe('getFrequentQuestions', () => {
    test('should return list of frequent questions', async () => {
      const result = await questionsService.getFrequentQuestions();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(8);

      result.forEach(item => {
        expect(item.question).toBeDefined();
        expect(item.category).toBeDefined();
        expect(typeof item.question).toBe('string');
        expect(typeof item.category).toBe('string');
        expect(item.question.length).toBeGreaterThan(10);
      });

      // Verify expected categories
      const categories = result.map(item => item.category);
      expect(categories).toContain('time_management');
      expect(categories).toContain('focus');
      expect(categories).toContain('prioritization');
      expect(categories).toContain('energy_management');

      // Verify questions are meaningful
      const questions = result.map(item => item.question);
      expect(questions.some(q => q.includes('morning'))).toBe(true);
      expect(questions.some(q => q.includes('interruption'))).toBe(true);
      expect(questions.some(q => q.includes('prioritize'))).toBe(true);
    });
  });

  describe('generateFollowUpQuestions', () => {
    test('should generate relevant follow-up questions', async () => {
      const result = await questionsService.generateFollowUpQuestions(
        'How can I improve my morning productivity?',
        'daily-tide-default'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);

      result.forEach(question => {
        expect(typeof question).toBe('string');
        expect(question.length).toBeGreaterThan(15);
        expect(question.endsWith('?')).toBe(true);
      });

      // Should contain relevant follow-up patterns
      const combined = result.join(' ').toLowerCase();
      expect(combined).toMatch(/time|block|day|strategy|track|implement/);
    });

    test('should generate different follow-ups for different questions', async () => {
      const result1 = await questionsService.generateFollowUpQuestions(
        'How can I focus better?',
        'daily-tide-default'
      );

      const result2 = await questionsService.generateFollowUpQuestions(
        'How do I manage my time?',
        'daily-tide-default'
      );

      // While randomization could theoretically create identical results,
      // it's highly unlikely with different input questions
      expect(result1).not.toEqual(result2);
    });
  });

  describe('response generation', () => {
    test('should generate consistent response structure', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'Test question for structure validation'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      // Validate response structure
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('related_insights');
      expect(result).toHaveProperty('suggested_actions');

      expect(typeof result.answer).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.related_insights)).toBe(true);
      expect(Array.isArray(result.suggested_actions)).toBe(true);
    });

    test('should have reasonable confidence scores', async () => {
      const testQuestions = [
        'How can I improve my morning productivity?',
        'When should I take breaks?',
        'How do I focus better?',
        'What are the best productivity tips?'
      ];

      for (const question of testQuestions) {
        const request: QuestionsRequest = {
          api_key: 'test-api-key',
          tides_id: 'daily-tide-default',
          question
        };

        const result = await questionsService.processQuestion(request, 'test-user');
        
        expect(result.confidence).toBeGreaterThanOrEqual(80);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('error handling', () => {
    test('should handle R2 storage errors gracefully', async () => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockRejectedValue(new Error('R2 storage error'));

      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: 'How can I be more productive?'
      };

      // StorageService catches R2 errors and returns null,
      // so QuestionsService throws "No tide data found" error
      await expect(questionsService.processQuestion(request, 'test-user'))
        .rejects.toThrow('No tide data found for user: test-user, tide: daily-tide-default');
    });

    test('should handle empty questions', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'daily-tide-default',
        question: ''
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });
});