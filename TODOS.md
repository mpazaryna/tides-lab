# TIDES MOBILE AI AGENT TASK SPECIFICATIONS

## P0 - CRITICAL PRIORITY

### FRONTEND

### ⚡ IMMEDIATE: Fix Environment URL Mappings
**Priority:** P0 - Production Breaking
**Time Estimate:** 15 minutes
**Files:** `apps/server/wrangler.jsonc`, `apps/mobile/src/services/authService.ts`, `apps/mobile/src/services/mcpService.ts`

**Commands for AI Agent:**
```bash
# 1. Update wrangler.jsonc environment variables
EDIT apps/server/wrangler.jsonc:
  FIND: "001": { "vars": { "ENVIRONMENT": "development" } }
  REPLACE: "001": { "vars": { "ENVIRONMENT": "production" } }
  
  FIND: "003": { "vars": { "ENVIRONMENT": "production" } }  
  REPLACE: "003": { "vars": { "ENVIRONMENT": "development" } }

# 2. Standardize mobile service URLs
EDIT apps/mobile/src/services/authService.ts:
  FIND: private currentUrl = "https://tides-006.mpazbot.workers.dev"
  REPLACE: private currentUrl = "https://tides-001.mpazbot.workers.dev"

EDIT apps/mobile/src/services/mcpService.ts:
  FIND: return this.baseUrl || 'https://tides-001.mpazbot.workers.dev'
  REPLACE: return this.baseUrl || 'https://tides-001.mpazbot.workers.dev'

# 3. Update CLAUDE.md documentation  
EDIT CLAUDE.md:
  FIND: "env.001 → tides-001.mpazbot.workers.dev (dev)"
  REPLACE: "env.001 → tides-001.mpazbot.workers.dev (prod)"
  
  FIND: "env.003 → tides-003.mpazbot.workers.dev (prod)" 
  REPLACE: "env.003 → tides-003.mpazbot.workers.dev (dev)"
```

**Validation Command:**
```bash
# Test environment consistency
curl https://tides-001.mpazbot.workers.dev/health
curl https://tides-002.mpazbot.workers.dev/health  
curl https://tides-003.mpazbot.workers.dev/health
# Verify ENVIRONMENT values match intended mapping
```

### 🎯 Agent Proactivity Improvement
**Priority:** P0 - User Experience Critical
**Time Estimate:** 4 hours
**Files:** `apps/mobile/src/context/ChatContext.tsx`, `apps/mobile/src/services/agentService.ts`

**Problem:** Agent passive, requires explicit user commands for tide tools
**Solution:** Context-aware tool suggestion system

**Commands for AI Agent:**
```typescript
// 1. Create proactive agent hook
CREATE apps/mobile/src/hooks/useProactiveAgent.ts:
CONTENT: 
```typescript
import { useCallback, useEffect, useRef } from 'react';
import { useMCP } from '../context/MCPContext';
import { useChat } from '../context/ChatContext';

