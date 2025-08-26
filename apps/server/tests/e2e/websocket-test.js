#!/usr/bin/env node

// WebSocket E2E Test for HelloAgent
// Usage: node websocket-test.js [development|staging|production]

import WebSocket from 'ws';

const env = process.argv[2] || 'development';
let baseUrl;

switch (env) {
  case 'production':
    baseUrl = 'wss://tides-003.mpazbot.workers.dev';
    break;
  case 'staging':
    baseUrl = 'wss://tides-002.mpazbot.workers.dev';
    break;
  case 'development':
  default:
    baseUrl = 'wss://tides-001.mpazbot.workers.dev';
    break;
}

console.log(`🔌 Testing WebSocket connection to: ${baseUrl}/agents/hello/ws`);
console.log('================================================');

const ws = new WebSocket(`${baseUrl}/agents/hello/ws`);
let testsPassed = 0;
let testsFailed = 0;
let testTimeout;

// Test sequence
const tests = [
  { name: 'ping', command: { type: 'ping' }, expectType: 'pong' },
  { name: 'echo', command: { type: 'echo', payload: 'Hello WebSocket!' }, expectType: 'echo_response' },
  { name: 'get_stats', command: { type: 'get_stats' }, expectType: 'stats' }
];

let currentTest = 0;

function runNextTest() {
  if (currentTest >= tests.length) {
    console.log('\n================================================');
    console.log('WebSocket Test Results');
    console.log('================================================');
    console.log(`Tests Passed: \x1b[32m${testsPassed}\x1b[0m`);
    console.log(`Tests Failed: \x1b[31m${testsFailed}\x1b[0m`);
    
    if (testsFailed === 0) {
      console.log('\x1b[32m✅ All WebSocket tests passed!\x1b[0m');
      process.exit(0);
    } else {
      console.log('\x1b[31m❌ Some WebSocket tests failed\x1b[0m');
      process.exit(1);
    }
  }
  
  const test = tests[currentTest];
  console.log(`Testing: ${test.name}...`);
  
  // Set timeout for this test
  testTimeout = setTimeout(() => {
    console.log(`\x1b[31m✗ Test '${test.name}' timed out\x1b[0m`);
    testsFailed++;
    currentTest++;
    runNextTest();
  }, 5000);
  
  // Send test command
  ws.send(JSON.stringify(test.command));
}

ws.on('open', function() {
  console.log('\x1b[32m✓ WebSocket connected\x1b[0m');
  
  // Wait a moment for welcome message, then start tests
  setTimeout(() => {
    runNextTest();
  }, 100);
});

ws.on('message', function(data) {
  try {
    const message = JSON.parse(data);
    console.log(`Received: ${JSON.stringify(message)}`);
    
    // Handle welcome message
    if (message.type === 'welcome') {
      console.log('\x1b[32m✓ Received welcome message\x1b[0m');
      return;
    }
    
    // Check if this matches our current test
    if (currentTest < tests.length) {
      const test = tests[currentTest];
      
      if (message.type === test.expectType) {
        console.log(`\x1b[32m✓ Test '${test.name}' passed\x1b[0m`);
        testsPassed++;
        
        // Validate specific responses
        if (test.name === 'echo' && message.payload !== test.command.payload) {
          console.log(`\x1b[31m✗ Echo payload mismatch\x1b[0m`);
          testsFailed++;
          testsPassed--; // Correct the count
        }
        
        if (test.name === 'get_stats' && !message.visits && message.visits !== 0) {
          console.log(`\x1b[31m✗ Stats missing visits field\x1b[0m`);
          testsFailed++;
          testsPassed--; // Correct the count
        }
        
      } else {
        console.log(`\x1b[31m✗ Test '${test.name}' failed - expected '${test.expectType}', got '${message.type}'\x1b[0m`);
        testsFailed++;
      }
      
      clearTimeout(testTimeout);
      currentTest++;
      setTimeout(runNextTest, 500); // Wait a bit between tests
    }
    
  } catch (error) {
    console.log(`\x1b[31m✗ Failed to parse message: ${error.message}\x1b[0m`);
    console.log(`Raw message: ${data}`);
  }
});

ws.on('error', function(error) {
  console.log(`\x1b[31m✗ WebSocket error: ${error.message}\x1b[0m`);
  process.exit(1);
});

ws.on('close', function() {
  console.log('WebSocket connection closed');
  process.exit(testsFailed > 0 ? 1 : 0);
});

// Overall timeout
setTimeout(() => {
  console.log('\x1b[31m✗ Overall test timeout\x1b[0m');
  ws.close();
  process.exit(1);
}, 30000);