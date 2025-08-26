/**
 * @fileoverview E2E Tests for MCP Prompts
 * 
 * Tests the MCP prompts in real Cloudflare environments to ensure they work
 * correctly with actual data and provide meaningful AI analysis contexts.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-07
 */

const TEST_ENVIRONMENTS = [
  { name: 'tides-001', url: 'https://tides-001.mpazbot.workers.dev/mcp', apiKey: 'tides_testuser_001' },
  { name: 'tides-002', url: 'https://tides-002.mpazbot.workers.dev/mcp', apiKey: 'tides_testuser_002' },
  { name: 'tides-003', url: 'https://tides-003.mpazbot.workers.dev/mcp', apiKey: 'tides_testuser_003' }
];

describe('MCP Prompts E2E Tests', () => {
  const TIMEOUT = 30000;

  describe('Prompt Registration Validation', () => {
    TEST_ENVIRONMENTS.forEach(env => {
      test(`${env.name} should list analyze_tide prompt`, async () => {
        const response = await fetch(env.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${env.apiKey}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'prompts/list',
            id: 1
          })
        });

        expect(response.ok).toBe(true);
        const text = await response.text();
        
        // Parse SSE format - extract JSON from the data: line
        const lines = text.split('\n');
        const dataLine = lines.find(line => line.startsWith('data: '));
        expect(dataLine).toBeDefined();
        
        const jsonData = dataLine!.substring(6); // Remove "data: " prefix
        const data = JSON.parse(jsonData) as any;
        
        expect(data.result).toBeDefined();
        expect(data.result.prompts).toBeDefined();
        
        const analyzeTidePrompt = data.result.prompts.find((p: any) => p.name === 'analyze_tide');
        expect(analyzeTidePrompt).toBeDefined();
        expect(analyzeTidePrompt.title).toBe('Analyze Tide');
        expect(analyzeTidePrompt.description).toContain('Comprehensive analysis');
      }, TIMEOUT);
    });
  });

  describe('Analyze Tide Prompt Functionality', () => {
    beforeAll(async () => {
      // Create a test tide in tides-001 for testing
      const response = await fetch(TEST_ENVIRONMENTS[0].url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${TEST_ENVIRONMENTS[0].apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'tide_create',
            arguments: {
              name: 'E2E Test Tide - MCP Prompts',
              flow_type: 'project',
              description: 'Test tide for validating MCP prompts functionality'
            }
          },
          id: 1
        })
      });

      expect(response.ok).toBe(true);
      const text = await response.text();
      
      // Parse SSE format - extract JSON from the data: line  
      const lines = text.split('\n');
      const dataLine = lines.find(line => line.startsWith('data: '));
      expect(dataLine).toBeDefined();
      
      const jsonData = dataLine!.substring(6); // Remove "data: " prefix
      const data = JSON.parse(jsonData) as any;
      expect(data.result?.content?.[0]?.text).toBeDefined();
      
      const result = JSON.parse(data.result.content[0].text);
      expect(result.success).toBe(true);
      
      // Store the tide ID for use in tests
      (global as any).testTideId = result.tide_id;
    }, TIMEOUT);

    test('tides-001 should execute analyze_tide prompt successfully', async () => {
      const tideId = (global as any).testTideId;
      expect(tideId).toBeDefined();

      const response = await fetch(TEST_ENVIRONMENTS[0].url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${TEST_ENVIRONMENTS[0].apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'analyze_tide',
            arguments: {
              tide_id: tideId,
              analysis_depth: 'detailed',
              focus_areas: 'productivity,energy'
            }
          },
          id: 1
        })
      });

      expect(response.ok).toBe(true);
      const text = await response.text();
      
      // Parse SSE format - extract JSON from the data: line  
      const lines = text.split('\n');
      const dataLine = lines.find(line => line.startsWith('data: '));
      expect(dataLine).toBeDefined();
      
      const jsonData = dataLine!.substring(6); // Remove "data: " prefix
      const data = JSON.parse(jsonData) as any;
      
      expect(data.result).toBeDefined();
      expect(data.result.messages).toBeDefined();
      expect(data.result.messages.length).toBeGreaterThan(0);
      
      const message = data.result.messages[0];
      expect(message.role).toBe('user');
      expect(message.content.text).toContain('E2E Test Tide - MCP Prompts');
      expect(message.content.text).toContain('COMPREHENSIVE TIDE ANALYSIS REQUEST');
      expect(message.content.text).toContain('PRODUCTIVITY PATTERNS');
      expect(message.content.text).toContain('OPTIMIZATION OPPORTUNITIES');
      expect(message.content.text).toContain('Focus Areas: productivity,energy');
    }, TIMEOUT);

    test('tides-001 should handle missing tide gracefully', async () => {
      const response = await fetch(TEST_ENVIRONMENTS[0].url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${TEST_ENVIRONMENTS[0].apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'analyze_tide',
            arguments: {
              tide_id: 'nonexistent_tide_12345',
              analysis_depth: 'basic'
            }
          },
          id: 1
        })
      });

      expect(response.ok).toBe(true);
      const text = await response.text();
      
      // Parse SSE format - extract JSON from the data: line  
      const lines = text.split('\n');
      const dataLine = lines.find(line => line.startsWith('data: '));
      expect(dataLine).toBeDefined();
      
      const jsonData = dataLine!.substring(6); // Remove "data: " prefix
      const data = JSON.parse(jsonData) as any;
      
      expect(data.result).toBeDefined();
      expect(data.result.messages).toBeDefined();
      expect(data.result.messages.length).toBeGreaterThan(0);
      
      const message = data.result.messages[0];
      expect(message.content.text).toContain('not found');
      expect(message.content.text).toContain('nonexistent_tide_12345');
    }, TIMEOUT);

    test('tides-001 should handle different analysis depths', async () => {
      const tideId = (global as any).testTideId;
      expect(tideId).toBeDefined();

      const depths = ['basic', 'detailed', 'comprehensive'];
      
      for (const depth of depths) {
        const response = await fetch(`${TEST_ENVIRONMENTS[0].url}/prompts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'prompts/get',
            params: {
              name: 'analyze_tide',
              arguments: {
                tide_id: tideId,
                analysis_depth: depth
              }
            },
            id: 1
          })
        });

        expect(response.ok).toBe(true);
        const text = await response.text();
        
        // Parse SSE format - extract JSON from the data: line
        const lines = text.split('\n');
        const dataLine = lines.find(line => line.startsWith('data: '));
        expect(dataLine).toBeDefined();
        
        const jsonData = dataLine!.substring(6); // Remove "data: " prefix
        const data = JSON.parse(jsonData) as any;
        
        expect(data.result.messages[0].content.text).toContain(`Analysis Depth: ${depth}`);
        expect(data.result.messages[0].content.text).toContain(`Please provide a ${depth} analysis`);
      }
    }, TIMEOUT);
  });

  describe('Cross-Environment Consistency', () => {
    test('all environments should have analyze_tide prompt with same signature', async () => {
      const promptSignatures = [];

      for (const env of TEST_ENVIRONMENTS) {
        const response = await fetch(env.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${env.apiKey}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'prompts/list',
            id: 1
          })
        });

        expect(response.ok).toBe(true);
        const text = await response.text();
        
        // Parse SSE format - extract JSON from the data: line
        const lines = text.split('\n');
        const dataLine = lines.find(line => line.startsWith('data: '));
        expect(dataLine).toBeDefined();
        
        const jsonData = dataLine!.substring(6); // Remove "data: " prefix
        const data = JSON.parse(jsonData) as any;
        
        const analyzeTidePrompt = data.result.prompts.find((p: any) => p.name === 'analyze_tide');
        expect(analyzeTidePrompt).toBeDefined();
        
        promptSignatures.push({
          env: env.name,
          title: analyzeTidePrompt.title,
          description: analyzeTidePrompt.description,
          // Note: argsSchema might not be directly exposed via MCP
        });
      }

      // Verify all environments have consistent prompt signatures
      const firstSignature = promptSignatures[0];
      promptSignatures.forEach(signature => {
        expect(signature.title).toBe(firstSignature.title);
        expect(signature.description).toBe(firstSignature.description);
      });
    }, TIMEOUT * 3);
  });

  afterAll(async () => {
    // Cleanup: Remove test tide if it was created
    if ((global as any).testTideId) {
      // Note: There's no delete tide tool currently, so we'll leave it for now
      // This is acceptable for E2E tests as test data can accumulate
      console.log(`Test tide created: ${(global as any).testTideId}`);
    }
  });
});