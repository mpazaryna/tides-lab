# Tides Project Overview

## Project Description
Tides is a multi-platform application suite consisting of:
- React web application
- React Native mobile application
- Cloudflare Workers server

## Technology Stack

### Core Technologies
- **Frontend (Web)**: React
- **Mobile**: React Native
- **Backend**: Cloudflare Workers
- **Language**: TypeScript/JavaScript
- **Package Manager**: npm (v10.0.0)
- **Node Version**: >=18.0.0

### Development Tools
- **Code Quality**:
  - ESLint with TypeScript support
  - Prettier for code formatting
- **Build Tools**: Various platform-specific build scripts
- **Testing**: Platform-specific test runners

## Project Structure

### Main Directories
- `/apps/` - Main application components
  - `/web/` - React web application
  - `/server/` - Cloudflare Workers backend
  - `/mobile/` - React Native mobile app
- `/shared/` - Shared code and utilities
- `/scripts/` - Development and build scripts
- `/docs/` - Project documentation

### Key Configuration Files
- `package.json` - Project configuration and scripts
- `.mcp.json` - MCP (Model Context Protocol) configuration
- `tides.code-workspace` - VS Code workspace settings

## Development Workflows

### Available Scripts
- **Development**:
  - `npm run dev` - Development mode
  - `npm run dev:server` - Server development
  - `npm run dev:mobile` - Mobile development
  - `npm run dev:web` - Web development

- **Building**:
  - `npm run build` - Build all platforms
  - `npm run build:server` - Build server
  - `npm run build:web` - Build web app
  - `npm run build:mobile:android` - Build Android app
  - `npm run build:mobile:ios` - Build iOS app

- **Testing**:
  - `npm run test` - Run all tests
  - `npm test:server` - Server tests
  - `npm test:mobile` - Mobile tests
  - `npm test:web` - Web tests

- **Code Quality**:
  - `npm run lint` - ESLint checking
  - `npm run format` - Prettier formatting

- **Setup & Maintenance**:
  - `npm run setup` - Project setup
  - `npm run clean` - Clean all builds
  - `npm run mobile:setup` - Mobile app setup

## Initial Architecture Insights
This is a modern, multi-platform JavaScript/TypeScript application with:
- Clear separation between web, mobile, and server components
- Shared code architecture through workspace configuration
- Strong emphasis on code quality and testing
- Cloud-based backend using Cloudflare Workers
- Comprehensive development and build tooling