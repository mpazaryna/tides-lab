# Message Flow Refactoring Plan
**Session:** refactor_message_flow_2025_01_17_1430  
**Started:** 2025-01-17T14:30:00Z  
**Scope:** Mobile → Server → Agent → Mobile message flow architecture

## 🎯 Refactoring Goals

**Primary Objectives:**
- Reduce complexity in ChatContext.tsx (1066 lines → target 400-500 lines)
- Break down large service classes (agentService.ts 593 lines, aiService.ts 676 lines)
- Extract reusable patterns from server handlers (index.ts 506 lines)
- Centralize configuration and eliminate hardcoded URLs (20 occurrences)
- Standardize error handling patterns (146 try/catch blocks)
- **URGENT**: Fix inappropriate AI prompt tone in aiService.ts:525

## 📊 Current State Analysis

### Complexity Hotspots
| File | Lines | Key Issues |
|------|-------|------------|
| ChatContext.tsx | 1066 | 11 useCallback/useMemo hooks, 42 dispatch calls |
| agentService.ts | 593 | Mixed responsibilities, conversation + tools |
| index.ts (server) | 506 | Large handler functions, routing mixed with logic |
| aiService.ts | 676 | **CRITICAL: Inappropriate AI tone (line 525)** |

### Pattern Analysis
- **React Hooks**: 84 occurrences across 17 files
- **Error Handling**: 146 try/catch blocks across 26 files  
- **Hardcoded URLs**: 20 occurrences across 8 files
- **Console Logging**: 269 occurrences across 37 files

## 🚨 Critical Issues to Address

### 1. **URGENT - AI Service Tone Fix**
**File:** `apps/server/src/services/aiService.ts:525`
**Issue:** Inappropriate system prompt: "You are a nagging, horrible, angry middle-manager..."
**Impact:** This completely breaks the intended user experience
**Priority:** IMMEDIATE FIX REQUIRED

## 📋 Refactoring Tasks

### **Phase 1: Critical Fixes (Risk: LOW)**
- [ ] **Task 1.1**: Fix AI service inappropriate tone (aiService.ts:525)
- [ ] **Task 1.2**: Extract configuration constants for URLs
- [ ] **Task 1.3**: Create standardized error handling utilities

### **Phase 2: Mobile Context Refactoring (Risk: MEDIUM)**
- [ ] **Task 2.1**: Extract ChatContext state management 
  - Create `useChatState` hook (reducer + actions)
  - Extract `useChatActions` hook (sendMessage, executeTool, etc.)
  - Extract `useSlashCommands` hook
- [ ] **Task 2.2**: Break down ChatContext.tsx into focused modules
  - `ChatProvider.tsx` (main provider)
  - `chatReducer.ts` (state management)
  - `chatActions.ts` (action creators)
  - `slashCommands.ts` (command parsing)

### **Phase 3: Service Layer Refactoring (Risk: MEDIUM)**
- [ ] **Task 3.1**: Split agentService.ts responsibilities
  - `ConversationService.ts` (AI conversation handling)
  - `MCPToolService.ts` (MCP tool execution)
  - `AgentConfigService.ts` (configuration management)
- [ ] **Task 3.2**: Refactor aiService.ts structure
  - Extract `CachingService.ts`
  - Extract `PromptBuilder.ts` 
  - Extract `ResponseParser.ts`

### **Phase 4: Server Handler Extraction (Risk: LOW)**
- [ ] **Task 4.1**: Extract server request handlers
  - `handlers/aiHandlers.ts`
  - `handlers/agentHandlers.ts`
  - `handlers/authHandlers.ts`
- [ ] **Task 4.2**: Create middleware for common patterns
  - `middleware/auth.ts`
  - `middleware/cors.ts`
  - `middleware/errorHandler.ts`

### **Phase 5: Configuration & Constants (Risk: LOW)**
- [ ] **Task 5.1**: Create centralized configuration
  - `config/endpoints.ts`
  - `config/environments.ts`
  - `config/constants.ts`
- [ ] **Task 5.2**: Replace hardcoded URLs with config

### **Phase 6: Error Handling Standardization (Risk: LOW)**
- [ ] **Task 6.1**: Create error handling utilities
  - `utils/errorHandler.ts`
  - `utils/errorTypes.ts`
  - `types/errors.ts`
