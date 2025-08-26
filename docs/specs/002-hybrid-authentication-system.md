# Technical Specification: Hybrid Authentication System

**Document Version:** 1.0  
**Date:** 2025-08-04  
**Author:** Development Team  
**Status:** Approved

## Executive Summary

This specification defines a hybrid authentication system that supports both custom API keys (mobile clients) and UUID-based authentication (desktop clients) for the Tides MCP server. The system prioritizes cross-client compatibility while maintaining enhanced security for mobile applications.

## Background

The Tides application requires authentication across multiple client types:

- **Mobile App (React Native)**: Primary client with enhanced security requirements
- **Desktop Clients**: Claude Desktop, Goose Desktop with simple setup requirements
- **Future Web Clients**: Browser-based access with flexible auth options

Current implementation uses custom API keys (`tides_{userId}_{randomId}`) which provide enhanced security but complicate cross-client compatibility.

## System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │ Desktop Clients │    │   Web Clients   │
│  (React Native) │    │ (Claude/Goose)  │    │   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ Custom API Key        │ UUID Token            │ Either Token
         └─────────┬─────────────┼───────────────────────┤
                   │             │                       │
                   ▼             ▼                       ▼
          ┌─────────────────────────────────────────────────┐
          │            MCP Server (Cloudflare)             │
          │     ┌─────────────────────────────────────┐     │
          │     │    Hybrid Authentication Layer      │     │
          │     │                                     │     │
          │     │  ┌─────────────┐ ┌─────────────┐   │     │
          │     │  │ Custom Key  │ │ UUID Token  │   │     │
          │     │  │ Validator   │ │ Validator   │   │     │
          │     │  └─────────────┘ └─────────────┘   │     │
          │     └─────────────────────────────────────┘     │
          │              │                                  │
          │              ▼                                  │
          │     ┌─────────────────────────────────────┐     │
          │     │         User Resolution             │     │
          │     │    (Maps to same user_id)           │     │
          │     └─────────────────────────────────────┘     │
          └─────────────────────────────────────────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │              Data Layer                         │
          │  ┌─────────────┐    ┌─────────────────────────┐ │
          │  │ Cloudflare  │    │   Supabase Database     │ │
          │  │     KV      │    │    (User Data)          │ │
          │  │  (UUID      │    │                         │ │
          │  │   Records)  │    └─────────────────────────┘ │
          │  └─────────────┘                               │
          └─────────────────────────────────────────────────┘
```

### Authentication Flow Types

#### Type 1: Mobile App Authentication (Custom API Keys)

```
1. User registers/signs in via Supabase
2. Mobile app generates custom API key: tides_{userId}_{randomId}
3. Key stored securely in device keychain
4. MCP requests use Bearer token with custom key
5. Server validates via custom key logic
6. Maps to user_id for data isolation
```

#### Type 2: Desktop Client Authentication (UUID)

```
1. User registers via mobile app (creates Supabase account)
2. Supabase Edge Function propagates UUID to Cloudflare KV
3. User manually enters UUID in desktop client
4. MCP requests use Bearer token with UUID
5. Server validates UUID against Cloudflare KV
6. Maps to user_id for data isolation
```

## Technical Implementation

### 1. Server-Side Changes

#### 1.1 Enhanced Authentication Middleware

**File:** `supabase-tides-demo-1/src/storage/index.ts`

```typescript
export interface AuthContext {
  userId: string;
  keyId: string;
  authType: 'custom' | 'uuid';
  clientType?: 'mobile' | 'desktop' | 'web';
}

export class StorageService {
  async validateApiKey(apiKey: string): Promise<AuthContext | null> {
    // Hybrid authentication logic
    if (this.isUUID(apiKey)) {
      return await this.validateUUIDAuth(apiKey);
    } else if (apiKey.startsWith('tides_')) {
      return await this.validateCustomKeyAuth(apiKey);
    }
    return null;
  }

  private async validateUUIDAuth(uuid: string): Promise<AuthContext | null> {
    try {
      const userRecord = await this.kv.get(`uuid:${uuid}`);
      if (!userRecord) return null;

      const userData = JSON.parse(userRecord);
      if (!userData.is_active) return null;

      // Update last access timestamp
      await this.updateLastAccess(uuid, 'uuid');

      return {
        userId: userData.user_id,
        keyId: uuid,
        authType: 'uuid',
        clientType: 'desktop',
      };
    } catch (error) {
      console.error('UUID auth validation failed:', error);
      return null;
    }
  }

  private async validateCustomKeyAuth(
    apiKey: string,
  ): Promise<AuthContext | null> {
    try {
      // Existing custom key validation logic
      const parts = apiKey.split('_');
      const userId = parts[1] || 'demo-user';

      // Store usage tracking
      await this.updateLastAccess(apiKey, 'custom');

      return {
        userId,
        keyId: apiKey,
        authType: 'custom',
        clientType: 'mobile',
      };
    } catch (error) {
      console.error('Custom key auth validation failed:', error);
      return null;
    }
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(str);
  }