export const useProactiveAgent = () => {
  const { connectionStatus } = useMCP();
  const { messages, addMessage } = useChat();
  const lastSuggestionTime = useRef(Date.now());

  const analyzeContext = useCallback(() => {
    const recentMessages = messages.slice(-5);
    const hasWorkflowKeywords = recentMessages.some(msg => 
      /\b(productivity|energy|focus|completed|started|working)\b/i.test(msg.content)
    );
    
    const timeSinceLastSuggestion = Date.now() - lastSuggestionTime.current;
    const shouldSuggest = hasWorkflowKeywords && timeSinceLastSuggestion > 300000; // 5 minutes
    
    if (shouldSuggest && connectionStatus === 'connected') {
      lastSuggestionTime.current = Date.now();
      addMessage({
        role: 'assistant',
        content: 'I notice you\'re discussing productivity. Would you like me to check your current tide status or add energy data?',
        toolSuggestions: ['tide_flow', 'tide_add_energy', 'tide_get_report']
      });
    }
  }, [messages, connectionStatus, addMessage]);

  useEffect(() => {
    const interval = setInterval(analyzeContext, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [analyzeContext]);

  return { analyzeContext };
};
```

// 2. Integrate into ChatContext
EDIT apps/mobile/src/context/ChatContext.tsx:
  ADD_IMPORT: import { useProactiveAgent } from '../hooks/useProactiveAgent';
  ADD_IN_PROVIDER: const { analyzeContext } = useProactiveAgent();
```

### 🛠️ IDE-Style Tool Intellisense  
**Priority:** P0 - Developer Experience Critical
**Time Estimate:** 6 hours
**Files:** `apps/mobile/src/components/chat/ChatInput.tsx`, `apps/mobile/src/components/tools/ToolSuggestion.tsx`

**Commands for AI Agent:**
```typescript
// 1. Create tool parameter completion system
CREATE apps/mobile/src/components/chat/ToolAutocomplete.tsx:
CONTENT:
```typescript
import React, { memo, useMemo } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Text } from '../../design-system';
import { MCP_TOOLS_CONFIG } from '../../config/toolsConfig';

interface ToolAutocompleteProps {
  inputText: string;
  onToolSelect: (tool: string, params: Record<string, any>) => void;
  visible: boolean;
}

export const ToolAutocomplete = memo<ToolAutocompleteProps>(({ 
  inputText, 
  onToolSelect, 
  visible 
}) => {
  const suggestions = useMemo(() => {
    if (!visible || !inputText.includes('/')) return [];
    
    const toolName = inputText.split('/')[1]?.toLowerCase() || '';
    return Object.entries(MCP_TOOLS_CONFIG)
      .filter(([name]) => name.toLowerCase().includes(toolName))
      .map(([name, config]) => ({
        name,
        description: config.description,
        requiredParams: config.parameters.filter(p => p.required),
        optionalParams: config.parameters.filter(p => !p.required)
      }))
      .slice(0, 5);
  }, [inputText, visible]);

  const renderSuggestion = useCallback(({ item }) => (
    <TouchableOpacity 
      onPress={() => onToolSelect(item.name, {})}
      style={{ padding: 12, borderBottomWidth: 1 }}
    >
      <Text variant="semibold">{item.name}</Text>
      <Text variant="body" color="textSecondary">{item.description}</Text>
      {item.requiredParams.length > 0 && (
        <Text variant="small" color="primary">
          Required: {item.requiredParams.map(p => p.name).join(', ')}
        </Text>
      )}
    </TouchableOpacity>
  ), [onToolSelect]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <View style={{ maxHeight: 200, backgroundColor: 'white', borderWidth: 1 }}>
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={item => item.name}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
      />
    </View>
  );
});
```

// 2. Integrate autocomplete into ChatInput
EDIT apps/mobile/src/components/chat/ChatInput.tsx:
  ADD_IMPORT: import { ToolAutocomplete } from './ToolAutocomplete';
  ADD_STATE: const [showAutocomplete, setShowAutocomplete] = useState(false);
  ADD_EFFECT: 
```typescript
useEffect(() => {
  const shouldShow = inputText.includes('/') && inputText.length > 1;
  setShowAutocomplete(shouldShow);
}, [inputText]);
```
  ADD_BEFORE_RETURN: 
```typescript
<ToolAutocomplete
  inputText={inputText}
  onToolSelect={(tool, params) => {
    setInputText(`/${tool} ${JSON.stringify(params, null, 2)}`);
    setShowAutocomplete(false);
  }}
  visible={showAutocomplete}
/>
```
```

### 📅 Tide Context Calendar Navigation
**Priority:** P0 - Core Workflow Feature  
**Time Estimate:** 8 hours
**Files:** `apps/mobile/src/components/tides/TideContextCalendar.tsx`, `apps/mobile/src/screens/Main/Home.tsx`

**Commands for AI Agent:**
```typescript
// 1. Create calendar component with conversation markers
CREATE apps/mobile/src/components/tides/TideContextCalendar.tsx:
CONTENT:
```typescript
import React, { memo, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { Text, Card } from '../../design-system';
import { useChat } from '../../context/ChatContext';
import { tokens } from '../../design-system/tokens';

interface CalendarDay {
  date: string; // ISO date
  hasConversations: boolean;
  isSelected: boolean;
  isToday: boolean;
  conversationCount: number;
}

interface TideContextCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export const TideContextCalendar = memo<TideContextCalendarProps>(({
  onDateSelect,
  selectedDate,
  viewMode = 'daily'
}) => {
  const { conversationHistory } = useChat();
  
  const calendarData = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    const daysToShow = viewMode === 'monthly' ? 30 : viewMode === 'weekly' ? 7 : 1;
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const conversationsForDate = conversationHistory.filter(conv => 
        conv.date.startsWith(dateStr)
      );
      
      days.push({
        date: dateStr,
        hasConversations: conversationsForDate.length > 0,
        isSelected: dateStr === selectedDate,
        isToday: i === 0,
        conversationCount: conversationsForDate.length
      });
    }
    
    return days.reverse(); // Show oldest first
  }, [conversationHistory, selectedDate, viewMode]);

  const renderDay = useCallback(({ item }: { item: CalendarDay }) => (
    <TouchableOpacity
      onPress={() => onDateSelect(item.date)}
      style={{
        padding: tokens.spacing.sm,
        margin: tokens.spacing.xs,
        backgroundColor: item.isSelected ? tokens.colors.primary : 'transparent',
        borderRadius: tokens.borderRadius.md,
        borderWidth: item.isToday ? 2 : 1,
        borderColor: item.isToday ? tokens.colors.primary : tokens.colors.border.default,
        minHeight: 60
      }}
    >
      <Text 
        variant="small" 
        color={item.isSelected ? 'onPrimary' : 'textPrimary'}
      >
        {new Date(item.date).getDate()}
      </Text>
      {item.hasConversations && (
        <View style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: tokens.colors.accent
        }} />
      )}
      {item.conversationCount > 0 && (
        <Text variant="tiny" color={item.isSelected ? 'onPrimary' : 'textSecondary'}>
          {item.conversationCount} chats
        </Text>
      )}
    </TouchableOpacity>
  ), [onDateSelect]);

  return (
    <Card variant="elevated" style={{ margin: tokens.spacing.md }}>
      <Text variant="h3" style={{ marginBottom: tokens.spacing.sm }}>
        {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
      </Text>
      <FlatList
        data={calendarData}
        renderItem={renderDay}
        keyExtractor={item => item.date}
        horizontal={viewMode !== 'monthly'}
        numColumns={viewMode === 'monthly' ? 7 : undefined}
        removeClippedSubviews={true}
        initialNumToRender={viewMode === 'monthly' ? 14 : 7}
        maxToRenderPerBatch={7}
        showsHorizontalScrollIndicator={false}
      />
    </Card>
  );
});
```

// 2. Integrate calendar into Home screen  
EDIT apps/mobile/src/screens/Main/Home.tsx:
  ADD_IMPORT: import { TideContextCalendar } from '../../components/tides/TideContextCalendar';
  ADD_STATE: const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  ADD_BEFORE_CHAT_SECTION:
```typescript
<TideContextCalendar
  onDateSelect={(date) => {
    setSelectedDate(date);
    // Switch chat context to selected date
    chatActions.loadConversationForDate(date);
  }}
  selectedDate={selectedDate}
  viewMode="weekly"
