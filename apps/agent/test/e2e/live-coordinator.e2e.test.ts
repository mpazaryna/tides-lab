/**
 * Live Coordinator E2E Tests
 * 
 * Tests the deployed coordinator against real API expectations
 * Validates mock responses match production behavior
 * 
 * Required Environment Variables:
 * - TIDES_API_KEY: Valid API key (format: tides_userid_randomid)
 * - TIDES_ID: Valid tides ID  
 * - COORDINATOR_URL: Deployed coordinator URL (default: https://tides-101.mpazbot.workers.dev)
 */

describe('Live Coordinator E2E Tests', () => {
  let apiKey: string;
  let tidesId: string;
  let coordinatorUrl: string;

  beforeAll(() => {
    apiKey = process.env.TIDES_API_KEY || '';
    tidesId = process.env.TIDES_ID || '';
    coordinatorUrl = process.env.COORDINATOR_URL || 'https://tides-101.mpazbot.workers.dev';

    if (!apiKey || !tidesId) {
      console.warn('⚠️  Live E2E tests require TIDES_API_KEY and TIDES_ID environment variables');
      console.warn('   Set them like: export TIDES_API_KEY="tides_testuser_123456789"');
      console.warn('   Set them like: export TIDES_ID="test-tide-123"');
    }
  });

  const skipIfNoCredentials = () => {
    if (!apiKey || !tidesId) {
      pending('Live E2E tests require TIDES_API_KEY and TIDES_ID environment variables');
    }
  };

  describe('Service Response Validation', () => {
    test('insights service should return expected structure', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'insights',
          timeframe: '30d'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      // Validate response structure matches our mock
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('metadata');
      expect(body.metadata).toHaveProperty('timestamp');
      
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('productivity_score');
      expect(body.data).toHaveProperty('trends');
      expect(body.data).toHaveProperty('recommendations');
      
      expect(typeof body.data.productivity_score).toBe('number');
      expect(body.data.productivity_score).toBeGreaterThanOrEqual(0);
      expect(body.data.productivity_score).toBeLessThanOrEqual(100);
      
      expect(body.data.trends).toHaveProperty('daily_average');
      expect(body.data.trends).toHaveProperty('weekly_pattern');
      expect(Array.isArray(body.data.trends.weekly_pattern)).toBe(true);
      expect(body.data.trends.weekly_pattern).toHaveLength(7);
      
      expect(Array.isArray(body.data.recommendations)).toBe(true);
      expect(body.data.recommendations.length).toBeGreaterThan(0);

      console.log('✅ Insights response structure validated');
    });

    test('optimize service should return expected structure', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'optimize',
          preferences: {
            work_hours: { start: '09:00', end: '17:00' },
            break_duration: 15
          }
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('suggested_schedule');
      expect(body.data).toHaveProperty('efficiency_gains');
      
      expect(body.data.suggested_schedule).toHaveProperty('time_blocks');
      expect(Array.isArray(body.data.suggested_schedule.time_blocks)).toBe(true);
      expect(body.data.suggested_schedule.time_blocks.length).toBeGreaterThan(0);
      
      // Validate time block structure
      const firstBlock = body.data.suggested_schedule.time_blocks[0];
      expect(firstBlock).toHaveProperty('start');
      expect(firstBlock).toHaveProperty('end');
      expect(firstBlock).toHaveProperty('activity');
      expect(firstBlock).toHaveProperty('priority');
      
      expect(firstBlock.start).toMatch(/^\d{2}:\d{2}$/);
      expect(firstBlock.end).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof firstBlock.activity).toBe('string');
      expect(typeof firstBlock.priority).toBe('number');
      
      expect(body.data.efficiency_gains).toHaveProperty('estimated_time_saved');
      expect(body.data.efficiency_gains).toHaveProperty('focus_improvement');

      console.log('✅ Optimize response structure validated');
    });

    test('questions service should return expected structure', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'questions',
          question: 'How can I improve my morning productivity?'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('answer');
      expect(body.data).toHaveProperty('confidence');
      expect(body.data).toHaveProperty('related_insights');
      expect(body.data).toHaveProperty('suggested_actions');
      
      expect(typeof body.data.answer).toBe('string');
      expect(body.data.answer.length).toBeGreaterThan(50);
      
      expect(typeof body.data.confidence).toBe('number');
      expect(body.data.confidence).toBeGreaterThanOrEqual(80);
      expect(body.data.confidence).toBeLessThanOrEqual(100);
      
      expect(Array.isArray(body.data.related_insights)).toBe(true);
      expect(Array.isArray(body.data.suggested_actions)).toBe(true);
      expect(body.data.suggested_actions.length).toBeGreaterThan(0);

      console.log('✅ Questions response structure validated');
    });

    test('preferences service should return expected structure', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'preferences',
          preferences: {
            work_hours: { start: '08:30', end: '16:30' },
            break_duration: 20
          }
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('work_hours');
      expect(body.data).toHaveProperty('break_duration');
      expect(body.data).toHaveProperty('focus_time_blocks');
      expect(body.data).toHaveProperty('notification_preferences');
      
      expect(body.data.work_hours).toHaveProperty('start');
      expect(body.data.work_hours).toHaveProperty('end');
      expect(body.data.work_hours.start).toMatch(/^\d{2}:\d{2}$/);
      expect(body.data.work_hours.end).toMatch(/^\d{2}:\d{2}$/);
      
      expect(typeof body.data.break_duration).toBe('number');
      expect(body.data.break_duration).toBeGreaterThanOrEqual(5);
      expect(body.data.break_duration).toBeLessThanOrEqual(60);
      
      expect(typeof body.data.focus_time_blocks).toBe('number');
      
      expect(body.data.notification_preferences).toHaveProperty('insights');
      expect(body.data.notification_preferences).toHaveProperty('optimization');
      expect(body.data.notification_preferences).toHaveProperty('reminders');

      console.log('✅ Preferences response structure validated');
    });

    test('reports service should return expected structure', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          service: 'reports',
          report_type: 'summary',
          period: '30d'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('report_type');
      expect(body.data).toHaveProperty('period');
      expect(body.data).toHaveProperty('summary');
      expect(body.data).toHaveProperty('detailed_metrics');
      expect(body.data).toHaveProperty('recommendations');
      
      expect(body.data.report_type).toBe('summary');
      expect(body.data.period).toBe('30d');
      
      expect(body.data.summary).toHaveProperty('total_productive_hours');
      expect(body.data.summary).toHaveProperty('average_daily_score');
      expect(body.data.summary).toHaveProperty('completed_tasks');
      expect(body.data.summary).toHaveProperty('focus_sessions');
      
      expect(typeof body.data.summary.total_productive_hours).toBe('number');
      expect(body.data.summary.total_productive_hours).toBeGreaterThan(0);
      
      expect(body.data.detailed_metrics).toHaveProperty('productivity_trends');
      expect(body.data.detailed_metrics).toHaveProperty('time_distribution');
      expect(body.data.detailed_metrics).toHaveProperty('energy_patterns');
      
      expect(Array.isArray(body.data.recommendations)).toBe(true);

      console.log('✅ Reports response structure validated');
    });
  });

  describe('Service Inference Testing', () => {
    test('should infer insights from productivity questions', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          question: 'How productive was I this week?'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      // Should route to insights service
      expect(body.data).toHaveProperty('productivity_score');
      expect(body.data).toHaveProperty('trends');

      console.log('✅ Service inference for insights validated');
    });

    test('should infer optimize from schedule questions', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          question: 'What is the best time for me to do focused work?'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      // Should route to optimize service
      expect(body.data).toHaveProperty('suggested_schedule');
      expect(body.data).toHaveProperty('efficiency_gains');

      console.log('✅ Service inference for optimize validated');
    });

    test('should infer reports from report requests', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          tides_id: tidesId,
          report_type: 'detailed'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      // Should route to reports service
      expect(body.data).toHaveProperty('report_type');
      expect(body.data).toHaveProperty('summary');
      expect(body.data.report_type).toBe('detailed');

      console.log('✅ Service inference for reports validated');
    });
  });

  describe('Error Handling Validation', () => {
    test('should accept any API key with mock authentication', async () => {
      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'any-invalid-key',
          tides_id: tidesId || 'test-tide',
          service: 'insights'
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('productivity_score');

      console.log('✅ Mock authentication accepts any API key');
    });

    test('should handle missing required fields', async () => {
      skipIfNoCredentials();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey
          // Missing tides_id
        })
      });

      expect(response.status).toBe(400);
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('Could not determine service');

      console.log('✅ Missing fields error handling validated');
    });

    test('should handle malformed JSON', async () => {
      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('Invalid JSON');

      console.log('✅ Malformed JSON error handling validated');
    });
  });

  describe('Performance and Reliability', () => {
    test('should respond within acceptable time limits', async () => {
      skipIfNoCredentials();

      const startTime = Date.now();

      const response = await fetch(coordinatorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      console.log(`✅ Response time: ${responseTime}ms (within acceptable limits)`);
    });

    test('should handle concurrent requests reliably', async () => {
      skipIfNoCredentials();

      const concurrentRequests = Array.from({ length: 3 }, () =>
        fetch(coordinatorUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            tides_id: tidesId,
            service: 'insights'
          })
        })
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const bodies = await Promise.all(responses.map(r => r.json()));

      bodies.forEach(body => {
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('productivity_score');
      });

      console.log('✅ Concurrent request handling validated');
    });
  });
});