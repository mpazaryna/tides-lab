// TEAL

# Tides React Native Mobile Client - Technical Handoff

## Overview

This document provides complete technical specifications for building a React Native mobile client that integrates with the Tides productivity server. The client enables secure access to tidal workflow management through OAuth authentication and JSON-RPC 2.0 communication.

## Stack Requirements

### Core Dependencies

```json
{
  "react-native": "^0.80.1",
  "react": "^19.1.0",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "@supabase/supabase-js": "^2.39.0",
  "typescript": "^5.0.0"
}
```

### Additional Dependencies

```json
{
  "react-native-keychain": "^8.1.0",
  "react-native-url-polyfill": "^2.0.0",
  "react-native-gesture-handler": "^2.14.0",
  "react-native-safe-area-context": "^4.8.0"
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "lib": ["ES2018"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-native"
  }
}
```

## Server Integration

### Base Configuration

- **Server URL**: `https://tides-server-282019336468.us-central1.run.app/mcp/`
- **Protocol**: JSON-RPC 2.0 over HTTP POST
- **Authentication**: Bearer token (OAuth JWT via Supabase)
- **Transport**: HTTP with session persistence

### Environment Setup

```typescript
// config/environment.ts
export const ENV = {
  TIDES_SERVER_URL:
    'https://tides-server-282019336468.us-central1.run.app/mcp/',
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REQUEST_TIMEOUT: 15000, // 15 seconds
  MAX_RETRIES: 3,
};
```

## API Endpoint Specifications

### Available MCP Tools

#### 1. tide_create

**Purpose**: Create new tidal workflows for different time scales

**Request Schema**:

```typescript
interface TideCreateRequest {
  name: string;
  flow_type: 'daily' | 'weekly' | 'project' | 'seasonal';
  description?: string;
}
```

**Response Schema**:

```typescript
interface TideCreateResponse {
  success: boolean;
  tide_id: string;
  name: string;
  flow_type: string;
  created_at: string;
  next_flow: string;
  error?: string;
}
```

**JSON-RPC Example**:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tide_create",
    "arguments": {
      "name": "Morning Deep Work",
      "flow_type": "daily",
      "description": "90-minute focus block for creative work"
    }
  },
  "id": 1
}
```

#### 2. tide_list

**Purpose**: List and filter existing workflows with status

**Request Schema**:

```typescript
interface TideListRequest {
  flow_type?: 'daily' | 'weekly' | 'project' | 'seasonal';
  active_only?: boolean;
}
```

**Response Schema**:

```typescript
interface TideListResponse {
  success: boolean;
  count: number;
  tides: TideSummary[];
  error?: string;
}

