/**
 * Chat Service Unit Tests
 * TDD Approach - Starting with the simplest test
 */

import { ChatService } from '../../../src/services/chat.js';
import type { Env, ChatRequest, ChatResponse } from '../../../src/types.js';

describe('ChatService', () => {
  describe('Service Creation', () => {
    it('should exist as a class', () => {
      expect(ChatService).toBeDefined();
    });

    it('should create an instance with environment', () => {
      const mockEnv = {} as Env;
      const chatService = new ChatService(mockEnv);
      expect(chatService).toBeInstanceOf(ChatService);
    });

    it('should store the environment', () => {
      const mockEnv = { AI: 'mock-ai' } as any;
      const chatService = new ChatService(mockEnv);
      // This test will fail until we add a way to check the env is stored
      expect((chatService as any).env).toBe(mockEnv);
    });
  });

  describe('Intent Clarification', () => {
    let chatService: ChatService;
    let mockEnv: Env;

    beforeEach(() => {
      mockEnv = {} as Env;
      chatService = new ChatService(mockEnv);
    });

    it('should have a needsClarification method', () => {
      expect(chatService.needsClarification).toBeDefined();
      expect(typeof chatService.needsClarification).toBe('function');
    });

    it('should return true for low confidence requests', () => {
      const result = chatService.needsClarification(45);
      expect(result).toBe(true);
    });

    it('should return false for high confidence requests', () => {
      const result = chatService.needsClarification(85);
      expect(result).toBe(false);
    });

    it('should use 70% as the confidence threshold', () => {
      expect(chatService.needsClarification(69)).toBe(true);
      expect(chatService.needsClarification(70)).toBe(false);
      expect(chatService.needsClarification(71)).toBe(false);
    });
  });

  describe('clarifyIntent', () => {
    let chatService: ChatService;
    let mockEnv: Env;

    beforeEach(() => {
      mockEnv = {} as Env;
      chatService = new ChatService(mockEnv);
    });

    it('should have a clarifyIntent method', () => {
      expect(chatService.clarifyIntent).toBeDefined();
      expect(typeof chatService.clarifyIntent).toBe('function');
    });

    it('should return a response with clarification structure', async () => {
      const request = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'help me'
      };
      
      const result = await chatService.clarifyIntent(request, 'user123');
      
      expect(result).toHaveProperty('needs_clarification');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('suggestions');
      expect(result.needs_clarification).toBe(true);
    });

    it('should return an array of suggestions', async () => {
      const request = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'help me'
      };
      
      const result = await chatService.clarifyIntent(request, 'user123');
      
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeLessThanOrEqual(5); // Reasonable limit
      result.suggestions.forEach((suggestion: string) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should accept a properly typed ChatRequest', async () => {
      const request: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'help me with my productivity',
        conversation_id: 'conv_123'
      };
      
      const result: ChatResponse = await chatService.clarifyIntent(request, 'user123');
      
      expect(result).toBeDefined();
      expect(result.conversation_id).toBeDefined();
    });
  });

  describe('AI Integration', () => {
    let chatService: ChatService;
    let mockEnv: Env;

    beforeEach(() => {
      mockEnv = { AI: 'mock-ai-binding' } as any;
      chatService = new ChatService(mockEnv);
    });

    it('should have a clarifyIntentWithAI method', () => {
      expect(chatService.clarifyIntentWithAI).toBeDefined();
      expect(typeof chatService.clarifyIntentWithAI).toBe('function');
    });

    it('should return a valid response for AI clarification', async () => {
      const request: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'help me be more productive'
      };

      const result = await chatService.clarifyIntentWithAI(request, 'user123');

      expect(result).toBeDefined();
      expect(result.needs_clarification).toBe(true);
      expect(result.conversation_id).toBeDefined();
      expect(result.message).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should fallback gracefully if AI fails', async () => {
      // This tests the fallback behavior - the method should still work
      const request: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'complex request that might cause AI to fail'
      };

      const result = await chatService.clarifyIntentWithAI(request, 'user123');

      expect(result).toBeDefined();
      expect(result.needs_clarification).toBe(true);
    });

    it('should provide contextual suggestions based on question type', async () => {
      const productivityRequest: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'I want to be more productive'
      };

      const scheduleRequest: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'help me with my schedule'
      };

      const result1 = await chatService.clarifyIntentWithAI(productivityRequest, 'user123');
      const result2 = await chatService.clarifyIntentWithAI(scheduleRequest, 'user123');

      // Both should return valid responses
      expect(result1.suggestions).toBeDefined();
      expect(result2.suggestions).toBeDefined();
      expect(Array.isArray(result1.suggestions)).toBe(true);
      expect(Array.isArray(result2.suggestions)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    let chatService: ChatService;
    let mockEnv: Env;

    beforeEach(() => {
      mockEnv = {} as Env;
      chatService = new ChatService(mockEnv);
    });

    it('should handle empty question gracefully', async () => {
      const request: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: ''
      };

      const result = await chatService.clarifyIntent(request, 'user123');
      expect(result).toBeDefined();
      expect(result.needs_clarification).toBe(true);
    });

    it('should generate unique conversation IDs', async () => {
      const request: ChatRequest = {
        api_key: 'test_key',
        tides_id: 'tide123',
        question: 'help'
      };

      const result1 = await chatService.clarifyIntent(request, 'user123');
      const result2 = await chatService.clarifyIntent(request, 'user123');

      expect(result1.conversation_id).not.toBe(result2.conversation_id);
    });
  });

  describe('generateFollowUp', () => {
    let chatService: ChatService;
    let mockEnv: Env;

    beforeEach(() => {
      mockEnv = {} as Env;
      chatService = new ChatService(mockEnv);
    });

    it('should have a generateFollowUp method', () => {
      expect(chatService.generateFollowUp).toBeDefined();
      expect(typeof chatService.generateFollowUp).toBe('function');
    });

    it('should enhance insights service response with follow-ups', async () => {
      const insightsResponse = {
        productivity_score: 78,
        trends: {
          daily_average: 6.5,
          improvement_areas: ['morning_focus', 'task_completion']
        },
        recommendations: ['Use time blocking', 'Take breaks']
      };

      const enhanced = await chatService.generateFollowUp(
        insightsResponse,
        'insights',
        'user123'
      );

      expect(enhanced).toHaveProperty('follow_up');
      expect(enhanced.follow_up).toHaveProperty('insights');
      expect(enhanced.follow_up).toHaveProperty('questions');
      expect(enhanced.follow_up).toHaveProperty('recommendations');
      expect(Array.isArray(enhanced.follow_up.insights)).toBe(true);
      expect(Array.isArray(enhanced.follow_up.questions)).toBe(true);
      expect(Array.isArray(enhanced.follow_up.recommendations)).toBe(true);
    });

    it('should enhance optimize service response with follow-ups', async () => {
      const optimizeResponse = {
        suggested_schedule: {
          time_blocks: [
            { start: '09:00', end: '11:00', activity: 'deep_work', priority: 1 }
          ]
        },
        efficiency_gains: {
          estimated_time_saved: 45,
          focus_improvement: 23
        }
      };

      const enhanced = await chatService.generateFollowUp(
        optimizeResponse,
        'optimize',
        'user123'
      );

      expect(enhanced).toHaveProperty('follow_up');
      expect(enhanced.follow_up.questions.length).toBeGreaterThan(0);
    });

    it('should handle unknown service types gracefully', async () => {
      const unknownResponse = { some_data: 'value' };

      const enhanced = await chatService.generateFollowUp(
        unknownResponse,
        'unknown_service',
        'user123'
      );

      expect(enhanced).toHaveProperty('follow_up');
      expect(enhanced.follow_up.insights).toBeDefined();
    });
  });
});