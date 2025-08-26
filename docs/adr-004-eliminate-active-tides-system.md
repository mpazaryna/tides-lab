# ADR 0004: Eliminate Active Tides System in Favor of Context-Based Tide Operations

Date: 2025-08-24

## Status

Accepted

## Context

The current Tides mobile app architecture relies on an "active tides" system where:

1. **Tools check `activeTides.length > 0`** before becoming available
2. **User-created tides** determine tool availability
3. **Daily/weekly/monthly hierarchical tides** exist separately but aren't considered "active"
4. **Tool availability logic** is complex and inconsistent
5. **User experience** suffers when tools are unavailable due to "no active tides"

### Current Problems:

- **Hierarchical tides always exist** (daily/weekly/monthly) but aren't in `activeTides[]`
- **Tools become unavailable** unnecessarily when no user-created tides exist
- **Complex availability checking** throughout codebase (`activeTides.length > 0`)
- **Mental model confusion**: "Why are tools disabled when I can work on daily tasks?"
- **Inconsistent behavior**: Daily tide exists but tools think no tides are available

### Architecture Conflict:

The hierarchical tide system (ADR-003) guarantees that daily/weekly/monthly tides always exist, making the "active tides" concept obsolete. The app should assume tide context always exists rather than checking for user-created tides.

## Decision

We will **eliminate the active tides system entirely** and replace it with **context-based tide operations**:

1. **Remove `activeTides[]` dependency** from all tool availability logic
2. **All tools always available** since hierarchical tides always exist
3. **Tools default to current context tide** (daily by default, weekly/monthly when switched)
4. **User-created tides become optional additional context**, not prerequisites
5. **Simplify tool logic** by removing all `activeTides.length` checks

### New Architecture:

```typescript
// OLD (complex)
const available =
  activeTides.length > 0
    ? { available: true }
    : { available: false, reason: "No tides" };

// NEW (simple)
const available = { available: true }; // Context tides always exist
```

### Context Priority:

1. **Daily tide** (default) - Always exists, created on app launch
2. **Weekly tide** (when user switches context) - Auto-created as needed
3. **Monthly tide** (when user switches context) - Auto-created as needed
4. **User-specified tide** (when explicitly provided) - Optional override

## Consequences

### Positive

1. **Simplified Architecture**
   - Remove complex availability checking logic
   - Eliminate `useTidesManagement` dependency for tool availability
   - Tools always work, improving user experience

2. **Consistent Behavior**
   - All tools available at all times
   - No confusing "unavailable" states
   - Clear mental model: "Tools work on current context tide"

3. **Reduced Code Complexity**
   - Remove `activeTides.length > 0` checks throughout codebase
   - Simplify tool availability logic
   - Less maintenance overhead

4. **Better User Experience**
   - Tools never grayed out unexpectedly
   - Immediate productivity (no "create tide first" friction)
   - Consistent behavior regardless of user-created tides

### Negative

1. **Breaking Changes**
   - Need to refactor all tool availability logic
   - Update components that depend on `activeTides`
   - Migration effort required

2. **Conceptual Shift**
   - Developers need to understand new context-based model
   - Different from previous "active tides" mental model

### Mitigations

1. **For Breaking Changes:**
   - Systematic refactoring plan with clear phases
   - Maintain functionality during transition
   - Thorough testing of tool behavior

2. **For Conceptual Shift:**
   - Clear documentation of new model
   - Update code comments and examples
   - Team alignment on new patterns

## Implementation Notes

### Required Changes

1. **Remove Active Tides Logic:**
   - `useToolMenu.ts`: Remove `activeTides.length` checks
   - `useChatInput.ts`: Remove active tide dependencies
   - `getToolAvailability()`: Return `{ available: true }` for all tools

2. **Update Tool Defaults:**
   - Tools use current context tide (daily by default)
   - Add context-awareness to tool parameter generation
   - Handle context switching in tool execution

3. **Simplify Components:**
   - Remove `activeTides` props where not needed
   - Update tool menu availability logic
   - Streamline tide display components

### Migration Strategy

**Phase 1: Update Tool Availability**

- Remove `activeTides.length > 0` checks
- Make all tools always available
- Update tool parameter generation

**Phase 2: Context-Aware Defaults**

- Tools use current tide context by default
- Implement context switching awareness
- Update tool execution logic

**Phase 3: Clean Up**

- Remove unused `activeTides` dependencies
- Simplify components and hooks
- Update documentation

### Best Practices

1. **Tool Design:**
   - Always assume tide context exists
   - Use current context as default
   - Allow explicit tide specification when needed

2. **Context Switching:**
   - Update tool defaults when context changes
   - Maintain context awareness across app
   - Clear feedback to user about current context

3. **Error Handling:**
   - Graceful fallback to daily tide if context issues
   - Clear error messages if tide operations fail
   - Maintain app stability

## Related Decisions

- **ADR-003**: Hierarchical Tide Architecture (provides foundation for this decision)
- **Need to establish**: Context switching UX patterns
- **Need to decide**: Whether to show context indicators in tool UI

## References

- [ADR-003 Hierarchical Tides](archive/adr-003-hierarchical-tides.md)
- Current codebase: `apps/mobile/src/hooks/useToolMenu.ts`
- Current codebase: `apps/mobile/src/hooks/useTidesManagement.ts`
