# React Native + Cloudflare Workers + Supabase Auth Implementation Guide

## Overview

Build a React Native application that connects to a remote Cloudflare Worker via authenticated requests. Authentication is handled by Supabase Auth, data storage by Cloudflare D1, with secure API key-based communication.

## Architecture

```
React Native App → Supabase Auth → API Key Headers → Cloudflare Worker → D1 Database
```

## Required Services

- **Supabase**: Authentication only (URL/Key provided below)
- **Cloudflare D1**: Database storage
- **Cloudflare Workers**: API endpoint
- **React Native**: Mobile application

## Existing Configuration

```javascript
// Supabase Project Configuration
supabaseUrl = 'https://hcfxujzqlyaxvbetyano.supabase.co';
supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y';

// Worker Domain
supabase-tides-demo-1.mason-c32.workers.dev
```

## Implementation Steps

### 1. Setup React Native Application

Use Context7 MCP to reference React Native documentation:

```
/discord/react-native
```

**Key Components:**

- Authentication screen using Supabase Auth
- API service layer for Worker communication
- Secure storage for API keys

**Required Dependencies:**

```bash
npm install @supabase/supabase-js react-native-keychain
```

### 2. Configure Supabase Authentication

Use Context7 MCP for Supabase Auth documentation:

```
/supabase/auth
```

**Implementation:**

- Initialize Supabase client with provided credentials
- Implement email/password authentication
- Generate secure API key per authenticated session
- Store API key securely using React Native Keychain

### 3. Setup Cloudflare D1 Database

Use Context7 MCP for Cloudflare D1 documentation:

```
/llmstxt/developers_cloudflare_com-d1-llms-full.txt
```

**Database Setup:**

```bash
# Create D1 database
npx wrangler d1 create supabase-tides-demo

# Create tables
npx wrangler d1 execute supabase-tides-demo --command "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, api_key TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"
```

### 4. Implement Cloudflare Worker

Use Context7 MCP for Cloudflare Workers documentation:

```
/cloudflare/workers-sdk
/context7/developers_cloudflare-workers
```

**Worker Structure:**

```javascript
export default {
  async fetch(request, env) {
    // Header-based authentication
    const apiKey = request.headers.get('X-API-Key');

    // Validate API key against D1 database
    // Process request if authenticated
    // Return data or 403 Forbidden
  },
};
```

**Authentication Flow:**

1. Extract API key from request headers
2. Query D1 database to validate key
3. Process request if valid
4. Return appropriate response

### 5. Configure Wrangler

Use Context7 MCP for Wrangler documentation:

```
/cloudflare/wrangler-action
```

**wrangler.toml Configuration:**

```toml
name = "supabase-tides-demo-1"
main = "src/index.js"
compatibility_date = "2024-08-01"

[[d1_databases]]
binding = "DB"
database_name = "supabase-tides-demo"
database_id = "<YOUR_D1_DATABASE_ID>"
```

### 6. Security Implementation

**API Key Generation:**

- Generate unique API key per authenticated user
- Store mapping in D1: user_id → api_key
- Include API key in all Worker requests

**Header-Based Authentication:**

```javascript
// React Native API calls
const headers = {
  'X-API-Key': userApiKey,
  'Content-Type': 'application/json',
};

// Worker authentication check
const REQUIRED_HEADER = 'X-API-Key';
const apiKey = request.headers.get(REQUIRED_HEADER);
```

### 7. Development Workflow

**Local Development:**

```bash
# Start Supabase (if needed locally)
npx supabase start

# Start Cloudflare Worker locally
npx wrangler dev

# Run React Native app
npx react-native run-ios
# or
npx react-native run-android
```

**Deployment:**

```bash
# Deploy Worker
npx wrangler deploy

# Build React Native app
cd ios && xcodebuild
# or
cd android && ./gradlew assembleRelease
```

## Key Implementation Notes

### Authentication Flow

1. User authenticates via Supabase Auth in React Native
2. Generate unique API key for session
3. Store API key securely in device keychain
4. Include API key in headers for all Worker requests
5. Worker validates API key against D1 database

### Data Flow

1. React Native → authenticated request with headers → Cloudflare Worker
2. Worker validates API key → queries D1 database → returns data
3. No direct database access from mobile app

### Security Considerations

- API keys rotate per session
- No JWT tokens required (header-based auth preferred)
- All database operations server-side only
- Secure storage of credentials on device

## Context7 MCP Usage

Throughout development, use Context7 MCP to access relevant documentation:

**Core Libraries:**

- `/supabase/supabase` - Main Supabase documentation
- `/discord/react-native` - React Native framework
- `/cloudflare/workers-sdk` - Cloudflare Workers SDK
- `/llmstxt/developers_cloudflare_com-d1-llms-full.txt` - D1 Database documentation

**Authentication & Security:**

- `/supabase/auth` - Supabase Authentication
- `/context7/developers_cloudflare-workers` - Workers security patterns

**Development Tools:**

- `/cloudflare/wrangler-action` - Wrangler CLI and deployment

## Next Steps

1. Initialize React Native project with Supabase Auth
2. Create D1 database and tables
3. Implement Worker with header authentication
4. Connect React Native app to Worker endpoints
5. Test end-to-end authentication flow
6. Deploy and configure production environment

Remember to use Context7 MCP throughout development to reference the latest documentation and code examples for each service.