  private async updateLastAccess(
    keyId: string,
    authType: 'uuid' | 'custom',
  ): Promise<void> {
    const key = authType === 'uuid' ? `uuid:${keyId}` : `key:${keyId}`;
    const data = {
      lastUsed: new Date().toISOString(),
      authType,
      keyId,
    };

    await this.kv.put(key, JSON.stringify(data), {
      expirationTtl: authType === 'uuid' ? 86400 : 3600, // UUID: 24hrs, Custom: 1hr
    });
  }
}
```

#### 1.2 UUID Registration Endpoint

**File:** `supabase-tides-demo-1/src/index.ts`

```typescript
// Add admin endpoint for UUID registration
if (url.pathname === '/admin/register-uuid' && request.method === 'POST') {
  return handleUUIDRegistration(request);
}

async function handleUUIDRegistration(request: Request): Promise<Response> {
  try {
    // Verify admin authorization (implement your admin auth logic)
    const authHeader = request.headers.get('Authorization');
    if (!isValidAdminAuth(authHeader)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { uuid, userData } = await request.json();

    // Store UUID in Cloudflare KV
    await storage.registerUUID(uuid, userData);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### 2. Supabase Integration

#### 2.1 Edge Function for UUID Propagation

**File:** `supabase/functions/propagate-uuid/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async req => {
  try {
    const { type, record } = await req.json();

    // Only process user insertions
    if (type !== 'INSERT' || !record) {
      return new Response('OK', { status: 200 });
    }

    const userData = {
      user_id: record.id,
      email: record.email,
      created_at: record.created_at,
      is_active: true,
      client_access: {
        mobile: true,
        claude_desktop: true,
        goose_desktop: true,
        web: true,
      },
    };

    // Propagate to Cloudflare KV via MCP server
    const response = await fetch(
      `${Deno.env.get('MCP_SERVER_URL')}/admin/register-uuid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('ADMIN_API_KEY')}`,
        },
        body: JSON.stringify({
          uuid: record.id,
          userData,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to register UUID: ${response.statusText}`);
    }

    return new Response('UUID propagated successfully', { status: 200 });
  } catch (error) {
    console.error('UUID propagation error:', error);
    return new Response(error.message, { status: 500 });
  }
});
```

#### 2.2 Database Trigger

**SQL Migration:**

```sql
-- Create trigger for UUID propagation
CREATE OR REPLACE FUNCTION notify_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function to propagate UUID
  PERFORM
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/propagate-uuid',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret') || '"}'::jsonb,
      body := json_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW)
      )::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to auth.users table
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_created();
```

### 3. Mobile App Enhancements

#### 3.1 UUID Export Feature

**File:** `src/services/authService.ts`

```typescript
class AuthenticationService {
  // Add UUID export functionality
  async getUserUUID(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      return user?.id || null;
    } catch (error) {
      console.error('Failed to get user UUID:', error);
      return null;
    }
  }

  async generateDesktopAuthQR(): Promise<string | null> {
    try {
      const uuid = await this.getUserUUID();
      if (!uuid) return null;

      // Create QR code data with UUID and setup instructions
      const qrData = {
        type: 'tides_desktop_auth',
        uuid: uuid,
        server_url: this.currentWorkerUrl,
        instructions:
          'Enter this UUID in your desktop MCP client configuration',
      };

      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Failed to generate desktop auth QR:', error);
      return null;
    }
  }

  async exportAuthConfig(): Promise<string> {
    const uuid = await this.getUserUUID();
    const serverUrl = this.currentWorkerUrl;

    return JSON.stringify(
      {
        mcpServers: {
          tides: {
            command: 'npx',
            args: ['mcp-remote', `${serverUrl}/mcp`],
            auth: {
              type: 'bearer',
              token: uuid,
            },
          },
        },
      },
      null,
      2,
    );
  }
}
```

#### 3.2 Desktop Setup Screen

**File:** `src/screens/Settings/DesktopSetup.tsx`

```typescript
import React, { useState } from 'react';
import { View, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card, Text } from '../../design-system';
import { AuthService } from '../../services/authService';

