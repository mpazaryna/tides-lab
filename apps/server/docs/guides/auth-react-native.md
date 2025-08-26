# React Native MCP Server Authentication Guide

## Overview

This guide covers the authentication requirements for integrating React Native applications with the Tides MCP (Model Context Protocol) server. Our system uses Bearer token authentication with no fallbacks, ensuring secure multi-user support.

## Authentication Architecture

### Core Principles

1. **Bearer Token Required**: All MCP endpoints require Bearer token authentication
2. **No Fallbacks**: No `x-user-id` headers or authentication bypasses allowed
3. **User Isolation**: Each authenticated user accesses only their own data
4. **Consistent Security**: Same authentication flow across all client types

### Token Format

```typescript
// Development test tokens (see src/auth/index.ts:24-33)
'tides_testuser_001'  // Maps to userId: testuser001
'tides_testuser_002'  // Maps to userId: testuser002
'tides_testuser_003'  // Maps to userId: testuser003
// ... up to 005

// Production format: tides_{userId}_{keyId}
```

## MCP Server Endpoints

### Base URLs by Environment

```typescript
const ENVIRONMENTS = {
  production: 'https://tides-001.mpazbot.workers.dev',
  staging: 'https://tides-002.mpazbot.workers.dev',
  development: 'https://tides-003.mpazbot.workers.dev'
};
```

### MCP Protocol Structure

All MCP requests follow the JSON-RPC 2.0 format:

```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  method: 'tools/call' | 'prompts/get' | 'resources/read';
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
  id: string | number;
}

interface MCPResponse {
  jsonrpc: '2.0';
  result?: {
    content: Array<{
      type: 'text';
      text: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
  id: string | number;
}
```

## React Native Implementation

### Required Headers

Every request to the MCP server must include:

```typescript
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};
```

### Basic MCP Tool Call

```typescript
async function callMCPTool(
  toolName: string, 
  params: Record<string, any>
): Promise<any> {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      },
      id: Date.now()
    })
  });

  if (response.status === 401) {
    throw new Error('Invalid API key');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  // Parse the text response from MCP format
  const resultText = data.result?.content?.[0]?.text;
  return resultText ? JSON.parse(resultText) : null;
}
```

## MCP Tool Reference

Available tools and their parameters (see `src/server.ts:11-22`):

### Tide Management Tools

```typescript
// Create a new tide
await callMCPTool('tide_create', {
  name: 'Daily Standup Prep',
  flow_type: 'daily',  // 'daily' | 'weekly' | 'custom'
  description: 'Optional description'
});

// List tides with filtering
await callMCPTool('tide_list', {
  status: 'active',  // Optional: 'active' | 'paused' | 'completed'
  limit: 50          // Optional: max results
});

// Start a flow session
await callMCPTool('tide_flow', {
  tide_id: 'tide_123_abc',
  duration: 25,  // minutes
  intensity: 'focused'  // 'light' | 'moderate' | 'focused' | 'deep'
});

// Record energy level
await callMCPTool('tide_add_energy', {
  tide_id: 'tide_123_abc',
  energy_level: 85,  // 0-100
  context: 'Post-coffee morning energy'
});
```

### Task Integration Tools

```typescript
// Link external task
await callMCPTool('tide_link_task', {
  tide_id: 'tide_123_abc',
  task_type: 'github_issue',
  task_id: 'issue-123',
  task_title: 'Fix authentication bug',
  task_url: 'https://github.com/org/repo/issues/123'
});

// List linked tasks
await callMCPTool('tide_list_task_links', {
  tide_id: 'tide_123_abc'
});
```

### Analytics Tools

```typescript
// Get analytics report
await callMCPTool('tide_get_report', {
  tide_id: 'tide_123_abc',
  report_type: 'productivity'  // 'summary' | 'productivity' | 'energy'
});

// Get raw JSON data
await callMCPTool('tide_get_raw_json', {
  tide_id: 'tide_123_abc'
});
```

### Multi-User Tools

```typescript
// Validate API key (for testing)
await callMCPTool('auth_validate_key', {
  api_key: 'tides_testuser_001'
});

// List all participants
await callMCPTool('tides_get_participants', {});
```