- [ ] **Task 6.2**: Standardize try/catch patterns

## 🎯 Target Architecture

### **Mobile Layer (After Refactoring)**
```
apps/mobile/src/
├── context/
│   ├── ChatProvider.tsx           # Main provider (200 lines)
│   ├── chat/
│   │   ├── chatReducer.ts         # State management (150 lines)
│   │   ├── chatActions.ts         # Action creators (200 lines)
│   │   └── slashCommands.ts       # Command parsing (100 lines)
├── services/
│   ├── conversation/
│   │   ├── ConversationService.ts # AI conversations (200 lines)
│   │   ├── MCPToolService.ts      # Tool execution (200 lines)
│   │   └── AgentConfigService.ts  # Configuration (100 lines)
```

### **Server Layer (After Refactoring)**
```
apps/server/src/
├── handlers/
│   ├── aiHandlers.ts              # AI endpoint logic (150 lines)
│   ├── agentHandlers.ts           # Agent routing (150 lines)
│   └── authHandlers.ts            # Auth logic (100 lines)
├── services/
│   ├── ai/
│   │   ├── AIService.ts           # Core AI service (300 lines)
│   │   ├── CachingService.ts      # Cache management (100 lines)
│   │   ├── PromptBuilder.ts       # Prompt construction (150 lines)
│   │   └── ResponseParser.ts      # Response parsing (100 lines)
├── middleware/
│   ├── auth.ts                    # Auth middleware (50 lines)
│   ├── cors.ts                    # CORS handling (30 lines)
│   └── errorHandler.ts            # Error middleware (50 lines)
├── config/
│   ├── endpoints.ts               # API endpoints (50 lines)
│   ├── environments.ts            # Environment config (30 lines)
│   └── constants.ts               # App constants (50 lines)
```

## 🔄 Migration Strategy

### **Incremental Approach**
1. **Critical fixes first** - Fix AI tone and extract config
2. **Layer by layer** - Mobile → Server → Shared utilities
3. **Validate at each step** - Tests + type checking
4. **Preserve interfaces** - No breaking changes to external APIs

### **Rollback Strategy**
- Git checkpoint before each phase
- Feature flags for new implementations
- Parallel implementations during transition
- Clear rollback procedures documented

## ✅ Validation Checklist

### **After Each Phase**
- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] Build successful
- [ ] No broken imports
- [ ] No orphaned code
- [ ] Functionality preserved
- [ ] Performance maintained

### **Final Validation**
- [ ] End-to-end message flow works
- [ ] AI responses have appropriate tone
- [ ] Error handling consistent
- [ ] Configuration centralized
- [ ] Code complexity reduced by 40%+
- [ ] Test coverage maintained
- [ ] Documentation updated

## 📈 Success Metrics

### **Complexity Reduction**
- ChatContext.tsx: 1066 → 400-500 lines (-50%+)
- agentService.ts: 593 → 300 lines (-50%+)
- aiService.ts: 676 → 300 lines (-55%+)
- index.ts: 506 → 200 lines (-60%+)

### **Maintainability Improvements**
- Single responsibility per module
- Reduced coupling between components
- Standardized error handling
- Centralized configuration
- Improved testability

### **Code Quality**
- Consistent patterns across codebase
- Better TypeScript typing
- Cleaner separation of concerns
- Reduced duplication
- Better documentation

## 🚦 Risk Assessment

### **Low Risk (Safe to proceed)**
- Configuration extraction
- Error handling standardization
- Handler extraction
- Constants consolidation

### **Medium Risk (Requires careful testing)**
- ChatContext refactoring
- Service layer splitting
- State management changes

### **High Risk (Critical paths)**
- Core message flow logic
- AI integration points
- Authentication flows

## 📝 Notes

**Important Considerations:**
- Preserve all existing functionality
- Maintain backward compatibility
- Focus on developer experience
- Ensure scalability for future features
- Document breaking changes (if any)

**Success Criteria:**
- Reduced complexity without functionality loss
- Improved code maintainability
- Better separation of concerns
- Standardized patterns
- **Fixed AI tone issue**