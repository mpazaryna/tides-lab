# Tides TODOS

## P0 - Critical

### 1. [FRONTEND] Agent Proactivity
**Priority:** P0 - User Experience Critical  
**Time Estimate:** 4 hours  
**Files:** `apps/mobile/src/context/ChatContext.tsx`, `apps/mobile/src/services/agentService.ts`

**Problem:** Agent requires explicit commands for tide tool access  
**Solution:** Implement context-aware tool suggestion system

**Implementation:**

```typescript
// 1. Create proactive suggestion hook
CREATE apps/mobile/src/hooks/useProactiveAgent.ts:
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
    const interval = setInterval(analyzeContext, 60000);
    return () => clearInterval(interval);
  }, [analyzeContext]);

  return { analyzeContext };
};

// 2. Integrate into ChatContext
EDIT apps/mobile/src/context/ChatContext.tsx:
  ADD_IMPORT: import { useProactiveAgent } from '../hooks/useProactiveAgent';
  ADD_IN_PROVIDER: const { analyzeContext } = useProactiveAgent();
```

### 2. [FRONTEND] IDE-Style Tool Autocomplete
**Priority:** P0 - Developer Experience Critical  
**Time Estimate:** 6 hours  
**Files:** `apps/mobile/src/components/chat/ChatInput.tsx`, `apps/mobile/src/components/tools/ToolAutocomplete.tsx`

**Problem:** No IDE-like autocomplete for MCP tools  
**Solution:** Implement tool parameter completion with documentation

**Implementation:**
```typescript
// 1. Create tool autocomplete component
CREATE apps/mobile/src/components/chat/ToolAutocomplete.tsx:
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

// 2. Integrate autocomplete into ChatInput
EDIT apps/mobile/src/components/chat/ChatInput.tsx:
  ADD_IMPORT: import { ToolAutocomplete } from './ToolAutocomplete';
  ADD_STATE: const showAutocomplete, setShowAutocomplete = useState(false);
  ADD_EFFECT: 
useEffect(() => {
  const shouldShow = inputText.includes('/') && inputText.length > 1;
  setShowAutocomplete(shouldShow);
}, [inputText]);
  ADD_BEFORE_RETURN: 
<ToolAutocomplete
  inputText={inputText}
  onToolSelect={(tool, params) => {
    setInputText(`/${tool} ${JSON.stringify(params, null, 2)}`);
    setShowAutocomplete(false);
  }}
  visible={showAutocomplete}
/>
```

### 3. [FRONTEND] Tide Context Calendar Navigation
**Priority:** P0 - Core Workflow Feature  
**Time Estimate:** 8 hours
**Files:** `apps/mobile/src/components/tides/TideContextCalendar.tsx`, `apps/mobile/src/screens/Main/Home.tsx`

**Problem:** No visual navigation between conversation contexts  
**Solution:** Calendar interface with conversation history markers

**Implementation:**
```typescript
// 1. Create context calendar component
CREATE apps/mobile/src/components/tides/TideContextCalendar.tsx:
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


// 2. Integrate calendar into Home screen  
EDIT apps/mobile/src/screens/Main/Home.tsx:
  ADD_IMPORT: import { TideContextCalendar } from '../../components/tides/TideContextCalendar';
  ADD_STATE: const selectedDate, setSelectedDate = useState(new Date().toISOString().split('T')[0]);
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

### 4. [BACKEND] Security Hardening
**Priority:** P0 - Security Critical  
**Files:** `apps/mobile/src/services/authService.ts`, `apps/server/src/index.ts`

**Problem:** API key exposure in logs, missing request tracing  
**Solution:** Remove sensitive logging, add request IDs, health endpoints

**Implementation:**
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

### 5. [BACKEND] Agent Architecture Decision
**Priority:** P0 - Backend Engineering Decision Required  
**Files:** `apps/agents/tide-productivity-agent/agent.ts`

**Problem:** Agent initialization pattern undefined  
**Decision Required:** User-scoped vs shared agent architecture

**Options:**

**Option A: User-Scoped Agents (Recommended)**

- ✅ Isolated state, better security, easier debugging
- ❌ Higher memory usage, potential cold starts
- Implementation: Fix agent initialization to receive user context

**Option B: Shared Agents with Context Passing**

- ✅ Lower memory usage, faster responses
- ❌ Complex context management, potential state leaks
- Implementation: Pass user context per request

**Implementation (pending decision):**

```typescript
// Option A: User-scoped
EDIT apps/agents/tide-productivity-agent/agent.ts:
  userId: userContext.userId, // Received during instantiation