interface TideSummary {
  tide_id: string;
  name: string;
  flow_type: string;
  status: 'active' | 'paused';
  created_at: string;
  total_flows: number;
  last_flow?: string;
}
```

#### 3. tide_flow

**Purpose**: Start focused flow sessions with intensity control

**Request Schema**:

```typescript
interface TideFlowRequest {
  tide_id: string;
  intensity?: 'gentle' | 'moderate' | 'strong';
  duration?: number; // minutes (1-90)
  initial_energy?: string;
  work_context?: string;
}
```

**Response Schema**:

```typescript
interface TideFlowResponse {
  success: boolean;
  tide_id: string;
  flow_started: string; // ISO timestamp
  estimated_completion: string; // ISO timestamp
  flow_guidance: string;
  next_actions: string[];
  error?: string;
}
```

#### 4. tide_get_report

**Purpose**: Export individual tide reports

**Request Schema**:

```typescript
interface TideReportRequest {
  tide_id: string;
  format?: 'json' | 'markdown' | 'csv';
}
```

**Response Schema**:

```typescript
interface TideReportResponse {
  success: boolean;
  tide_id: string;
  format: string;
  content: any; // Varies by format
  filename: string;
  message: string;
  error?: string;
}
```

#### 5. tide_add_energy

**Purpose**: Add energy level check-ins to tides

**Request Schema**:

```typescript
interface TideEnergyRequest {
  tide_id: string;
  energy_level: string;
  context?: string;
}
```

**Response Schema**:

```typescript
interface TideEnergyResponse {
  success: boolean;
  tide_id: string;
  energy_level: string;
  timestamp: string; // ISO timestamp
  message: string;
  error?: string;
}
```

### JSON-RPC 2.0 Implementation

#### Base Client Structure

```typescript
// services/TidesClient.ts
export class TidesClient {
  private baseUrl: string;
  private sessionId?: string;
  private requestId = 1;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async callTool<T = any>(
    toolName: string,
    arguments_: Record<string, any>,
    token: string,
  ): Promise<T> {
    const payload = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_,
      },
      id: this.requestId++,
    };

    const response = await this.makeRequest(payload, token);

    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result;
  }

  private async makeRequest(payload: any, token: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: ENV.REQUEST_TIMEOUT,
    });

    // Store session ID from response
    const newSessionId = response.headers.get('mcp-session-id');
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    return await response.json();
  }
}
```

## Authentication Flow Implementation

### OAuth Integration with Supabase

#### 1. Supabase Client Setup

```typescript
// services/AuthService.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  private supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  async signInWithOAuth(provider: 'google' | 'github') {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'com.tides.app://auth/callback',
      },
    });

    if (error) throw error;
    return data;
  }

  async getSession() {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    // Clear MCP session data
    await AsyncStorage.multiRemove(['mcp-session-id', 'mcp-server-url']);
  }
}
```

#### 2. Authentication Flow States

```typescript
// types/auth.ts
export type AuthState =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'token_expired'
  | 'refresh_failed';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'session_invalid'
  | 'authentication_required';

export interface AuthContext {
  authState: AuthState;
  connectionState: ConnectionState;
  user?: User;
  session?: Session;
  tidesClient?: TidesClient;
}
```

#### 3. Authentication Hook

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>('unauthenticated');
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [session, setSession] = useState<Session | null>(null);
  const [tidesClient] = useState(() => new TidesClient(ENV.TIDES_SERVER_URL));

  const authenticate = async (provider: 'google' | 'github') => {
    try {
      setAuthState('authenticating');
      const authData = await authService.signInWithOAuth(provider);
      // Handle OAuth redirect...
    } catch (error) {
      setAuthState('unauthenticated');
      throw error;
    }
  };

  const connectToMCP = async () => {
    if (!session?.access_token) {
      throw new Error('No valid session');
    }

    try {
      setConnectionState('connecting');

      // Initialize MCP connection
      await tidesClient.callTool('initialize', {}, session.access_token);

      setConnectionState('connected');
      return true;
    } catch (error) {
      setConnectionState('disconnected');
      throw error;
    }
  };

  return {
    authState,
    connectionState,
    session,
    tidesClient,
    authenticate,
    connectToMCP,
    signOut: authService.signOut,
  };
};
```

## Local Storage Security Practices

### Secure Token Storage

```typescript
// services/SecureStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export class SecureStorage {
  // Store sensitive auth tokens in Keychain
  static async storeAuthTokens(tokens: {
    access_token: string;
    refresh_token: string;
  }) {
    await Keychain.setInternetCredentials(
      'tides_auth_tokens',
      'oauth_tokens',
      JSON.stringify(tokens),
    );
  }

  static async getAuthTokens(): Promise<{
    access_token: string;
    refresh_token: string;
  } | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        'tides_auth_tokens',
      );
      if (credentials) {
        return JSON.parse(credentials.password);
      }
    } catch (error) {
      console.warn('Failed to retrieve auth tokens:', error);
    }
    return null;
  }

  static async clearAuthTokens() {
    await Keychain.resetInternetCredentials('tides_auth_tokens');
  }

  // Store non-sensitive session data in AsyncStorage
  static async storeMCPSession(sessionId: string) {
    await AsyncStorage.setItem('mcp-session-id', sessionId);
  }

  static async getMCPSession(): Promise<string | null> {
    return await AsyncStorage.getItem('mcp-session-id');
  }

  static async clearMCPSession() {
    await AsyncStorage.removeItem('mcp-session-id');
  }

  static async storeServerURL(url: string) {
    await AsyncStorage.setItem('mcp-server-url', url);
  }

  static async getServerURL(): Promise<string> {
    const stored = await AsyncStorage.getItem('mcp-server-url');
    return stored || ENV.TIDES_SERVER_URL;
  }
}
```

