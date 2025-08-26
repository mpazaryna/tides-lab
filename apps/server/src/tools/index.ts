/**
 * @fileoverview Tides MCP Tools - Unified Export Module
 * 
 * This module re-exports all Tides MCP tools from their organized domain-specific
 * modules, maintaining backward compatibility while providing a clean, scalable
 * architecture for continued tool development.
 * 
 * ## Organization Strategy
 * 
 * Tools are organized by functional domain for maintainability and scalability:
 * 
 * ### Core Tide Management (`tide-core.ts`)
 * - `createTide` - Create new tidal workflows
 * - `listTides` - List and filter existing tides
 * 
 * ### Flow Sessions & Energy (`tide-sessions.ts`)  
 * - `startTideFlow` - Begin focused work sessions
 * - `addTideEnergy` - Track energy levels and mood
 * 
 * ### External Task Integration (`tide-tasks.ts`)
 * - `linkTideTask` - Connect external tasks to tides
 * - `listTideTaskLinks` - List all linked tasks for a tide
 * 
 * ### Analytics & Reporting (`tide-analytics.ts`)
 * - `getTideReport` - Generate comprehensive tide reports
 * - `getTideRawJson` - Get complete raw JSON data from R2 storage
 * - `getParticipants` - Get system participant information
 * 
 * ## Import Patterns
 * 
 * ### Server Usage (recommended)
 * ```typescript
 * // Import specific tools for server registration
 * import { createTide, listTides } from './tools';
 * import { startTideFlow, addTideEnergy } from './tools';
 * // etc.
 * ```
 * 
 * ### Test Usage
 * ```typescript
 * // Import specific functions for focused testing
 * import { createTide } from '../tools';
 * import { startTideFlow } from '../tools';
 * ```
 * 
 * ## Backward Compatibility
 * 
 * This index maintains 100% backward compatibility with existing server.ts imports.
 * All function signatures, return types, and behavior remain identical to the
 * original monolithic tides.ts implementation.
 * 
 * @author Tides Development Team
 * @version 2.0.0
 * @since 2025-01-01
 */

// Core tide management operations
export { createTide, listTides, getOrCreateDailyTide } from './tide-core';

// Flow sessions and energy tracking
export { startTideFlow, addTideEnergy } from './tide-sessions';

// External task integration
export { linkTideTask, listTideTaskLinks } from './tide-tasks';

// Analytics and reporting
export { getTideReport, getTideRawJson, getParticipants } from './tide-analytics';