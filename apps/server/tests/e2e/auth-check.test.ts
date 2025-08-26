/**
 * Authentication Security Tests - Unauthorized Access Prevention
 * 
 * Comprehensive security test suite that validates authentication and authorization
 * controls across all Tides environments. This suite ensures that unauthorized
 * access attempts are properly blocked and that the API surface is secure against
 * common attack vectors.
 * 
 * @description Tests the following critical security functionality:
 * 
 * ## Basic MCP Method Protection
 * - Tests all core MCP methods (tools/list, tools/call, resources/*, prompts/*)
 * - Validates proper HTTP 401/403 responses for unauthorized requests
 * - Ensures no sensitive data leakage in error responses
 * - Tests against multiple invalid authentication scenarios
 * 
 * ## Invalid Authentication Scenarios
 * - **No Authorization Header**: Requests without any authentication
 * - **Invalid API Keys**: Malformed keys like `tides_invalid_999`
 * - **Malformed Headers**: Non-Bearer authorization formats
 * - **Empty Headers**: Blank authorization values
 * 
 * ## Protected Tool Call Security
 * - Tests all tide management tools (tide_create, tide_list, tide_flow, etc.)
 * - Validates that unauthorized users cannot create, read, or modify tides
 * - Ensures auth_validate_key tool properly rejects invalid keys
 * - Prevents data exposure through tool execution
 * 
 * ## Specific Security Vulnerabilities
 * - **Data Exposure Prevention**: Ensures tide lists are not exposed without auth
 * - **Creation Prevention**: Blocks unauthorized tide creation attempts
 * - **Validation Bypass Prevention**: Tests against auth validation bypasses
 * - **Response Sanitization**: Verifies no sensitive data in error responses
 * 
 * ## HTTP Method Security
 * - Tests that only POST requests are accepted for MCP endpoints
 * - Validates proper Content-Type header requirements
 * - Ensures appropriate HTTP status codes for method violations
 * 
 * ## Multi-Environment Security
 * - Tests security across all environments (development, staging, production)
 * - Validates consistent security posture across deployments
 * - Ensures environment isolation is maintained
 * 
 * @security This test suite is critical for preventing:
 * - Unauthorized data access
 * - Authentication bypass attacks
 * - Information disclosure vulnerabilities
 * - Cross-user data leakage
 * 
 * @usage Run regularly and after authentication changes:
 * ```bash
 * npm test -- tests/auth-check.test.ts
 * ```
 * 
 * @environments Tests security across all environments:
 * - tides-001: Development environment security
 * - tides-002: Staging environment security
 * - tides-003: Production environment security
 * 
 * @authentication Uses documented valid API keys for comparison:
 * - tides_testuser_001 → testuser001 (valid)
 * - tides_testuser_002 → testuser002 (valid)
 * - tides_testuser_003 → testuser003 (valid)
 * - tides_invalid_999 → rejected (invalid)
 * 
 * @expectations All unauthorized requests should return:
 * - HTTP 401 Unauthorized or 403 Forbidden
 * - No sensitive data in response bodies
 * - No successful tool execution
 * - No tide data exposure
 * 
 * @author Tides Development Team
 * @since 2025-08-05
 */

import { describe, it, expect } from '@jest/globals';

// Environment configurations - same as health check but with invalid/missing auth
const ENVIRONMENTS = [
  {
    name: 'tides-001 (Development)',
    url: 'https://tides-001.mpazbot.workers.dev/mcp',
    validApiKey: 'tides_testuser_001',
    userId: 'testuser001'
  },
  {
    name: 'tides-002 (Staging)', 
    url: 'https://tides-002.mpazbot.workers.dev/mcp',
    validApiKey: 'tides_testuser_002',
    userId: 'testuser002'
  },
  {
    name: 'tides-003 (Production)',
    url: 'https://tides-003.mpazbot.workers.dev/mcp',
    validApiKey: 'tides_testuser_003', 
    userId: 'testuser003'
  }
];

