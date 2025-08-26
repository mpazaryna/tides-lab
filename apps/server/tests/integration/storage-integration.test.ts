/**
 * Storage Integration Tests
 * 
 * These tests verify that create/list operations work correctly across all environments.
 * This is a critical workflow that must work for the application to function.
 */

import { describe, it, expect } from '@jest/globals';

// Test environments
const ENVIRONMENTS = [
  {
    name: 'tides-001 (Development)',
    url: 'https://tides-001.mpazbot.workers.dev/mcp',
    apiKey: 'tides_testuser_001'
  },
  {
    name: 'tides-002 (Staging)', 
    url: 'https://tides-002.mpazbot.workers.dev/mcp',
    apiKey: 'tides_testuser_002'
  },
  {
    name: 'tides-003 (Production)',
    url: 'https://tides-003.mpazbot.workers.dev/mcp',
    apiKey: 'tides_testuser_003'
  }
];

// Helper function to make MCP requests
async function makeMCPRequest(url: string, apiKey: string, method: string, params?: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000000),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  const dataLines = text.split('\n').filter(line => line.startsWith('data: '));
  if (dataLines.length === 0) {
    throw new Error('No data received from MCP server');
  }
  
  const jsonData = dataLines[0].replace('data: ', '');
  return JSON.parse(jsonData);
}

// Helper function to extract tide data from MCP response
function extractTideData(mcpResponse: any) {
  if (mcpResponse.error) {
    throw new Error(`MCP Error: ${mcpResponse.error.message}`);
  }
  
  if (!mcpResponse.result?.content?.[0]?.text) {
    throw new Error('Invalid MCP response format');
  }
  
  return JSON.parse(mcpResponse.result.content[0].text);
}

describe('Critical Storage Integration Tests', () => {
  const testTimeout = 30000;

  ENVIRONMENTS.forEach(env => {
    describe(`${env.name} Storage Integration`, () => {
      it('should successfully create and immediately list the same tide', async () => {
        const uniqueName = `Integration Test ${Date.now()}`;
        
        // Step 1: Create a unique tide
        console.log(`🔄 Creating tide in ${env.name}...`);
        const createResponse = await makeMCPRequest(env.url, env.apiKey, 'tools/call', {
          name: 'tide_create',
          arguments: {
            name: uniqueName,
            flow_type: 'daily',
            description: `Storage integration test for ${env.name}`
          }
        });
        
        const createData = extractTideData(createResponse);
        expect(createData.success).toBe(true);
        expect(createData.tide_id).toBeDefined();
        expect(createData.name).toBe(uniqueName);
        
        console.log(`✅ Created tide: ${createData.tide_id}`);
        
        // Step 2: Immediately list tides (no delay)
        console.log(`🔄 Listing tides in ${env.name}...`);
        const listResponse = await makeMCPRequest(env.url, env.apiKey, 'tools/call', {
          name: 'tide_list',
          arguments: {
            flow_type: 'daily'
          }
        });
        
        const listData = extractTideData(listResponse);
        expect(listData.success).toBe(true);
        expect(listData.tides).toBeInstanceOf(Array);
        
        console.log(`📋 Found ${listData.tides.length} tides in list`);
        
        // Step 3: Verify the created tide appears in the list
        const foundTide = listData.tides.find((tide: any) => tide.id === createData.tide_id);
        
        if (!foundTide) {
          console.error(`❌ CRITICAL: Tide ${createData.tide_id} not found in list!`);
          console.error(`📋 Available tides:`, listData.tides.map((t:any) => `${t.id}: ${t.name}`));
          
          // Try listing again after a delay to see if it's a consistency issue
          console.log(`🔄 Retrying list after 5 second delay...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const retryResponse = await makeMCPRequest(env.url, env.apiKey, 'tools/call', {
            name: 'tide_list',
            arguments: { flow_type: 'daily' }
          });
          const retryData = extractTideData(retryResponse);
          const retryFound = retryData.tides.find((tide: any) => tide.id === createData.tide_id);
          
          if (retryFound) {
            console.log(`⚠️ Tide found after delay - consistency issue detected`);
          } else {
            console.error(`❌ Tide still not found after delay - storage persistence failure`);
          }
        }
        
        expect(foundTide).toBeDefined();
        expect(foundTide.name).toBe(uniqueName);
        expect(foundTide.flow_type).toBe('daily');
        
        console.log(`✅ Storage integration test passed for ${env.name}`);
      }, testTimeout);
      
      it('should handle multiple rapid create/list cycles', async () => {
        const cycles = 3;
        const createdTides: string[] = [];
        
        for (let i = 0; i < cycles; i++) {
          const uniqueName = `Rapid Test ${Date.now()}-${i}`;
          
          // Create tide
          const createResponse = await makeMCPRequest(env.url, env.apiKey, 'tools/call', {
            name: 'tide_create',
            arguments: {
              name: uniqueName,
              flow_type: 'project',
              description: `Rapid test cycle ${i}`
            }
          });
          
          const createData = extractTideData(createResponse);
          expect(createData.success).toBe(true);
          createdTides.push(createData.tide_id);
          
          // Immediately list
          const listResponse = await makeMCPRequest(env.url, env.apiKey, 'tools/call', {
            name: 'tide_list',
            arguments: { flow_type: 'project' }
          });
          
          const listData = extractTideData(listResponse);
          expect(listData.success).toBe(true);
          
          // Each cycle should show accumulating tides
          const foundTides = createdTides.filter(tideId => 
            listData.tides.some((tide: any) => tide.id === tideId)
          );
          
          console.log(`🔄 Cycle ${i}: Created ${createdTides.length}, Found ${foundTides.length}`);
          
          // This is the critical test - all created tides should be findable
          expect(foundTides.length).toBe(createdTides.length);
        }
        
        console.log(`✅ Rapid integration test passed for ${env.name}`);
      }, testTimeout * 2);
    });
  });
  
  describe('Cross-Environment Data Isolation', () => {
    it('should maintain data isolation between environments', async () => {
      const testName = `Isolation Test ${Date.now()}`;
      
      // Create tide in tides-001
      const createResponse1 = await makeMCPRequest(ENVIRONMENTS[0].url, ENVIRONMENTS[0].apiKey, 'tools/call', {
        name: 'tide_create',
        arguments: {
          name: `${testName} - ENV001`,
          flow_type: 'daily',
          description: 'Testing cross-environment isolation'
        }
      });
      
      const createData1 = extractTideData(createResponse1);
      expect(createData1.success).toBe(true);
      
      // Verify it doesn't appear in tides-002
      const listResponse2 = await makeMCPRequest(ENVIRONMENTS[1].url, ENVIRONMENTS[1].apiKey, 'tools/call', {
        name: 'tide_list',
        arguments: { flow_type: 'daily' }
      });
      
      const listData2 = extractTideData(listResponse2);
      const foundInOtherEnv = listData2.tides.find((tide: any) => tide.id === createData1.tide_id);
      
      expect(foundInOtherEnv).toBeUndefined();
      console.log(`✅ Cross-environment isolation verified`);
    }, testTimeout);
  });
});

export { makeMCPRequest, extractTideData };