## MCP Prompts

Access pre-configured analysis prompts:

```typescript
async function getMCPPrompt(
  promptName: string,
  params: Record<string, any>
): Promise<string> {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'prompts/get',
      params: {
        name: promptName,
        arguments: params
      },
      id: Date.now()
    })
  });

  const data = await response.json();
  return data.result?.messages?.[0]?.content || '';
}

// Available prompts (see src/server.ts:24-32)
const prompts = [
  'analyze_tide',          // Comprehensive tide analysis
  'productivity_insights', // Time-based performance analysis
  'optimize_energy',       // Energy management recommendations
  'team_insights',         // Collaborative workflow analysis
  'custom_tide_analysis'   // Flexible analysis questions
];
```

## Error Handling

### Authentication Errors

```typescript
try {
  const result = await callMCPTool('tide_list', {});
} catch (error) {
  if (error.message === 'Invalid API key') {
    // Handle 401 - prompt for re-authentication
    await refreshAuthentication();
  } else {
    // Handle other errors
    console.error('MCP call failed:', error);
  }
}
```

### Response Validation

```typescript
function validateMCPResponse(response: any): boolean {
  return response?.jsonrpc === '2.0' && 
         (response.result || response.error) &&
         response.id !== undefined;
}
```

## Testing Authentication

Reference the E2E tests for expected behavior:

```typescript
// Test valid authentication
const testAuth = async () => {
  try {
    const result = await callMCPTool('auth_validate_key', {
      api_key: 'tides_testuser_001'
    });
    console.log('Auth valid:', result.valid === true);
  } catch (error) {
    console.error('Auth failed:', error);
  }
};

// Test tool access
const testToolAccess = async () => {
  try {
    const tides = await callMCPTool('tide_list', { limit: 5 });
    console.log('Received tides:', tides);
  } catch (error) {
    if (error.message === 'Invalid API key') {
      console.error('Authentication required');
    }
  }
};
```

## AsyncStorage Token Management

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save token
await AsyncStorage.setItem('tides_api_key', 'tides_testuser_001');

// Retrieve token
const apiKey = await AsyncStorage.getItem('tides_api_key');

// Clear token on logout
await AsyncStorage.removeItem('tides_api_key');
```

## Common Integration Patterns

### Hook for MCP Tools

```typescript
import { useState, useCallback } from 'react';

export function useMCPTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const callTool = useCallback(async (name: string, params: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await callMCPTool(name, params);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { callTool, loading, error };
}
```

### FlatList with Tides

```typescript
function TidesList() {
  const { callTool, loading } = useMCPTool();
  const [tides, setTides] = useState([]);
  
  const loadTides = async () => {
    const result = await callTool('tide_list', { 
      status: 'active',
      limit: 50 
    });
    setTides(result.tides || []);
  };
  
  return (
    <FlatList
      data={tides}
      keyExtractor={(item) => item.tide_id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>{item.flow_type}</Text>
        </View>
      )}
      onRefresh={loadTides}
      refreshing={loading}
    />
  );
}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify token format: `tides_testuser_XXX` |
| Network timeout | Check environment URL matches deployment |
| Empty responses | Ensure parsing MCP text response correctly |
| CORS errors | MCP server handles CORS, check URL is correct |

### Debug Helper

```typescript
function debugMCPCall(toolName: string, params: any) {
  console.log('Calling MCP tool:', toolName);
  console.log('Parameters:', params);
  console.log('Headers:', {
    'Authorization': `Bearer ${apiKey?.substring(0, 10)}...`
  });
  console.log('Endpoint:', `${baseUrl}/mcp`);
}
```

## References

- **Authentication Implementation**: `src/index.ts:74-98`
- **Valid Test Keys**: `src/auth/index.ts:24-33`
- **MCP Tool Definitions**: `src/server.ts:11-22`
- **E2E Authentication Tests**: `tests/e2e/auth-check.test.ts`
- **Tool Usage Examples**: `tests/e2e/health-check.test.ts`

---

*Last Updated: 2025-08-08*  
*Compatible with: Tides MCP Server v1.6.0+*