# Implementation Plan - Hierarchical Tide Context System
**Source**: `docs/adr/003-hierachal-tide-context.md`  
**Started**: 2025-08-23  
**Status**: In Progress

## Source Analysis
- **Source Type**: ADR (Architecture Decision Record)
- **Core Features**: Hierarchical tide system with automatic daily/weekly/monthly context creation
- **Dependencies**: Existing D1+R2 storage, MCP tools, mobile context management
- **Complexity**: High - requires database schema changes, MCP tool updates, mobile app changes

## Current Architecture Analysis ✅
**Current State**:
- Independent tide entities (daily, weekly, project, seasonal)
- Manual creation required for each tide type
- No hierarchical relationships between tides
- Mobile app calling missing `tide_get_or_create_daily` tool causing errors

**Key Files Analyzed**:
- `apps/server/src/storage/d1-r2.ts` - Hybrid D1+R2 storage implementation
- `apps/server/src/db/schema.sql` - Current database schema
- `apps/server/src/tools/tide-core.ts` - Core tide management tools
- `apps/mobile/src/hooks/useDailyTide.ts` - Mobile daily tide hook (needs fixing)

## Target Integration
**Integration Points**: 
- Database schema (add hierarchical fields)
- MCP tools (add auto-creation logic)
- Mobile context management (support hierarchical contexts)
- Storage layer (support parent-child relationships)

**Affected Files**:
- `apps/server/src/db/schema.sql` - Add hierarchical columns and indexes
- `apps/server/src/storage/d1-r2.ts` - Update storage methods
- `apps/server/src/tools/tide-core.ts` - Add `tide_get_or_create_daily` and auto-creation
- `apps/server/src/tools/index.ts` - Export new tools
- `apps/mobile/src/context/MCPContext.tsx` - Update context management
- `apps/mobile/src/hooks/useDailyTide.ts` - Fix existing implementation

## Implementation Tasks

### Phase 1: Database Schema & Storage ⏳
- [x] Analyze current schema and storage implementation
- [ ] Design hierarchical schema changes (parent_tide_id, date_range, auto_created)
- [ ] Update D1 schema with hierarchical columns and indexes
- [ ] Update D1R2HybridStorage class to support hierarchical operations
- [ ] Add date boundary utility functions (week/month calculation)

### Phase 2: Auto-Creation Logic ⏳
- [ ] Implement `getOrCreateDailyTide(date)` function
- [ ] Implement `getOrCreateWeeklyTide(date)` function  
- [ ] Implement `getOrCreateMonthlyTide(date)` function
- [ ] Add parent-child relationship linking logic
- [ ] Handle timezone considerations for date boundaries

### Phase 3: MCP Tools Update ✅
- [x] Add `tide_get_or_create_daily` tool (CRITICAL - fixes mobile errors)
- [x] Add `tide_switch_context` tool for context switching
- [x] Add `tide_start_hierarchical_flow` tool for enhanced flow distribution
- [x] Add `tide_list_contexts` and `tide_get_todays_summary` tools
- [x] Update tools export in `index.ts`
- [x] Register all hierarchical tools in MCP server
- [x] Add comprehensive tool documentation

### Phase 4: Mobile App Integration ✅
- [x] Update MCPContext to support hierarchical contexts
- [x] Fix `useDailyTide.ts` to use new `tide_get_or_create_daily` tool
- [x] Add context switching UI components
- [x] Update tide list displays to show hierarchical relationships
- [x] Add date navigation for different contexts

**New Components Created:**
- `ContextSwitcher.tsx` - Switch between daily/weekly/monthly/project contexts
- `ContextSummary.tsx` - Display today's hierarchical summary with flow sessions
- `HierarchicalTidesList.tsx` - Show parent-child tide relationships
- `DateNavigator.tsx` - Navigate between different time periods
- `useHierarchicalContext.ts` - Hook for managing hierarchical context state

**Enhanced Components:**
- `MCPContext.tsx` - Added hierarchical MCP tool support
- `useDailyTide.ts` - Updated to use MCPContext instead of direct service calls
- `TideCard.tsx` - Added hierarchical relationship display
- `types/models.ts` - Extended Tide interface with hierarchical fields

### Phase 5: Testing & Validation ⏳
- [x] Mobile app integration completed and ready for testing
- [ ] Create unit tests for auto-creation logic
- [ ] Create integration tests for hierarchical operations
- [ ] Test mobile-server integration with new tools
- [ ] Test edge cases (year boundaries, timezones)
- [ ] Validate performance with hierarchical queries

## Validation Checklist
- [ ] All features from ADR implemented
- [ ] Mobile app errors resolved (`tide_get_or_create_daily` exists)
- [ ] Tests written and passing
- [ ] No broken functionality
- [ ] Database migration path defined
- [ ] Performance acceptable
- [ ] Cross-timezone handling correct

## Risk Mitigation

### Implementation Complexity
- **Risk**: Complex date boundary logic and hierarchical updates
- **Mitigation**: Use well-defined date boundaries (Monday-Sunday weeks), atomic operations, comprehensive tests

### Data Storage Overhead  
- **Risk**: Additional relationships and complex queries
- **Mitigation**: Database views for aggregations, intelligent caching, optimized indexes

### Migration Challenges
- **Risk**: Existing data needs relationship retrofitting
- **Mitigation**: Gradual migration, backwards compatibility, manual repair tools

## Current Session State
- [x] Project analysis completed
- [x] Implementation plan created  
- [x] Session tracking initialized
- [ ] Schema design in progress
- [ ] Tool implementation pending
- [ ] Mobile integration pending
- [ ] Testing pending

## Next Steps
1. Design hierarchical database schema changes
2. Implement the missing `tide_get_or_create_daily` tool to fix mobile errors
3. Build auto-creation logic for daily/weekly/monthly tides
4. Update mobile context management
5. Create comprehensive test suite