// Option B: Shared
setUserContext(userContext: UserContext) {
  this.userId = userContext.userId;
  this.userScope = userContext;
}
```

---

## P1 - High Priority


### 6. [FRONTEND] React Native Performance Fixes
**Priority:** P1 - Performance Enhancement
**Time Estimate:** 2 hours
**Files:** `apps/mobile/src/context/ChatContext.tsx`, `apps/mobile/src/context/MCPContext.tsx`

**Problem:** Unnecessary service re-instantiation causing performance issues  
**Solution:** Memoize service instances and optimize rendering

**Implementation:**
```typescript
// 1. Memoize AgentService instances
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

### 7. [BACKEND] Critical Test Coverage Recovery
**Priority:** P1 - Code Quality Critical  
**Files:** `apps/server/tests/tide-context.test.ts`, `apps/server/tests/tide-hierarchical-flow.test.ts`

**Status:** Critical test failures affecting production readiness

- Current coverage: tide-context.ts (3.17%), tide-hierarchical-flow.ts (2.27%)
- Target: 90%+ coverage
- 22 failing tests in suite

**Required Test Scenarios:**

1. Context switching between daily/weekly/monthly tides
2. Auto-creation of hierarchical context tides
3. Agent service error handling and degradation modes
4. Database transaction rollback scenarios

### 8. [BACKEND] Database Transaction Strategy
**Priority:** P1 - Data Integrity Critical  
**Files:** `apps/server/src/services/databaseService.ts`

**Problem:** Non-atomic operations create data inconsistency risk  
**Decision Required:** ACID compliance vs eventual consistency

**Current Pattern (Eventual Consistency):**

```javascript
await d1Statement.run();        // D1 insert
await this.r2.putObject();     // R2 insert - can fail independently
await analyticsStatement.run(); // Analytics insert - can fail independently
```

**Proposed Pattern (ACID Compliant):**

```javascript
const batch = this.db.batch([
  d1Statement,
  analyticsStatement
]);
await batch; // Atomic D1 operations
await this.r2.putObject(); // Only after D1 success
```

**Decision Required:** Atomic batches for critical data integrity vs current pattern for error granularity

---

## P2 - MEDIUM PRIORITY

### 9. [FRONTEND] Tool Action Buttons Enhancement
**Priority:** P2 - UX Polish  
**Time Estimate:** 3 hours
**Files:** `apps/mobile/src/components/chat/MessageBubble.tsx`

**Problem:** No quick actions for suggested tools in chat  
**Solution:** Add interactive tool buttons below agent responses

**Implementation:**
```typescript
// 1. Add tool action buttons
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

### 10. [FRONTEND] Network Resilience Enhancement
**Priority:** P2 - Reliability Improvement
**Time Estimate:** 2 hours  
**Files:** `apps/mobile/src/hooks/useNetworkResilience.ts`

**Problem:** No network state detection or auto-reconnection  
**Solution:** Network monitoring with automatic MCP reconnection

**Implementation:**
```typescript
// 1. Create network resilience hook
CREATE apps/mobile/src/hooks/useNetworkResilience.ts:
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


### 11. [FRONTEND] Enhanced Loading States
**Priority:** P2 - UX Polish
**Time Estimate:** 1 hour
**Files:** `apps/mobile/src/components/Loading.tsx`, `apps/mobile/src/context/MCPContext.tsx`

**Problem:** Generic loading states provide no context  
**Solution:** Context-aware loading messages for better UX

**Implementation:**
```typescript
// 1. Enhance Loading component with context
EDIT apps/mobile/src/design-system/components/Loading.tsx:
  ADD_PROPS: 
```typescript
interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  context?: 'health-check' | 'tool-execution' | 'agent-thinking';
}
  ADD_CONTEXT_MESSAGES:
const getContextMessage = (context?: string): string => {
  switch (context) {
    case 'health-check': return 'Connecting to server...';
    case 'tool-execution': return 'Processing tide data...';
    case 'agent-thinking': return 'AI is analyzing...';
    default: return 'Loading...';
  }
};

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