### Data Encryption Best Practices

```typescript
// utils/encryption.ts
import CryptoJS from 'crypto-js';

export class DataEncryption {
  private static getEncryptionKey(): string {
    // Use device-specific key or user-derived key
    return 'user-specific-encryption-key';
  }

  static encrypt(data: string): string {
    const key = this.getEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  static decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
```

## Error Handling Patterns

### HTTP Error Categories

```typescript
// types/errors.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
}

export class TidesError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: Error,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'TidesError';
  }
}
```

### Error Handler Implementation

```typescript
// services/ErrorHandler.ts
export class ErrorHandler {
  static handleHTTPError(response: Response, error?: Error): TidesError {
    if (response.status === 401) {
      return new TidesError(
        ErrorType.AUTHENTICATION_ERROR,
        'Authentication required',
        error,
        true,
      );
    }

    if (response.status === 403) {
      return new TidesError(
        ErrorType.AUTHORIZATION_ERROR,
        'Access denied',
        error,
        false,
      );
    }

    if (response.status >= 500) {
      return new TidesError(
        ErrorType.SERVER_ERROR,
        'Server error occurred',
        error,
        true,
      );
    }

    if (response.status === 408 || response.status === 504) {
      return new TidesError(
        ErrorType.TIMEOUT_ERROR,
        'Request timeout',
        error,
        true,
      );
    }

    return new TidesError(
      ErrorType.NETWORK_ERROR,
      `HTTP ${response.status}: ${response.statusText}`,
      error,
      true,
    );
  }

  static handleNetworkError(error: Error): TidesError {
    if (error.message.includes('timeout')) {
      return new TidesError(
        ErrorType.TIMEOUT_ERROR,
        'Request timeout',
        error,
        true,
      );
    }

    return new TidesError(
      ErrorType.NETWORK_ERROR,
      'Network connection failed',
      error,
      true,
    );
  }
}
```

## Network Retry Logic

### Exponential Backoff Implementation

```typescript
// services/RetryService.ts
export class RetryService {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = ENV.MAX_RETRIES,
    baseDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        const tidesError = error as TidesError;

        // Don't retry non-retryable errors
        if (tidesError instanceof TidesError && !tidesError.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Enhanced HTTP Client with Retry

```typescript
// services/HTTPClient.ts
export class HTTPClient {
  async post<T>(
    url: string,
    payload: any,
    headers: Record<string, string> = {},
  ): Promise<T> {
    return RetryService.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        ENV.REQUEST_TIMEOUT,
      );

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw ErrorHandler.handleHTTPError(response);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof TidesError) {
          throw error;
        }

        throw ErrorHandler.handleNetworkError(error as Error);
      }
    });
  }
}
```

## Development Setup Instructions

### 1. Prerequisites

```bash
# Install Node.js 18+
node --version  # Should be 18.0.0 or higher

# Install React Native CLI
npm install -g @react-native-community/cli

# Install CocoaPods (iOS)
sudo gem install cocoapods

# Install Android Studio with SDK (Android)
```

### 2. Project Initialization

```bash
# Create new React Native project
npx react-native@latest init TidesApp --template react-native-template-typescript

# Navigate to project
cd TidesApp