/>
```
```

### BACKEND

### 🔒 Security Issue Resolution
**Priority:** P0 - Security Critical
**Backend Engineer Decision Required:** ACID compliance vs eventual consistency

**Commands for AI Agent (Security Only - Safe to Implement):**
```typescript
// 1. Remove API key exposure (SAFE - Security improvement)
EDIT apps/mobile/src/services/authService.ts:
  FIND: console.log('[DEBUG] Full API key details:', {
    fullToken: apiKey,
    // ... entire debug block
  });
  REPLACE: // DEBUG: API key validation successful (key details redacted for security)

// 2. Add request ID tracing (SAFE - Debugging improvement)  
EDIT apps/server/src/index.ts:
  FIND: export default {
    fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
  REPLACE: export default {
    fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
      const requestId = crypto.randomUUID();
      const url = new URL(request.url);
      if (env.ENVIRONMENT === 'development') {
        console.log(`[${requestId}] ${request.method} ${url.pathname}`);
      }

// 3. Add health check endpoint (SAFE - Monitoring improvement)
EDIT apps/server/src/index.ts:
  FIND: const url = new URL(request.url);
  ADD_AFTER: 
```typescript
// Health check endpoint
if (url.pathname === "/health" && request.method === "GET") {
  return new Response(JSON.stringify({
    status: "healthy",
    environment: env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    version: "1.6.0"
  }), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
```
```

### 🏗️ Agent Context Architecture (Backend Engineer Input Needed)
**Priority:** P0 - Architecture Decision Required
**Question for Backend Engineer:** User-scoped vs shared agent pattern?

**Option A: User-Scoped Agents (Current Pattern - Recommended)**
```typescript
// Pros: Isolated state, better security, easier debugging
// Cons: More memory usage, potential cold starts
// Implementation: Fix agent initialization to receive user context
```

**Option B: Shared Agents with Context Passing**  
```typescript
// Pros: Lower memory usage, faster responses
// Cons: Complex context management, potential state leaks
// Implementation: Pass user context per request
```

**Commands for AI Agent (Once Backend Engineer Decides):**
```typescript
// If Option A (User-Scoped):
EDIT apps/agents/tide-productivity-agent/agent.ts:
  FIND: userId: 'system', // Default, overridden per request
  REPLACE: userId: userContext.userId, // Received during instantiation

// If Option B (Shared):  
EDIT apps/agents/tide-productivity-agent/agent.ts:
  ADD_METHOD: 
```typescript
setUserContext(userContext: UserContext) {
  this.userId = userContext.userId;
  this.userScope = userContext;
  // Reinitialize services with user context
}
```
```

---

## P1 - HIGH PRIORITY

### FRONTEND

### ⚡ React Native Performance Fixes
**Priority:** P1 - Performance Enhancement
**Time Estimate:** 2 hours
**Files:** `apps/mobile/src/context/ChatContext.tsx`, `apps/mobile/src/context/MCPContext.tsx`

**Commands for AI Agent:**
```typescript
// 1. Fix AgentService re-configs with useMemo
EDIT apps/mobile/src/context/ChatContext.tsx:
  FIND: const agentService = new AgentService({
  REPLACE: const agentService = useMemo(() => new AgentService({
    // existing config
  }), [/* add dependencies here - likely authToken, serverUrl */]);

// 2. Memoize URL provider  
EDIT apps/mobile/src/context/MCPContext.tsx:
  FIND: const getServerUrl = () => {
  REPLACE: const getServerUrl = useCallback(() => {
    // existing logic
  }, [serverEnvironment, fallbackUrl]); // Add appropriate dependencies

// 3. Optimize tool menu rendering
EDIT apps/mobile/src/components/tools/ToolMenu.tsx:
  ADD_IMPORT: import { memo, useCallback } from 'react';
  WRAP_EXPORT: export default memo(ToolMenu);
  MEMOIZE_HANDLERS: 
```typescript
const renderTool = useCallback(({ item }) => (
  <ToolButton tool={item} onPress={handleToolPress} />
), [handleToolPress]);
```
```

### BACKEND

### 🧪 Critical Test Coverage Recovery
**Priority:** P1 - Code Quality Critical
**Files:** `apps/server/tests/tide-context.test.ts`, `apps/server/tests/tide-hierarchical-flow.test.ts`

**Backend Engineer Task:**
- **Current Coverage:** tide-context.ts (3.17%), tide-hierarchical-flow.ts (2.27%)
- **Target Coverage:** 90%+ for production readiness
- **Failed Tests:** 22 failing in suite

**Test Scenarios Needed:**
1. Context switching between daily/weekly/monthly tides
2. Auto-creation of hierarchical context tides  
3. Agent service error handling and degradation modes
4. Database transaction rollback scenarios

### 🏗️ Database Transaction Strategy (Backend Engineer Decision)
**Priority:** P1 - Data Integrity Critical

**Current Pattern Analysis:**
```javascript
// Non-atomic pattern (eventual consistency):
await d1Statement.run();        // D1 insert
await this.r2.putObject();     // R2 insert - can fail independently  
await analyticsStatement.run(); // Analytics insert - can fail independently
```

**Context7 Research Shows D1 Supports Atomic Batches:**
```javascript
// Atomic pattern (ACID compliant):
const batch = this.db.batch([
  d1Statement,
  analyticsStatement
]);
await batch; // Atomic D1 operations
await this.r2.putObject(); // Only after D1 success
```

**Backend Engineer Decision Required:**
- Use atomic D1 batch operations for critical data integrity?
- Keep current pattern for better error granularity?

---

## P2 - MEDIUM PRIORITY

### FRONTEND

### 🎨 Tool Action Buttons Enhancement
**Priority:** P2 - UX Polish  
**Time Estimate:** 3 hours
**Files:** `apps/mobile/src/components/chat/MessageBubble.tsx`

**Commands for AI Agent:**
```typescript
// 1. Add tool action buttons below agent responses
EDIT apps/mobile/src/components/chat/MessageBubble.tsx:
  ADD_AFTER_MESSAGE_CONTENT:
```typescript
{message.role === 'assistant' && message.suggestedTools && (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
    {message.suggestedTools.map((tool) => (
      <TouchableOpacity
        key={tool.name}
        onPress={() => onToolAction?.(tool)}
        style={{
          backgroundColor: tokens.colors.primary + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          marginRight: 8,
          marginBottom: 4
        }}
      >
        <Text variant="small" color="primary">
          {tool.displayName || tool.name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

// 2. Create tool action interface
ADD_TO apps/mobile/src/types/chat.ts:
```typescript
export interface ToolAction {
  name: string;
  displayName?: string;
  prefillParams?: Record<string, any>;
}

export interface ChatMessage {
  // existing properties
  suggestedTools?: ToolAction[];
}
```
```

### 🔄 Network Resilience Enhancement
**Priority:** P2 - Reliability Improvement
**Time Estimate:** 2 hours  
**Files:** `apps/mobile/src/hooks/useNetworkResilience.ts`

**Commands for AI Agent:**
```typescript
// 1. Create network detection hook
CREATE apps/mobile/src/hooks/useNetworkResilience.ts:
CONTENT:
```typescript
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-netinfo/netinfo';
import { useMCP } from '../context/MCPContext';

export const useNetworkResilience = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { reconnect, connectionStatus } = useMCP();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;
      
      setIsOnline(isNowOnline);
      
      // Auto-reconnect when coming back online
      if (wasOffline && isNowOnline && connectionStatus !== 'connected') {
        reconnect();
      }
    });

    return unsubscribe;
  }, [isOnline, connectionStatus, reconnect]);

  const manualRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    reconnect();
  }, [reconnect]);

  return {
    isOnline,
    retryCount,
    manualRetry,
    canRetry: !isOnline || connectionStatus === 'error'
  };
};
```

// 2. Add to Home screen
EDIT apps/mobile/src/screens/Main/Home.tsx:
  ADD_IMPORT: import { useNetworkResilience } from '../../hooks/useNetworkResilience';
  ADD_HOOK: const { isOnline, manualRetry, canRetry } = useNetworkResilience();
  ADD_UI_INDICATOR: 
```typescript
{!isOnline && (
  <View style={{ backgroundColor: tokens.colors.error, padding: 8 }}>
    <Text color="onError" variant="small">
      Offline - Some features may be limited
    </Text>
  </View>
)}
```
```

### 🚀 Enhanced Loading States
**Priority:** P2 - UX Polish
**Time Estimate:** 1 hour
**Files:** `apps/mobile/src/components/Loading.tsx`, `apps/mobile/src/context/MCPContext.tsx`

**Commands for AI Agent:**
```typescript
// 1. Create contextual loading component
EDIT apps/mobile/src/design-system/components/Loading.tsx:
  ADD_PROPS: 
```typescript
interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  context?: 'health-check' | 'tool-execution' | 'agent-thinking';
}
```
  ADD_CONTEXT_MESSAGES:
```typescript
const getContextMessage = (context?: string): string => {
  switch (context) {
    case 'health-check': return 'Connecting to server...';
    case 'tool-execution': return 'Processing tide data...';
    case 'agent-thinking': return 'AI is analyzing...';
    default: return 'Loading...';
  }
};
```

// 2. Integrate contextual loading in MCP operations
EDIT apps/mobile/src/context/MCPContext.tsx:
  ADD_LOADING_STATES: 
```typescript
const [loadingStates, setLoadingStates] = useState({
  healthCheck: false,
  toolExecution: false,
  connecting: false
});
```
```

---

## P3 - LOW PRIORITY

### 🧪 Mobile Testing Protocol
**Commands for AI Agent:**
```bash
# 1. Performance validation
npm run test:mobile
npm run build:mobile:android
npm run build:mobile:ios

# 2. Environment connectivity tests  
# Run health checks against all environments
curl https://tides-001.mpazbot.workers.dev/health # prod
curl https://tides-002.mpazbot.workers.dev/health # staging
curl https://tides-003.mpazbot.workers.dev/health # dev

# 3. Mobile performance profiling
# NOTE: Manual testing required - ask user to run emulator
# Test React Native Performance Monitor with:
# - Tool autocomplete responsiveness
# - Calendar navigation smoothness
# - Agent proactivity delay (should be < 100ms)
```

### 📊 Success Metrics
**Measurable Outcomes:**
- **Agent Proactivity:** User trigger reduction >30% through context suggestions
- **Tool Discovery:** IDE-style autocomplete reduces tool lookup time >50%  
- **Navigation Speed:** Calendar date switching <100ms response time
- **Network Resilience:** Auto-reconnect success rate >95%

### 🎯 Mobile-First Implementation Priority
**Phase 1 (Immediate):** Environment fixes, security cleanup
**Phase 2 (This Sprint):** Agent proactivity, tool intellisense  
**Phase 3 (Next Sprint):** Calendar navigation, performance optimization

---

## AI Agent Execution Guidelines

**Context7 Research Requirements:**
- Query Cloudflare Workers SDK documentation before modifying server files
- Query React Native documentation before mobile optimizations
- Use MCP server patterns from Context7 `/cloudflare/mcp-server-cloudflare`

**Testing Protocol:**
1. All mobile changes: Test in development mode first
2. Backend changes: Coordinate with backend engineer
3. Environment changes: Test all URL endpoints before deployment

**Error Handling Philosophy:**
- **Mobile:** Graceful degradation with user-friendly messages
- **Backend:** Fail-fast for development, graceful for production
- **Security:** Never log sensitive data, always validate API keys server-side

This specification provides clear, actionable commands while respecting backend engineer decisions and prioritizing mobile UX improvements that support rather than override backend architecture.