export function DesktopSetupScreen() {
  const [uuid, setUUID] = useState<string>('');
  const [qrData, setQRData] = useState<string>('');

  const handleGenerateQR = async () => {
    const qrString = await AuthService.generateDesktopAuthQR();
    if (qrString) {
      setQRData(qrString);
      const userUUID = await AuthService.getUserUUID();
      setUUID(userUUID || '');
    }
  };

  const handleExportConfig = async () => {
    try {
      const config = await AuthService.exportAuthConfig();
      await Share.share({
        message: config,
        title: 'Tides Desktop Configuration',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export configuration');
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Card>
        <Text variant="h3">Desktop Client Setup</Text>

        <Button onPress={handleGenerateQR}>Generate Setup QR Code</Button>

        {qrData && (
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <QRCode value={qrData} size={200} />
          </View>
        )}

        {uuid && (
          <View style={{ marginVertical: 16 }}>
            <Text variant="body">Your UUID:</Text>
            <Text variant="code" selectable>
              {uuid}
            </Text>
          </View>
        )}

        <Button variant="secondary" onPress={handleExportConfig}>
          Export Configuration File
        </Button>
      </Card>
    </View>
  );
}
```

## Data Models

### Cloudflare KV Schema

```typescript
// Key: uuid:{user_uuid}
interface UUIDRecord {
  user_id: string;
  email: string;
  created_at: string;
  is_active: boolean;
  last_used?: string;
  client_access: {
    mobile: boolean;
    claude_desktop: boolean;
    goose_desktop: boolean;
    web: boolean;
  };
}

// Key: key:{custom_api_key}
interface CustomKeyRecord {
  userId: string;
  lastUsed: string;
  keyId: string;
  authType: 'custom';
}
```

## Security Considerations

### 1. Token Security

- **Custom Keys**: Short-lived (1 hour KV TTL), regenerated on each sign-in
- **UUID Tokens**: Long-lived but revocable via `is_active` flag
- **Transport**: All requests use HTTPS with Bearer token authentication

### 2. Access Control

- **User Isolation**: Both auth types map to user-specific data scopes
- **Revocation**: UUID tokens can be deactivated without affecting mobile apps
- **Audit Trail**: All authentication attempts logged with timestamps

### 3. Client-Specific Security

- **Mobile**: Enhanced security with rotating keys and keychain storage
- **Desktop**: Manual UUID entry reduces attack surface vs. automated flows
- **Cross-Client**: No shared credentials between different client types

## Performance Implications

### 1. Authentication Overhead

- **UUID Validation**: Single KV lookup (~1-5ms)
- **Custom Key Validation**: Pattern matching + KV write (~2-8ms)
- **Total Request Overhead**: <10ms additional latency

### 2. Storage Requirements

- **UUID Records**: ~500 bytes per user
- **Custom Key Tracking**: ~200 bytes per active session
- **KV Operations**: ~1000 read/write operations per day per active user

## Monitoring and Metrics

### 1. Authentication Metrics

```typescript
interface AuthMetrics {
  uuid_auth_attempts: number;
  uuid_auth_successes: number;
  custom_key_auth_attempts: number;
  custom_key_auth_successes: number;
  auth_failures_by_type: Record<string, number>;
  active_sessions_by_auth_type: Record<string, number>;
}
```

### 2. Error Tracking

- Authentication failures by type
- KV operation failures
- UUID propagation failures
- Client type distribution

## Testing Strategy

### 1. Unit Tests

- UUID validation logic
- Custom key validation logic
- Auth context resolution
- Error handling scenarios

### 2. Integration Tests

- End-to-end mobile authentication flow
- Desktop client UUID authentication
- Cross-client data isolation
- Supabase to Cloudflare KV propagation

### 3. Load Testing

- Concurrent authentication requests
- KV performance under load
- Authentication latency benchmarks

## Deployment Plan

### Phase 1: Server Infrastructure (Week 1)

1. Deploy hybrid authentication middleware
2. Set up UUID registration endpoint
3. Configure Cloudflare KV bindings
4. Deploy Supabase Edge Function

### Phase 2: Mobile App Updates (Week 1-2)

1. Add UUID export functionality
2. Create desktop setup screen
3. Implement QR code generation
4. Test mobile app compatibility

### Phase 3: Testing & Validation (Week 2)

1. End-to-end testing
2. Performance benchmarking
3. Security validation
4. Documentation updates

### Phase 4: Desktop Client Integration (Week 3)

1. Desktop client configuration guide
2. User onboarding documentation
3. Support processes
4. Monitoring setup

## Rollback Strategy

### Emergency Rollback

- Disable UUID authentication via feature flag
- Fall back to custom key authentication only
- Preserve existing mobile app functionality

### Gradual Migration

- Support both systems indefinitely
- Monitor adoption metrics
- Deprecate less-used system after 6 months

## Success Metrics

### Primary Metrics

- **Cross-Client Adoption**: >80% of users accessing from multiple clients within 30 days
- **Authentication Success Rate**: >99.5% for both auth types
- **Setup Time**: <5 minutes for desktop client configuration

### Secondary Metrics

- Authentication latency <100ms p95
- Zero data isolation breaches
- <0.1% authentication-related support tickets

## Future Considerations

### 1. Enhanced Security

- JWT-based authentication for additional claims
- Time-limited UUID tokens
- Multi-factor authentication support

### 2. Additional Client Types

- Web browser support
- Mobile browser support
- API access for third-party integrations

### 3. Advanced Features

- Client-specific permissions
- Usage analytics per client type
- Automated client provisioning

---

**Document Approvals:**

- Technical Lead: ✅
- Security Team: ✅
- Product Owner: ✅
- DevOps Team: ✅

**Next Review Date:** 2025-09-04
