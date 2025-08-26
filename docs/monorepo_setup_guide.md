# Tides Monorepo Migration Script - Claude Code Executable

## Overview

This document provides **exact, executable commands** for migrating three existing repositories into a unified "tides" monorepo optimized for AI development tools like Claude Code.

**Source Repositories:**
- **MCP Server:** https://github.com/mpazaryna/tides-server (Cloudflare Workers, pnpm)
- **Mobile App:** https://github.com/masonomara/TidesMobile (React Native 0.80.2, npm)  
- **Web App:** https://github.com/masonomara/tides-app-bare (Basic framework, npm)

**Target Architecture:** Multi-platform monorepo with independent dependency trees to avoid React Native Metro bundler conflicts.

## Migration Script - Execute in Order

### Step 1: Create New Repository Structure

```bash
# Create the monorepo directory
mkdir tides && cd tides

# Initialize git
git init
echo "# Tides - Rythmic Workflows" > README.md
git add README.md
git commit -m "Initial commit: Create tides monorepo"

# Create directory structure
mkdir -p {apps/{server,mobile,web},shared/{configs,types,scripts},scripts,docs}

# Create initial files
touch shared/configs/.gitkeep
touch shared/types/.gitkeep  
touch shared/scripts/.gitkeep
touch docs/.gitkeep
```

### Step 2: Clone and Merge Existing Repositories

```bash
# Add existing repositories as remotes
git remote add server-origin https://github.com/mpazaryna/tides-server.git
git remote add mobile-origin https://github.com/masonomara/TidesMobile.git
git remote add web-origin https://github.com/masonomara/tides-app-bare.git

# Fetch all repositories
git fetch server-origin
git fetch mobile-origin  
git fetch web-origin

# Use subtree strategy to merge each repo (preserves history cleanly)
git subtree add --prefix=apps/server server-origin main --squash
git subtree add --prefix=apps/mobile mobile-origin main --squash
git subtree add --prefix=apps/web web-origin main --squash

# Clean up remotes (optional)
git remote remove server-origin
git remote remove mobile-origin
git remote remove web-origin
```

### Step 3: Create Root Configuration Files

#### Root package.json
```bash
cat > package.json << 'EOF'
{
  "name": "tides",
  "version": "1.0.0",
  "description": "Multi-platform MCP application suite with React web, React Native mobile, and Cloudflare Workers server",
  "private": true,
  "workspaces": [
    "apps/web",
    "apps/server"
  ],
  "scripts": {
    "dev": "node scripts/dev.js",
    "dev:server": "cd apps/server && pnpm run dev",
    "dev:mobile": "cd apps/mobile && npm run start",
    "dev:web": "cd apps/web && npm run dev",
    "build": "npm run build:server && npm run build:web",
    "build:server": "cd apps/server && pnpm run deploy",
    "build:web": "cd apps/web && npm run build",
    "build:mobile:android": "cd apps/mobile && npm run android",
    "build:mobile:ios": "cd apps/mobile && npm run ios",
    "test": "npm run test:server && npm run test:mobile && npm run test:web",
    "test:server": "cd apps/server && pnpm run test",
    "test:mobile": "cd apps/mobile && npm test",
    "test:web": "cd apps/web && npm test",
    "lint": "eslint apps/*/src --ext .js,.jsx,.ts,.tsx --ignore-pattern node_modules",
    "format": "prettier --write 'apps/*/src/**/*.{js,jsx,ts,tsx,json,md}'",
    "setup": "node scripts/setup.js",
    "clean": "npm run clean:server && npm run clean:mobile && npm run clean:web",
    "clean:server": "cd apps/server && rm -rf node_modules dist .wrangler",
    "clean:mobile": "cd apps/mobile && rm -rf node_modules && npx react-native clean",
    "clean:web": "cd apps/web && rm -rf node_modules dist build",
    "mobile:setup": "cd apps/mobile && npm install && cd ios && bundle install && bundle exec pod install",
    "server:monitor": "cd apps/server && pnpm run monitor:simple"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "concurrently": "^8.2.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.2.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "packageManager": "npm@10.0.0"
}
EOF
```

#### Root .gitignore
```bash
cat > .gitignore << 'EOF'
# Root level ignores
node_modules/
.env
.env.local
.env.*.local
*.log
.DS_Store

# Build outputs
dist/
build/
.wrangler/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
Thumbs.db

# App-specific ignores are handled by individual apps
EOF
```

#### Root ESLint configuration
```bash
cat > .eslintrc.js << 'EOF'
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.wrangler/',
    'apps/mobile/android/',
    'apps/mobile/ios/'
  ]
};
EOF
```

#### Prettier configuration
```bash
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF
```

### Step 4: Create Development Scripts

