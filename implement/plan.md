# Implementation Plan - Pure D1 + Parallel R2 Energy Updates Architecture

**Started**: 2025-08-19  
**Source**: `/docs/energy-architecture-spec.md`  
**Goal**: High-performance energy tracking with Victory charts optimization

## Source Analysis

**Source Type**: Technical Specification (Local markdown file)  
**Core Features**:
- D1 energy_updates table with optimized indexes
- Parallel dual writes (D1 + R2) for zero breaking changes
- Victory chart API endpoint for performance 
- EnergyService for centralized energy operations
- Mobile app Victory chart integration

**Dependencies**: 
- Cloudflare D1 Database
- Existing R2 storage (D1R2HybridStorage)
- TypeScript interfaces for energy types
- Victory charts library (mobile)

**Complexity**: High (database schema changes, service refactor, API endpoints)

## Target Integration

**Integration Points**:
- Server: New EnergyService, API endpoints, MCP tool updates
- Mobile: Enhanced useEnergyData hook, Victory chart performance
- Database: New D1 table with indexes, parallel write strategy
- Storage: Update D1R2HybridStorage to work with EnergyService

**Affected Files**:
- `apps/server/src/services/energyService.ts` (CREATE)
- `apps/server/src/index.ts` (UPDATE - add energy API)
- `apps/server/src/tools/tide-sessions.ts` (UPDATE - use EnergyService)
- `apps/server/src/storage/d1-r2.ts` (UPDATE - energy integration)
- `apps/mobile/src/hooks/useEnergyData.ts` (UPDATE - D1 API option)
- `apps/mobile/src/types/charts.ts` (UPDATE - EnergyUpdate type)
- Database migration script (CREATE)

**Pattern Matching**:
- Follow existing service patterns (authService, mcpService)
- Use established error handling (loggingService)
- Match TypeScript interfaces from existing codebase
- Follow MCP tool handler patterns

## Implementation Tasks

### Phase 1: Database & Core Infrastructure ✅ Ready
- [ ] **P1.1**: Create D1 energy_updates table with optimized indexes
- [ ] **P1.2**: Create EnergyService with parallel dual-write capability  
- [ ] **P1.3**: Add EnergyUpdate TypeScript interface
- [ ] **P1.4**: Add energy chart data API endpoint

### Phase 2: MCP Integration ✅ Ready  
- [ ] **P2.1**: Update tide_sessions.ts addTideEnergy to use EnergyService
- [ ] **P2.2**: Handle initial_energy in startTideFlow function
- [ ] **P2.3**: Integrate EnergyService with D1R2HybridStorage context
- [ ] **P2.4**: Test MCP energy tools work with new architecture

### Phase 3: Mobile Victory Charts ✅ Ready
- [ ] **P3.1**: Update useEnergyData hook with D1 API option
- [ ] **P3.2**: Add fallback to existing MCP method for reliability
- [ ] **P3.3**: Test Victory charts performance improvement
- [ ] **P3.4**: Ensure backward compatibility maintained

### Phase 4: Integration & Testing ✅ Ready
- [ ] **P4.1**: Deploy D1 schema to development environment
- [ ] **P4.2**: Test all energy update flows (MCP, Chat, Agent, Flow Session)
- [ ] **P4.3**: Verify parallel writes work correctly
- [ ] **P4.4**: Performance testing: Victory chart load times
- [ ] **P4.5**: Error handling testing: D1/R2 failure scenarios

## Validation Checklist

- [ ] All energy update flows implemented and tested
- [ ] Victory charts show performance improvement (<100ms target)
- [ ] Zero breaking changes - existing functionality preserved
- [ ] D1 indexes optimize query performance
- [ ] Parallel writes handle failure cases gracefully
- [ ] MCP tools continue working unchanged
- [ ] Mobile app maintains backward compatibility
- [ ] Error handling comprehensive and logged
- [ ] TypeScript types updated and consistent

## Risk Mitigation

**Potential Issues**:
- D1 foreign key constraints may fail if users/tide_index don't exist
- Parallel writes could lead to data inconsistency
- Performance regression if D1 queries aren't properly indexed
- Mobile app breaking if API endpoint fails

**Rollback Strategy**:
- Git checkpoints at each phase completion
- Parallel writes mean existing R2 functionality continues working
- Feature flags could disable D1 writes if needed
- Mobile hook can fallback to existing MCP method

## Performance Targets

- **Victory Chart Load Time**: <100ms (from ~300ms current)
- **Energy Write Latency**: <50ms maintained  
- **Query Performance**: Sub-50ms for 1000+ energy points
- **Reliability**: 99.9% dual-write success rate

## Success Criteria

1. **Functionality**: All existing energy flows continue working
2. **Performance**: Victory charts load significantly faster
3. **Scalability**: System handles 10x energy update frequency
4. **Reliability**: Robust error handling and dual-write tolerance
5. **Maintainability**: Clean architecture with service separation

---

**Next Step**: Begin Phase 1 with D1 table creation and EnergyService implementation