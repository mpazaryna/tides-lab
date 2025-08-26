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