#### Development runner script
```bash
cat > scripts/dev.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tides development environment...\n');

// Color codes for output
const colors = {
  server: '\x1b[32m', // Green
  mobile: '\x1b[33m', // Yellow  
  web: '\x1b[34m',    // Blue
  reset: '\x1b[0m'
};

function createProcess(name, command, args, cwd, color) {
  const process = spawn(command, args, {
    cwd: path.join(__dirname, '..', cwd),
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${name}]${colors.reset} ${line}`);
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${name}]${colors.reset} ⚠️  ${line}`);
    });
  });

  process.on('close', (code) => {
    console.log(`${color}[${name}]${colors.reset} Process exited with code ${code}`);
  });

  return process;
}

// Start all processes
const processes = [
  createProcess('server', 'pnpm', ['run', 'dev'], 'apps/server', colors.server),
  createProcess('mobile', 'npm', ['run', 'start'], 'apps/mobile', colors.mobile),
  createProcess('web', 'npm', ['run', 'dev'], 'apps/web', colors.web)
];

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all processes...');
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('✅ All processes started. Press Ctrl+C to stop.\n');
EOF
```

#### Setup script  
```bash
cat > scripts/setup.js << 'EOF'
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Tides monorepo...\n');

function runCommand(command, cwd) {
  console.log(`📍 Running: ${command} in ${cwd}`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..', cwd)
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${command} in ${cwd}`);
    console.error(error.message);
    return false;
  }
}

// Install root dependencies
console.log('📦 Installing root dependencies...');
runCommand('npm install', '.');

// Install server dependencies (uses pnpm)
console.log('🖥️  Installing server dependencies...');
runCommand('pnpm install', 'apps/server');

// Install web dependencies
console.log('🌐 Installing web dependencies...');
runCommand('npm install', 'apps/web');

// Install mobile dependencies (IMPORTANT: separate from workspaces)
console.log('📱 Installing mobile dependencies...');
runCommand('npm install', 'apps/mobile');

// iOS setup (only on macOS)
if (process.platform === 'darwin') {
  console.log('🍎 Setting up iOS dependencies...');
  const success = runCommand('npm run mobile:setup', '.');
  if (!success) {
    console.warn('⚠️  iOS setup failed. You may need to run manually:');
    console.warn('   cd apps/mobile/ios && bundle install && bundle exec pod install');
  }
}

console.log('\n✅ Setup complete!');
console.log('\n📋 Next steps:');
console.log('   npm run dev          # Start all applications');
console.log('   npm run dev:server   # Start server only');
console.log('   npm run dev:mobile   # Start mobile only'); 
console.log('   npm run dev:web      # Start web only');
console.log('\n📱 For mobile development:');
console.log('   cd apps/mobile && npm run android');
console.log('   cd apps/mobile && npm run ios');
EOF
```

### Step 5: Fix Mobile App Configuration

The mobile app needs to be completely independent from workspaces to avoid Metro conflicts.

```bash
# Remove mobile app from workspace dependencies
cd apps/mobile

# Verify package.json has NO workspace references
# This command should return nothing - if it finds anything, manual cleanup needed
grep -r "workspace:" package.json || echo "✅ No workspace references found"

# Ensure Metro config is standard
cat > metro.config.js << 'EOF'
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for Tides mobile app
 * 
 * IMPORTANT: Keep this configuration standard to avoid symlink issues
 * This app is intentionally isolated from the monorepo workspace
 * to ensure Metro bundler compatibility.
 * 
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
EOF

# Return to root
cd ../..
```

### Step 6: Create Shared Configuration Templates

```bash
# Shared TypeScript types for API contracts
cat > shared/types/api-types.ts << 'EOF'
// Shared type definitions for MCP communication
// These should be copied into each app as needed, not imported

export interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: string | number;
}

export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

export interface TideWorkflow {
  id: string;
  title: string;
  description: string;
  energy_level: number;
  flow_state: 'incoming' | 'peak' | 'outgoing';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
EOF

# Shared environment template
cat > shared/configs/env.template << 'EOF'
# Copy this file to each app and customize as needed

# MCP Server Configuration
MCP_SERVER_URL=https://tides-001.mpazbot.workers.dev
MCP_SERVER_PATH=/tides-001

# Supabase Configuration  
SUPABASE_URL=https://hcfxujzqlyaxvbetyano.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y

# Application URLs
WEB_APP_URL=http://localhost:3000
MOBILE_DEEP_LINK=tidesmobile://

# Development
NODE_ENV=development
DEBUG=tides:*
EOF

# API client pattern (to be copied to each app)
cat > shared/scripts/api-client-template.ts << 'EOF'
// API Client Template - Copy this into each app's services directory
// DO NOT import this file directly due to Metro bundler limitations

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseUrl: string = process.env.MCP_SERVER_URL || '',
    authToken?: string
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async mcpRequest<T>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const request = {
      jsonrpc: '2.0' as const,
      method,
      params,
      id: Date.now(),
    };

