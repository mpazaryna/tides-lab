/**
 * @fileoverview AI Integration Tests
 * 
 * Tests for Workers AI integration with MCP tools to ensure
 * AI-powered features work correctly within the Cloudflare ecosystem.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-16
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createAIService } from '../../src/services/aiService';

// Mock Cloudflare Workers AI environment
const mockEnv = {
  AI: {
    run: jest.fn()
  }
};

// Mock session data for testing
const mockSessions = [
  {
    duration: 25,
    energy_level: 8,
    completed_at: '2025-08-16T09:00:00Z',
    productivity_score: 9
  },
  {
    duration: 30,
    energy_level: 6,
    completed_at: '2025-08-16T14:00:00Z',
    productivity_score: 7
  },
  {
    duration: 20,
    energy_level: 5,
    completed_at: '2025-08-16T16:30:00Z',
    productivity_score: 6
  }
];

describe('AI Service Integration', () => {
  let aiService: any;

  beforeEach(() => {
    aiService = createAIService(mockEnv);
    jest.clearAllMocks();
  });

  describe('Productivity Analysis', () => {
    it('should analyze productivity with quick depth using Mistral', async () => {
      // Mock Workers AI response
      (mockEnv.AI.run as jest.Mock).mockResolvedValue({
        response: 'Sessions show consistent morning productivity with energy decline throughout day. Recommend scheduling demanding tasks in morning hours and taking breaks after lunch.'
      });

      const result = await aiService.analyzeProductivity({
        sessions: mockSessions,
        analysis_depth: 'quick'
      });

      expect(result).toMatchObject({
        analysis: expect.stringContaining('Sessions show consistent'),
        source: 'workers-ai',
        insights: expect.objectContaining({
          patterns: expect.arrayContaining([expect.any(String)]),
          recommendations: expect.arrayContaining([expect.any(String)]),
          energy_trends: expect.any(String)
        })
      });

      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/mistral/mistral-7b-instruct-v0.1',
        expect.objectContaining({
          max_tokens: 150
        })
      );
    });

    it('should analyze productivity with detailed depth using Llama', async () => {
      (mockEnv.AI.run as jest.Mock).mockResolvedValue({
        response: 'Detailed analysis shows peak performance in morning hours with average 25-minute sessions. Energy patterns indicate optimal work periods between 9-11 AM. Recommend consistent break intervals and energy monitoring.'
      });

      const result = await aiService.analyzeProductivity({
        sessions: mockSessions,
        analysis_depth: 'detailed'
      });

      expect(result.analysis).toContain('Detailed analysis');
      expect(result.source).toBe('workers-ai');

      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        '@cf/meta/llama-3.1-8b-instruct',
        expect.objectContaining({
          max_tokens: 400
        })
      );
    });

    it('should handle AI service failure gracefully', async () => {
      (mockEnv.AI.run as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      const result = await aiService.analyzeProductivity({
        sessions: mockSessions,
        analysis_depth: 'quick'
      });

      expect(result.analysis).toContain('Basic analysis');
      expect(result.source).toBe('workers-ai');
      expect(result.insights).toBeDefined();
    });
  });

  describe('Flow Suggestions', () => {
    it('should generate flow suggestions using embeddings and AI', async () => {
      // Mock embedding response
      (mockEnv.AI.run as jest.Mock)
        .mockResolvedValueOnce({
          data: [[0.1, 0.2, 0.3]] // Mock embedding
        })
        .mockResolvedValueOnce({
          response: 'Based on current energy level 7/10, recommend 25-minute focused session at 10:00 AM or 2:00 PM. Optimal for creative tasks.'
        });

      const result = await aiService.generateFlowSuggestions({
        user_context: {
          energy_level: 7,
          recent_sessions: mockSessions,
          preferences: { work_style: 'focused', preferred_duration: 25 }
        }
      });

      expect(result).toMatchObject({
        suggestions: expect.stringContaining('recommend'),
        optimal_times: expect.arrayContaining([expect.any(String)]),
        confidence_score: expect.any(Number)
      });

      expect(mockEnv.AI.run).toHaveBeenCalledTimes(2);
      expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/baai/bge-small-en-v1.5', expect.any(Object));
      expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/mistral/mistral-7b-instruct-v0.1', expect.any(Object));
    });
  });

  describe('Energy Prediction', () => {
    it('should predict energy levels using ML patterns', async () => {
      const historicalData = [
        { timestamp: '2025-08-16T09:00:00Z', energy: 8, activity: 'coding' },
        { timestamp: '2025-08-16T11:00:00Z', energy: 7, activity: 'meetings' },
        { timestamp: '2025-08-16T14:00:00Z', energy: 5, activity: 'admin' }
      ];

      (mockEnv.AI.run as jest.Mock)
        .mockResolvedValueOnce({
          data: [[0.5, 0.3, 0.2]] // Mock embedding
        })
        .mockResolvedValueOnce({
          response: 'Based on patterns, predicted energy level: 7'
        });

      const result = await aiService.predictEnergyLevel({
        historical_data: historicalData,
        future_timestamp: '2025-08-17T10:00:00Z'
      });

      expect(result).toMatchObject({
        predicted_energy: expect.any(Number),
        confidence: expect.any(Number),
        based_on_patterns: expect.any(Number),
        next_optimal_time: expect.any(String)
      });

      expect(result.predicted_energy).toBeGreaterThanOrEqual(1);
      expect(result.predicted_energy).toBeLessThanOrEqual(10);
    });
  });

  describe('Fallback Behavior', () => {
    it('should work without AI binding', async () => {
      const aiServiceNoBinding = createAIService({ AI: null });

      const result = await aiServiceNoBinding.analyzeProductivity({
        sessions: mockSessions,
        analysis_depth: 'quick'
      });

      expect(result.analysis).toContain('Basic analysis');
      expect(result.source).toBe('workers-ai');
    });

    it('should provide fallback suggestions when AI fails', async () => {
      const aiServiceNoBinding = createAIService({ AI: null });

      const result = await aiServiceNoBinding.generateFlowSuggestions({
        user_context: {
          energy_level: 8,
          recent_sessions: mockSessions,
          preferences: {}
        }
      });

      expect(result.suggestions).toContain('High energy detected');
      expect(result.confidence_score).toBeLessThan(0.5);
    });
  });

  describe('Caching', () => {
    it('should cache AI responses to avoid duplicate calls', async () => {
      (mockEnv.AI.run as jest.Mock).mockResolvedValue({
        response: 'Cached analysis result'
      });

      // First call
      const result1 = await aiService.analyzeProductivity({
        sessions: mockSessions,
        analysis_depth: 'quick'
      });

      // Second call with same input
      const result2 = await aiService.analyzeProductivity({
        sessions: mockSessions,
        analysis_depth: 'quick'
      });

      expect(result1).toEqual(result2);
      expect(mockEnv.AI.run).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });
});

describe('Error Handling', () => {
  it('should handle malformed AI responses', async () => {
    const aiService = createAIService(mockEnv);
    
    (mockEnv.AI.run as jest.Mock).mockResolvedValue({
      response: null // Malformed response
    });

    const result = await aiService.analyzeProductivity({
      sessions: mockSessions,
      analysis_depth: 'quick'
    });

    expect(result.analysis).toBeDefined();
    expect(result.source).toBe('workers-ai');
  });

  it('should handle network timeouts gracefully', async () => {
    const aiService = createAIService(mockEnv);
    
    (mockEnv.AI.run as jest.Mock).mockRejectedValue(new Error('Request timeout'));

    const result = await aiService.analyzeProductivity({
      sessions: mockSessions,
      analysis_depth: 'detailed'
    });

    expect(result.analysis).toContain('Basic analysis');
    expect(result.insights).toBeDefined();
  });
});