# Install dependencies
npm install @react-native-async-storage/async-storage
npm install @supabase/supabase-js
npm install react-native-keychain
npm install react-native-url-polyfill
```

### 3. Environment Configuration

```bash
# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
TIDES_SERVER_URL=https://tides-server-282019336468.us-central1.run.app/mcp/
EOF

# Install environment variables package
npm install react-native-dotenv
npm install --save-dev @types/react-native-dotenv
```

### 4. iOS Setup

```bash
cd ios
pod install
cd ..

# Add URL scheme to ios/TidesApp/Info.plist
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.tides.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.tides.app</string>
    </array>
  </dict>
</array>
```

### 5. Android Setup

```xml
<!-- Add to android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTop"
  android:theme="@style/LaunchTheme">

  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.tides.app" />
  </intent-filter>
</activity>
```

### 6. Testing Setup

```typescript
// __tests__/TidesClient.test.ts
import { TidesClient } from '../src/services/TidesClient';

describe('TidesClient', () => {
  let client: TidesClient;

  beforeEach(() => {
    client = new TidesClient('http://localhost:8002/mcp/');
  });

  test('should create tide successfully', async () => {
    const mockToken = 'test-jwt-token';
    const result = await client.callTool(
      'tide_create',
      {
        name: 'Test Tide',
        flow_type: 'daily',
      },
      mockToken,
    );

    expect(result.success).toBe(true);
    expect(result.tide_id).toBeDefined();
  });
});
```

### 7. Development Commands

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### 8. Production Build Setup

```bash
# iOS Release Build
cd ios
xcodebuild -workspace TidesApp.xcworkspace -scheme TidesApp -configuration Release

# Android Release Build
cd android
./gradlew assembleRelease
```

## Integration Testing Checklist

### Authentication Flow Testing

- [ ] OAuth provider selection (Google/GitHub)
- [ ] OAuth redirect handling
- [ ] Token storage in Keychain
- [ ] Automatic token refresh
- [ ] Session restoration on app restart
- [ ] Logout and token cleanup

### MCP Server Communication

- [ ] JSON-RPC 2.0 request formatting
- [ ] Bearer token authentication
- [ ] Session ID persistence
- [ ] Tool call responses
- [ ] Error response handling
- [ ] Network timeout handling

### Data Operations Testing

- [ ] Create new tides (tide_create)
- [ ] List existing tides (tide_list)
- [ ] Start flow sessions (tide_flow)
- [ ] Add energy check-ins (tide_add_energy)
- [ ] Generate reports (tide_get_report)
- [ ] Error state handling for each operation

### Network Resilience Testing

- [ ] Offline mode handling
- [ ] Network connectivity changes
- [ ] Request retry logic
- [ ] Exponential backoff implementation
- [ ] Session recovery after network issues

## Security Considerations

### Authentication Security

- Store sensitive tokens in iOS Keychain/Android Keystore
- Implement automatic token refresh before expiration
- Clear all authentication data on logout
- Validate server certificates for HTTPS connections

### Network Security

- Use HTTPS only for all server communications
- Implement certificate pinning for production
- Sanitize all user inputs before sending to server
- Validate all server responses before processing

### Data Protection

- Encrypt sensitive data stored locally
- Implement app backgrounding protection
- Use secure random number generation
- Follow platform-specific security guidelines

## Performance Optimization

### Network Optimization

- Implement request batching where possible
- Use compression for large payloads
- Cache non-sensitive data locally
- Implement offline queue for pending operations

### Memory Management

- Properly dispose of network resources
- Avoid memory leaks in async operations
- Use weak references where appropriate
- Monitor memory usage during development

### Battery Optimization

- Minimize background network activity
- Use efficient data structures
- Implement proper component lifecycle management
- Avoid unnecessary re-renders

---

This technical handoff document provides comprehensive guidance for implementing a React Native client for the Tides productivity server. All API specifications are derived from actual server code and tested integration patterns.