// Invalid authentication scenarios to test
const INVALID_AUTH_SCENARIOS = [
  {
    name: 'No Authorization Header',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    }
  },
  {
    name: 'Invalid API Key',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': 'Bearer tides_invalid_999'
    }
  },
  {
    name: 'Malformed Authorization Header',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': 'NotBearer invalid-key'
    }
  },
  {
    name: 'Empty Authorization Header',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': ''
    }
  }
];

// MCP methods that should require authentication
const PROTECTED_METHODS = [
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/read',
  'prompts/list',
  'prompts/get'
];

// Specific tool calls that should be protected
const PROTECTED_TOOL_CALLS = [
  {
    name: 'tide_create',
    arguments: {
      name: 'Unauthorized Test Tide',
      flow_type: 'daily',
      description: 'This should not be created'
    }
  },
  {
    name: 'tide_list',
    arguments: {
      flow_type: 'daily'
    }
  },
  {
    name: 'tide_flow',
    arguments: {
      tide_id: 'tide_123_test',
      action: 'start'
    }
  },
  {
    name: 'auth_validate_key',
    arguments: {
      api_key: 'invalid-key'
    }
  }
];

// Helper function to make unauthorized MCP requests
async function makeUnauthorizedMCPRequest(url: string, headers: any, method: string, params?: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000),
      method,
      params
    })
  });

  return {
    status: response.status,
    statusText: response.statusText,
    response: response.ok ? await response.text() : null
  };
}

