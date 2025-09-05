/**
 * End-to-End Tests for Coordinator with real API keys
 * 
 * These tests require:
 * - Valid API key in TIDES_API_KEY environment variable
 * - Valid Tides ID in TIDES_ID environment variable
 * - Deployed coordinator at COORDINATOR_URL environment variable
 */

describe('Coordinator E2E Tests', () => {
  let apiKey: string;
  let tidesId: string;
  let coordinatorUrl: string;

  beforeAll(() => {
    apiKey = process.env.TIDES_API_KEY || '';
    tidesId = process.env.TIDES_ID || '';
    coordinatorUrl = process.env.COORDINATOR_URL || 'https://tides-101.mpazbot.workers.dev';

    if (!apiKey || !tidesId) {
      console.warn('E2E tests skipped: TIDES_API_KEY and TIDES_ID environment variables required');
    }
  });

  const skipIfNoCredentials = () => {
    if (!apiKey || !tidesId) {
      pending('E2E tests require TIDES_API_KEY and TIDES_ID environment variables');
    }
  };

  describe('Real API integration', () => {
    test('should authenticate with real API key', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'insights',
          timeframe: '7d'
        })
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    test('should fetch insights with real data', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'insights',
          timeframe: '30d'
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.productivity_score).toBeGreaterThanOrEqual(0);
      expect(body.data.productivity_score).toBeLessThanOrEqual(100);
      expect(body.data.trends).toBeDefined();
      expect(body.data.trends.daily_average).toBeGreaterThanOrEqual(0);
      expect(body.data.trends.weekly_pattern).toHaveLength(7);
      expect(body.data.recommendations).toBeInstanceOf(Array);
    });

    test('should optimize schedule with real preferences', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'optimize',
          preferences: {
            work_hours: { start: '09:00', end: '17:00' },
            break_duration: 15,
            focus_time_blocks: 90
          }
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.suggested_schedule).toBeDefined();
      expect(body.data.suggested_schedule.time_blocks).toBeInstanceOf(Array);
      expect(body.data.efficiency_gains).toBeDefined();
      expect(body.data.efficiency_gains.estimated_time_saved).toBeGreaterThan(0);
    });

    test('should answer productivity questions', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'questions',
          question: 'How can I improve my morning productivity?'
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.answer).toBeDefined();
      expect(typeof body.data.answer).toBe('string');
      expect(body.data.answer.length).toBeGreaterThan(50);
      expect(body.data.confidence).toBeGreaterThanOrEqual(80);
      expect(body.data.suggested_actions).toBeInstanceOf(Array);
      expect(body.data.suggested_actions.length).toBeGreaterThan(0);
    });

    test('should update preferences', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'preferences',
          preferences: {
            work_hours: { start: '08:30', end: '16:30' },
            break_duration: 20,
            notification_preferences: {
              insights: true,
              optimization: false,
              reminders: true
            }
          }
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.work_hours).toBeDefined();
      expect(body.data.work_hours.start).toBe('08:30');
      expect(body.data.work_hours.end).toBe('16:30');
      expect(body.data.break_duration).toBe(20);
      expect(body.data.notification_preferences).toBeDefined();
    });

    test('should generate productivity report', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'reports',
          report_type: 'summary',
          period: '30d'
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.report_type).toBe('summary');
      expect(body.data.period).toBe('30d');
      expect(body.data.summary).toBeDefined();
      expect(body.data.summary.total_productive_hours).toBeGreaterThan(0);
      expect(body.data.detailed_metrics).toBeDefined();
      expect(body.data.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Service inference with real API', () => {
    test('should infer insights from productivity question', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          question: 'How productive was I this week?'
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.productivity_score).toBeDefined();
      expect(body.data.trends).toBeDefined();
    });

    test('should infer optimize from schedule question', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          question: 'What is the best time for me to do focused work?'
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.suggested_schedule).toBeDefined();
      expect(body.data.efficiency_gains).toBeDefined();
    });

    test('should infer reports from export request', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          report_type: 'detailed',
          period: '90d'
        })
      });

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.report_type).toBe('detailed');
      expect(body.data.period).toBe('90d');
    });
  });

  describe('Error scenarios with real API', () => {
    test('should reject invalid API key', async () => {
      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: 'invalid-api-key',
          tides_id: tidesId || 'test-tide',
          service: 'insights'
        })
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid API key format');
    });

    test('should handle malformed requests', async () => {
      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid JSON');
    });

    test('should handle missing required fields', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey
          // Missing tides_id
        })
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('required');
    });

    test('should handle unsupported HTTP methods', async () => {
      const response = await fetch(coordinatorUrl, {
        method: 'DELETE'
      });

      expect(response.status).toBe(405);
    });
  });

  describe('Performance and reliability', () => {
    test('should respond within reasonable time', async () => {
      skipIfNoCredentials();

      const startTime = Date.now();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'insights'
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test('should handle concurrent requests', async () => {
      skipIfNoCredentials();

      const requests = Array.from({ length: 5 }, () =>
        fetch(coordinatorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key: apiKey,
            tides_id: tidesId,
            service: 'insights'
          })
        })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const bodies = await Promise.all(responses.map(r => r.json()));

      bodies.forEach(body => {
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
      });
    });

    test('should have consistent response format', async () => {
      skipIfNoCredentials();

      const services = ['insights', 'optimize', 'questions', 'preferences', 'reports'];

      for (const service of services) {
        const response = await fetch(coordinatorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key: apiKey,
            tides_id: tidesId,
            service: service
          })
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/json');

        const body = await response.json();

        // All responses should have consistent structure
        expect(body).toHaveProperty('success');
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('timestamp');
        expect(body.success).toBe(true);
        expect(typeof body.timestamp).toBe('string');
        expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
      }
    });
  });

  describe('Health and status endpoints', () => {
    test('should return health status', async () => {
      const response = await fetch(`${coordinatorUrl}/health`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
    });

    test('should return service status', async () => {
      const response = await fetch(`${coordinatorUrl}/status`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.environment).toBeDefined();
      expect(body.services).toBeDefined();
      expect(body.services.insights).toBe('available');
      expect(body.services.optimize).toBe('available');
      expect(body.services.questions).toBe('available');
      expect(body.services.preferences).toBe('available');
      expect(body.services.reports).toBe('available');
    });
  });
});