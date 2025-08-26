#!/usr/bin/env node
/**
 * Debug script to test tides-001 server step by step
 */

const BASE_URL = 'https://tides-001.mpazbot.workers.dev/mcp';
const API_KEY = 'tides_testuser_001';

async function testEndpoint(description, method, path, body) {
  console.log(`\n🧪 ${description}`);
  // Handle full URLs vs relative paths
  const fullUrl = path.startsWith('http') ? path : BASE_URL + path;
  console.log(`   ${method} ${fullUrl}`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
    console.log(`   Body: ${JSON.stringify(body)}`);
  }
  
  try {
    const response = await fetch(fullUrl, options);
    const status = response.status;
    const text = await response.text();
    
    console.log(`   Status: ${status}`);
    console.log(`   Response: ${text}`);
    
    if (status === 200 || status === 201) {
      console.log('   ✅ Success');
      return { success: true, status, data: text };
    } else {
      console.log('   ❌ Failed');
      return { success: false, status, error: text };
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  console.log('🏥 Tides-001 Server Diagnostics');
  console.log('=================================');
  
  // Test 1: Basic connectivity
  await testEndpoint('Basic GET request', 'GET', '');
  
  // Test 2: Agent status (should work - different base URL)
  const agentResult = await testEndpoint('Agent status', 'GET', 'https://tides-001.mpazbot.workers.dev/agents/tide-productivity/status');
  
  // Test 3: MCP tools list
  await testEndpoint('MCP tools list', 'POST', '', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  });
  
  // Test 4: MCP tool call
  await testEndpoint('MCP tool call (tide_list)', 'POST', '', {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'tide_list',
      arguments: {}
    }
  });
  
  // Test 5: Auth validation
  await testEndpoint('Auth validation', 'POST', '', {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'auth_validate_key',
      arguments: {
        api_key: API_KEY
      }
    }
  });
  
  console.log('\n📋 Diagnostics Complete');
}

runDiagnostics().catch(console.error);