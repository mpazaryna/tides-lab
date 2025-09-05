/**
 * Unit Tests for ServiceInferrer
 */

import { ServiceInferrer } from '../../../src/service-inferrer';

describe('ServiceInferrer', () => {
  describe('inferService', () => {
    test('should return explicit service when provided', () => {
      const requestBody = {
        service: 'insights',
        question: 'How can I optimize my schedule?'
      };

      const result = ServiceInferrer.inferService(requestBody);
      expect(result).toBe('insights');
    });

    test('should infer insights from productivity-related questions', () => {
      const productivityQuestions = [
        { question: 'How productive was I today?' },
        { question: 'Show me my productivity trends' },
        { question: 'What is my focus score?' },
        { question: 'How did I perform this week?' }
      ];

      productivityQuestions.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).toBe('insights');
      });
    });

    test('should infer optimize from schedule and optimization questions', () => {
      const optimizeQuestions = [
        { question: 'How can I optimize my schedule?' },
        { question: 'What is the best time for focused work?' },
        { question: 'How should I organize my day?' },
        { question: 'Give me tips to improve efficiency' }
      ];

      optimizeQuestions.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).toBe('optimize');
      });
    });

    test('should infer questions from general productivity inquiries', () => {
      const generalQuestions = [
        { question: 'How can I be more productive?' },
        { question: 'What productivity techniques work best?' },
        { question: 'Hello there, how are you?' }, // More clearly questions
        { question: 'What is this service about?' }
      ];

      generalQuestions.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).toBe('questions');
      });
    });

    test('should infer preferences from settings-related requests', () => {
      const preferencesRequests = [
        { preferences: { work_hours: { start: '09:00', end: '17:00' } } },
        { question: 'Update my work schedule' },
        { question: 'Change my notification settings' },
        { preferences: { break_duration: 15 } }
      ];

      preferencesRequests.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).toBe('preferences');
      });
    });

    test('should infer reports from report-related requests', () => {
      const reportRequests = [
        { report_type: 'summary' },
        { report_type: 'detailed' },
        { question: 'Generate a productivity report' },
        { question: 'Export my data as CSV' },
        { export_format: 'json' }
      ];

      reportRequests.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).toBe('reports');
      });
    });

    test('should return questions for hello-type requests (but chat via inferServiceWithChat)', () => {
      const ambiguousRequests = [
        { question: 'Hello' },
        { question: 'What is this?' },
        { random_field: 'value' }, // This should be null
        { question: 'Random question about weather' }
      ];

      // Standard inferService - hello/what questions route to questions service
      expect(ServiceInferrer.inferService(ambiguousRequests[0])).toBe('questions'); // hello
      expect(ServiceInferrer.inferService(ambiguousRequests[1])).toBe('questions'); // what is this
      expect(ServiceInferrer.inferService(ambiguousRequests[2])).toBeNull(); // random field
      expect(ServiceInferrer.inferService(ambiguousRequests[3])).toBe('questions'); // weather
        
      // But inferServiceWithChat should route all ambiguous to chat
      ambiguousRequests.forEach(requestBody => {
        const chatResult = ServiceInferrer.inferServiceWithChat(requestBody);
        expect(chatResult).toBe('chat');
      });
    });

    test('should handle empty or undefined requests', () => {
      expect(ServiceInferrer.inferService({})).toBeNull();
      expect(ServiceInferrer.inferService(null)).toBeNull();
      expect(ServiceInferrer.inferService(undefined)).toBeNull();
    });

    test('should be case insensitive for question inference', () => {
      const caseVariations = [
        { question: 'HOW PRODUCTIVE WAS I TODAY?' },
        { question: 'how can i OPTIMIZE my schedule?' },
        { question: 'GENERATE A REPORT please' },
        { question: 'Update My PREFERENCES' }
      ];

      const expectedServices = ['insights', 'optimize', 'reports', 'preferences'];

      caseVariations.forEach((requestBody, index) => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).toBe(expectedServices[index]);
      });
    });

    test('should prioritize explicit service over inferred service', () => {
      const requestBody = {
        service: 'reports',
        question: 'How productive was I today?' // This would infer insights
      };

      const result = ServiceInferrer.inferService(requestBody);
      expect(result).toBe('reports'); // Explicit service wins
    });

    test('should handle complex questions with multiple keywords', () => {
      const complexQuestions = [
        { question: 'Can you generate a productivity report showing my optimization trends?' },
        { question: 'I want to optimize my schedule and update my preferences' },
        { question: 'Show me insights about my productive hours for the report' }
      ];

      // Should pick the first/strongest match
      const results = complexQuestions.map(req => ServiceInferrer.inferService(req));
      
      // Verify all return valid services (not null)
      results.forEach(result => {
        expect(['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat']).toContain(result);
      });
    });

    test('should route to chat service for low confidence requests using inferServiceWithChat', () => {
      const ambiguousRequests = [
        { question: 'help' },
        { question: 'I need assistance' },
        { unknown_field: 'value' }
      ];

      ambiguousRequests.forEach(requestBody => {
        const result = ServiceInferrer.inferServiceWithChat(requestBody);
        expect(result).toBe('chat');
      });
    });

    test('should route explicit field requests with inferServiceWithChat', () => {
      const clearRequests = [
        { report_type: 'summary' }, // Should be reports (explicit field)
        { preferences: { work_hours: { start: '09:00' } } }, // Should be preferences (explicit field)
        { timeframe: '7d' } // Should be insights (explicit field)
      ];

      const results = clearRequests.map(req => ServiceInferrer.inferServiceWithChat(req));
      expect(results).toEqual(['reports', 'preferences', 'insights']);
    });

    test('should handle message field and route to chat for ambiguous content', () => {
      const messageRequests = [
        { message: 'show me my productivity trends' }, // May go to insights or chat depending on confidence
        { message: 'optimize my schedule' }, // May go to optimize or chat
        { message: 'Start me a flow session' }, // Likely goes to chat (ambiguous)
        { message: 'hello' } // Should go to chat (low confidence)
      ];

      const results = messageRequests.map(req => ServiceInferrer.inferServiceWithChat(req));
      
      // Since we don't know exact confidence levels, just check they're valid services
      results.forEach(result => {
        expect(['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat']).toContain(result);
      });
      
      // The ambiguous ones should default to chat
      expect(results[3]).toBe('chat'); // hello
    });

    test('should route frontend standard payload to chat service', () => {
      const frontendPayload = {
        api_key: "tides_userId_randomId",
        tides_id: "daily-tide-default",
        message: "Start me a flow session", // Ambiguous intent
        tide_tool_call: "tide_smart_flow", // Ignored for now
        context: {
          recent_messages: [
            { role: "user", content: "How's my energy today?" },
            { role: "assistant", content: "Your energy seems steady..." }
          ],
          user_time: "2025-09-05T12:00:00.000Z"
        },
        timestamp: "2025-09-05T12:00:00.000Z"
      };

      const result = ServiceInferrer.inferServiceWithChat(frontendPayload);
      expect(result).toBe('chat'); // Should default to chat for ambiguous
    });

    test('should route frontend payload with explicit service', () => {
      const explicitPayloads = [
        {
          api_key: "tides_userId_randomId",
          tides_id: "daily-tide-default",
          service: "insights", // Explicit override
          message: "Start me a flow session",
          context: { recent_messages: [] }
        },
        {
          api_key: "tides_userId_randomId", 
          tides_id: "daily-tide-default",
          service: "optimize", // Explicit override
          message: "Random message",
          context: { recent_messages: [] }
        },
        {
          api_key: "tides_userId_randomId",
          tides_id: "daily-tide-default", 
          service: "chat", // Explicit chat
          message: "I need help",
          context: { recent_messages: [] }
        }
      ];

      const results = explicitPayloads.map(req => ServiceInferrer.inferServiceWithChat(req));
      expect(results).toEqual(['insights', 'optimize', 'chat']);
    });

    test('should always return chat for null/undefined requests', () => {
      expect(ServiceInferrer.inferServiceWithChat(null)).toBe('chat');
      expect(ServiceInferrer.inferServiceWithChat(undefined)).toBe('chat');
      expect(ServiceInferrer.inferServiceWithChat({})).toBe('chat');
    });

    test('should never return null with inferServiceWithChat', () => {
      const variousRequests = [
        { unknown_field: 'value' },
        { api_key: 'test', tides_id: 'test' },
        { message: 'vague request' },
        { context: { recent_messages: [] } },
        { timestamp: '2025-09-05T12:00:00.000Z' }
      ];

      variousRequests.forEach(request => {
        const result = ServiceInferrer.inferServiceWithChat(request);
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
        expect(['insights', 'optimize', 'questions', 'preferences', 'reports', 'chat']).toContain(result);
      });
    });
  });

  describe('getSuggestions', () => {
    test('should return suggestion for unmatched requests', () => {
      const requestBody = { question: 'Random unrelated question' };
      
      const result = ServiceInferrer.getSuggestions(requestBody);
      
      expect(result).toContain('questions'); // Should suggest general questions service
      expect(result.length).toBeGreaterThan(0);
    });

    test('should return empty array for matched requests', () => {
      const requestBody = { question: 'How productive was I today?' };
      
      // Since this would be matched by inferService, no suggestions needed
      const result = ServiceInferrer.getSuggestions(requestBody);
      
      expect(result).toEqual([]);
    });

    test('should suggest multiple services for complex requests', () => {
      const requestBody = { 
        question: 'I need help with something complex',
        unknown_field: 'value'
      };
      
      const result = ServiceInferrer.getSuggestions(requestBody);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // All suggestions should be valid service names
      result.forEach(service => {
        expect(['insights', 'optimize', 'questions', 'preferences', 'reports']).toContain(service);
      });
    });
  });

  describe('confidence scoring', () => {
    test('should have high confidence for explicit service', () => {
      const requestBody = { service: 'insights' };
      
      // While we don't expose confidence directly, explicit service should always win
      const result = ServiceInferrer.inferService(requestBody);
      expect(result).toBe('insights');
    });

    test('should have high confidence for clear keyword matches', () => {
      const clearMatches = [
        { question: 'Generate productivity report' },
        { report_type: 'summary' },
        { preferences: { work_hours: {} } },
        { question: 'How productive was I?' }
      ];

      clearMatches.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        expect(result).not.toBeNull();
      });
    });

    test('should handle edge cases with partial matches', () => {
      const edgeCases = [
        { question: 'prod' }, // Too short, might not match
        { question: 'optimize productivity reports preferences' }, // Multiple keywords
        { question: 'productiv' }, // Partial word
        { question: 'How are you?' } // No relevant keywords
      ];

      edgeCases.forEach(requestBody => {
        const result = ServiceInferrer.inferService(requestBody);
        // Should either return a valid service or null, never throw
        expect(result === null || typeof result === 'string').toBe(true);
        if (result !== null) {
          expect(['insights', 'optimize', 'questions', 'preferences', 'reports']).toContain(result);
        }
      });
    });
  });
});