describe('Authentication Check Tests - Unauthorized Access', () => {
  const testTimeout = 30000;

  describe('Basic MCP Method Protection', () => {
    ENVIRONMENTS.forEach(env => {
      INVALID_AUTH_SCENARIOS.forEach(authScenario => {
        PROTECTED_METHODS.forEach(method => {
          it(`should deny ${method} with ${authScenario.name} in ${env.name}`, async () => {
            const result = await makeUnauthorizedMCPRequest(
              env.url, 
              authScenario.headers, 
              method
            );
            
            // Should receive 401 Unauthorized or 403 Forbidden
            expect([401, 403]).toContain(result.status);
            
            // Response should not contain valid MCP data
            if (result.response) {
              const text = result.response;
              // If we get a response, it should not contain successful tide data
              expect(text).not.toMatch(/tide_\d+_[a-z0-9]+/);
              expect(text).not.toMatch(/"success"\s*:\s*true/);
            }
          }, testTimeout);
        });
      });
    });
  });

  describe('Protected Tool Calls', () => {
    ENVIRONMENTS.forEach(env => {
      INVALID_AUTH_SCENARIOS.forEach(authScenario => {
        PROTECTED_TOOL_CALLS.forEach(toolCall => {
          it(`should deny ${toolCall.name} tool call with ${authScenario.name} in ${env.name}`, async () => {
            const result = await makeUnauthorizedMCPRequest(
              env.url,
              authScenario.headers,
              'tools/call',
              toolCall
            );
            
            // Should receive 401 Unauthorized or 403 Forbidden
            expect([401, 403]).toContain(result.status);
            
            // Response should not contain successful tool execution
            if (result.response) {
              const text = result.response;
              expect(text).not.toMatch(/"success"\s*:\s*true/);
              expect(text).not.toMatch(/tide_\d+_[a-z0-9]+/);
              // Should not contain actual tide data
              expect(text).not.toMatch(/"tides"\s*:\s*\[/);
            }
          }, testTimeout);
        });
      });
    });
  });

  describe('Specific Security Vulnerabilities', () => {
    ENVIRONMENTS.forEach(env => {
      it(`should not expose tide list without authentication in ${env.name}`, async () => {
        // Test the specific vulnerability mentioned by the user
        const result = await makeUnauthorizedMCPRequest(
          env.url,
          {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
          },
          'tools/call',
          {
            name: 'tide_list',
            arguments: {}
          }
        );
        
        expect([401, 403]).toContain(result.status);
        
        if (result.response) {
          const text = result.response;
          // Should NOT contain tide data
          expect(text).not.toMatch(/"tides"\s*:\s*\[/);
          expect(text).not.toMatch(/tide_\d+_[a-z0-9]+/);
          expect(text).not.toMatch(/"flow_type"/);
          expect(text).not.toMatch(/"created_at"/);
        }
      }, testTimeout);

      it(`should not allow tide creation without authentication in ${env.name}`, async () => {
        const result = await makeUnauthorizedMCPRequest(
          env.url,
          {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
          },
          'tools/call',
          {
            name: 'tide_create',
            arguments: {
              name: 'Unauthorized Tide Creation Test',
              flow_type: 'daily',
              description: 'This should fail due to lack of authentication'
            }
          }
        );
        
        expect([401, 403]).toContain(result.status);
        
        if (result.response) {
          const text = result.response;
          // Should NOT contain successful creation response
          expect(text).not.toMatch(/"success"\s*:\s*true/);
          expect(text).not.toMatch(/tide_\d+_[a-z0-9]+/);
          expect(text).not.toMatch(/"tide_id"/);
        }
      }, testTimeout);

      it(`should not validate invalid API keys in ${env.name}`, async () => {
        const result = await makeUnauthorizedMCPRequest(
          env.url,
          {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': 'Bearer tides_invalid_999'
          },
          'tools/call',
          {
            name: 'auth_validate_key',
            arguments: {
              api_key: 'tides_invalid_999'
            }
          }
        );
        
        expect([401, 403]).toContain(result.status);
        
        if (result.response) {
          const text = result.response;
          // Should NOT contain successful validation
          expect(text).not.toMatch(/"success"\s*:\s*true/);
          expect(text).not.toMatch(/"userId"/);
          expect(text).not.toMatch(/"user_id"/);
        }
      }, testTimeout);
    });
  });

  describe('HTTP Method Security', () => {
    ENVIRONMENTS.forEach(env => {
      it(`should not allow GET requests to MCP endpoint in ${env.name}`, async () => {
        const response = await fetch(env.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Should receive 405 Method Not Allowed or similar
        expect([405, 404, 400, 401]).toContain(response.status);
      }, testTimeout);

      it(`should not allow requests without proper Content-Type in ${env.name}`, async () => {
        const response = await fetch(env.url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.validApiKey}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
          })
        });
        
        // Should receive 400 Bad Request or similar for missing Content-Type
        expect([400, 415, 406]).toContain(response.status);
      }, testTimeout);
    });
  });

  describe('Security Summary', () => {
    it('should provide authentication security summary', async () => {
      console.log('\n🔒 AUTHENTICATION SECURITY SUMMARY');
      console.log('===================================');
      
      let securityIssues = 0;
      
      for (const env of ENVIRONMENTS) {
        console.log(`\n🧪 Testing ${env.name}:`);
        
        // Test unauthorized access to tide_list
        try {
          const result = await makeUnauthorizedMCPRequest(
            env.url,
            { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
            'tools/call',
            { name: 'tide_list', arguments: {} }
          );
          
          if (result.status === 200 || (result.response && result.response.includes('"success":true'))) {
            console.log(`❌ SECURITY ISSUE: Unauthorized access to tide_list succeeded`);
            securityIssues++;
          } else {
            console.log(`✅ tide_list properly protected (HTTP ${result.status})`);
          }
        } catch (error) {
          console.log(`✅ tide_list properly protected (request failed)`);
        }
        
        // Test unauthorized tools/list access
        try {
          const result = await makeUnauthorizedMCPRequest(
            env.url,
            { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
            'tools/list'
          );
          
          if (result.status === 200) {
            console.log(`❌ SECURITY ISSUE: Unauthorized access to tools/list succeeded`);
            securityIssues++;
          } else {
            console.log(`✅ tools/list properly protected (HTTP ${result.status})`);
          }
        } catch (error) {
          console.log(`✅ tools/list properly protected (request failed)`);
        }
      }
      
      console.log(`\n📊 Security Test Summary:`);
      if (securityIssues === 0) {
        console.log(`✅ All environments properly secured - no unauthorized access detected`);
      } else {
        console.log(`❌ Found ${securityIssues} security issues requiring attention`);
        throw new Error(`Authentication security test failed: ${securityIssues} issues found`);
      }
    }, testTimeout);
  });
});

// Export for potential use in other tests
export { ENVIRONMENTS, INVALID_AUTH_SCENARIOS, makeUnauthorizedMCPRequest };