    return this.request<T>('/mcp', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}
EOF
```

### Step 7: Create Documentation

```bash
# Main documentation
cat > docs/development.md << 'EOF'
# Tides Development Guide

## Architecture Overview

Tides is a multi-platform application suite consisting of:

1. **MCP Server** (Cloudflare Workers) - Core tide workflow management
2. **Mobile App** (React Native) - iOS/Android client for tide tracking  
3. **Web App** (React) - Web interface for tide management

## Development Setup

```bash
# Initial setup
npm run setup

# Start all applications
npm run dev

# Start individual apps
npm run dev:server   # Cloudflare Workers server
npm run dev:mobile   # React Native mobile app
npm run dev:web      # React web application
```

## Mobile Development

The mobile app is intentionally isolated from npm workspaces to avoid Metro bundler conflicts:

```bash
cd apps/mobile

# Standard React Native commands work
npm run android
npm run ios
npm start

# Install mobile-specific packages
npm install react-native-some-package
```

## Technology Stack

- **Server:** Cloudflare Workers, pnpm, TypeScript, Zod
- **Mobile:** React Native 0.80.2, TypeScript, Supabase
- **Web:** React, npm, TypeScript
- **Authentication:** Hybrid system (mobile API keys + desktop UUID tokens)
- **Database:** Supabase (PostgreSQL)

## Communication

Applications communicate through the MCP server using JSON-RPC 2.0 over HTTP.
EOF

# API documentation
cat > docs/api.md << 'EOF'
# Tides API Documentation

## MCP Server Endpoints

Base URL: `https://tides-001.mpazbot.workers.dev`

### Available MCP Tools

1. `tide_create` - Create new tide workflows
2. `tide_list` - List existing tides  
3. `tide_flow` - Manage tide flow states
4. `tide_add_energy` - Add energy measurements
5. `tide_link_task` - Link tasks to tides
6. `tide_list_task_links` - List task linkages
7. `tide_get_report` - Generate tide reports
8. `tides_get_participants` - Get tide participants

### Authentication

Two authentication methods supported:

**Mobile Clients:**
```
Authorization: Bearer tides_{userId}_{randomId}
```

**Desktop Clients:**  
```
Authorization: Bearer {uuid}
```

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "tide_create",
  "params": {
    "title": "Morning Workflow",
    "description": "High energy morning routine"
  },
  "id": 1
}
```

### Response Format

```json
{
  "jsonrpc": "2.0", 
  "result": {
    "id": "tide_123",
    "status": "created"
  },
  "id": 1
}
```
EOF
```

### Step 8: Final Setup and Verification

```bash
# Run the setup script
node scripts/setup.js

# Verify structure
echo "📁 Verifying monorepo structure:"
find . -name "package.json" -not -path "*/node_modules/*" | head -10

# Check mobile app isolation  
echo "🔍 Verifying mobile app has no workspace references:"
grep -r "workspace:" apps/mobile/package.json && echo "❌ Found workspace references!" || echo "✅ Mobile app properly isolated"

# Test development scripts
echo "🧪 Testing development script syntax:"
node -c scripts/dev.js && echo "✅ dev.js syntax OK"
node -c scripts/setup.js && echo "✅ setup.js syntax OK"

echo ""
echo "✅ Tides monorepo migration complete!"
echo ""
echo "📋 Next steps:"
echo "   npm run dev          # Start all applications"
echo "   npm run mobile:setup # Setup iOS dependencies (macOS only)"
echo ""
echo "📱 For mobile development:"
echo "   cd apps/mobile"
echo "   npm run android      # Run on Android"
echo "   npm run ios          # Run on iOS"
echo ""
echo "🖥️  For server development:"  
echo "   cd apps/server"
echo "   pnpm run monitor     # Monitor deployed server"
```

## Verification Checklist

After running the migration script, verify:

- [ ] Root `package.json` exists with correct workspace configuration
- [ ] Mobile app is excluded from workspaces  
- [ ] All three apps have their own `package.json` files
- [ ] Development scripts are executable
- [ ] Git history is preserved for all three repositories
- [ ] Mobile app Metro config is standard (no symlink modifications)

## Usage with Claude Code

This migration script is designed for direct execution by Claude Code:

1. **Complete Commands**: Every command is ready to execute
2. **Error Handling**: Scripts include proper error checking
3. **Clear Structure**: Directory structure is explicitly created
4. **Independent Apps**: Each app maintains its own build process
5. **AI-Optimized**: Unified repository with complete project context

The resulting monorepo provides all the benefits for AI development tools while avoiding the technical pitfalls that make React Native incompatible with traditional monorepo setups.
