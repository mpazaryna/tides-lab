/**
 * Unit Tests for QuestionsService
 */

import { QuestionsService } from '../../../src/services/questions';
import type { Env, QuestionsRequest } from '../../../src/types';

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

    questionsService = new QuestionsService(mockEnv);
  });

  describe('processQuestion', () => {
    beforeEach(() => {
      const mockR2 = mockEnv.TIDES_R2 as any;
      mockR2.get.mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          id: 'test-tide-123',
          name: 'Test Productivity Tide',
          user_id: 'test-user',
          status: 'active'
        })
      });
    });

    test('should process morning productivity question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
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
        tides_id: 'test-tide-123',
        question: 'When should I take breaks for optimal productivity?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer.toLowerCase()).toMatch(/break|rest|90|minute|hour/);
      expect(result.confidence).toBeGreaterThanOrEqual(85);
      expect(result.suggested_actions.some(action => 
        action.toLowerCase().includes('break') || action.toLowerCase().includes('90')
      )).toBe(true);
    });

    test('should process focus/distraction question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        question: 'How can I maintain focus during deep work?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer.toLowerCase()).toMatch(/focus|distraction|interruption|environment/);
      expect(result.confidence).toBeGreaterThanOrEqual(85);
      expect(result.suggested_actions.some(action => 
        action.toLowerCase().includes('focus') || 
        action.toLowerCase().includes('distraction') ||
        action.toLowerCase().includes('block')
      )).toBe(true);
    });

    test('should process prioritization question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        question: 'How do I prioritize tasks when everything seems urgent?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.answer.toLowerCase()).toMatch(/priority|urgent|important|eisenhower|matrix/);
      expect(result.confidence).toBeGreaterThanOrEqual(88);
      expect(result.suggested_actions.some(action => 
        action.toLowerCase().includes('priority') || 
        action.toLowerCase().includes('abc') ||
        action.toLowerCase().includes('important')
      )).toBe(true);
    });

    test('should process general productivity question', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
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
        tides_id: 'test-tide-123',
        question: 'How can I improve my workflow?',
        context: 'remote work'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result.related_insights.some(insight => 
        insight.includes('Test Productivity Tide')
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

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.related_insights.some(insight => 
        insight.includes('Unknown')
      )).toBe(true);
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
        'test-tide-123'
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
        'test-tide-123'
      );

      const result2 = await questionsService.generateFollowUpQuestions(
        'How do I manage my time?',
        'test-tide-123'
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
        tides_id: 'test-tide-123',
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
          tides_id: 'test-tide-123',
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
        tides_id: 'test-tide-123',
        question: 'How can I be more productive?'
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    });

    test('should handle empty questions', async () => {
      const request: QuestionsRequest = {
        api_key: 'test-api-key',
        tides_id: 'test-tide-123',
        question: ''
      };

      const result = await questionsService.processQuestion(request, 'test-user');

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });
});