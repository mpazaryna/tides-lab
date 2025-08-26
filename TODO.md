# Tides Conversational Agent Implementation Specifications

## Overview

Transform Tides into a conversational productivity platform where users interact naturally with their flow sessions through intelligent agent communication and direct MCP tool access. Build upon existing Cloudflare Workers AI architecture for seamless, context-aware productivity management.

## Architecture Summary

- **Frontend**: React Native chat interface with MCP JSON-RPC 2.0 client
- **Backend**: Existing Cloudflare Workers MCP server + AI service integration
- **AI Models**: Cloudflare Workers AI (Mistral, Llama) for conversation and tool matching
- **Protocol**: MCP tools callable directly + agent mediation for complex flows
- **Context**: Flow-based conversation windows with full history persistence

---

## P0 - Core Conversational Agent Integration

### 1. Agent Communication Infrastructure

**User Story**: As a user, I want to communicate with an AI agent through message input so that I can manage my tides naturally through conversation.

**Technical Requirements**:

- Integrate existing `aiService.ts` with React Native chat interface
- Text-only conversation flow using Workers AI models
- JSON-RPC 2.0 message handling for agent responses
- Error handling with honest failure reporting

**Implementation Steps**:

1. Create `ChatContext.tsx` with conversation state management
2. Implement `AgentService.ts` wrapping existing AI service functionality
3. Add conversation persistence to MCP server
4. Create chat UI components using design system tokens

**Gherkin Scenarios**:

```gherkin
Feature: Agent Communication
  As a user I want to chat with an AI agent
  So that I can manage my productivity flows conversationally

  Scenario: User sends message to agent
    Given I am on the chat screen
    When I type "How productive was I today?" and send
    Then the agent responds with productivity analysis
    And the conversation is saved to current flow

  Scenario: Agent handles service failures gracefully
    Given the AI service is unavailable
    When I send a message to the agent
    Then the agent responds "I'm having trouble accessing my analysis tools right now. You can still use direct commands like '/tide list' to manage your flows manually."
    And the error is logged for debugging
```

### 2. Direct MCP Tool Access

**User Story**: As a user, I want to call MCP tools directly without agent mediation so that I have immediate access to all tide management functions.

**Technical Requirements**:

- All 8 existing MCP tools (`tide_create`, `tide_list`, `tide_flow`, etc.) callable via chat
- IDE IntelliSense-style autocomplete for tool discovery
- JSON-RPC 2.0 direct tool execution from React Native
- Tool result display in chat interface

**Implementation Steps**:

1. Create `ToolAutocomplete.tsx` component with fuzzy search
2. Implement direct MCP tool calling in `MCPService.ts`
3. Add tool result rendering in chat messages
4. Create slash command parser (`/tide`, `/energy`, etc.)

**Gherkin Scenarios**:

```gherkin
Feature: Direct MCP Tool Access
  As a user I want to call MCP tools directly
  So that I can quickly execute tide management commands

  Scenario: User discovers tools via autocomplete
    Given I am typing in the chat input
    When I type "/ti"
    Then I see autocomplete suggestions: "/tide create", "/tide list", "/tide flow"
    And I can arrow-navigate and select options

  Scenario: User executes MCP tool directly
    Given I have an active conversation
    When I type "/tide list" and press enter
    Then the MCP tool executes via JSON-RPC 2.0
    And the results display as formatted chat message
    And the tool call is logged in conversation history
```

### 3. Intelligent Tool Matching & Agent Mediation

**User Story**: As a user, I want the agent to intelligently route my requests to appropriate tools so that I don't need to memorize exact commands.

**Technical Requirements**:

- Fuzzy matching using Workers AI embeddings for intent recognition
- Agent decides between multiple matching tools
- Conversational tool parameter collection
- Fallback to direct suggestions when ambiguous

**Implementation Steps**:

1. Extend `aiService.ts` with tool intent classification
2. Create `ToolMatcher.ts` using BGE embeddings for semantic search
3. Implement conversational parameter collection flows
4. Add multi-tool disambiguation logic

**Gherkin Scenarios**:

```gherkin
Feature: Intelligent Tool Matching
  As a user I want natural language to map to appropriate tools
  So that I can interact conversationally without memorizing commands

  Scenario: Single tool match
    Given I am chatting with the agent
    When I say "start a new flow session"
    Then the agent recognizes intent for "tide_create"
    And executes the tool directly
    And confirms "Starting your new flow session now!"

  Scenario: Multiple tool match requires disambiguation
    Given I am chatting with the agent
    When I say "show me my data"
    Then the agent responds "I can show you several things: your tide list (/tide list), energy reports (/tide get_report), or task links (/tide list_task_links). Which would you like?"
    And provides clickable options for each tool

  Scenario: Agent collects missing parameters conversationally
    Given I want to create a tide but haven't provided details
    When I say "create a flow"
    Then the agent asks "What type of flow session? I can help you choose based on your current energy level of 7/10"
    And collects required parameters through conversation
```

---

## P1 - Advanced Flow Management

### 4. Hierarchical Flow Context System

**User Story**: As a user, I want my conversation context to automatically align with my current flow timeframe so that insights and recommendations are relevant to my current focus.

**Technical Requirements**:

- Flow contexts: Daily → Weekly → Monthly → Seasonal
- Automatic context switching based on user focus
- Conversation history persists across context switches
- Relevant flow data surfaced based on active context

**Implementation Steps**:

1. Design flow context data structure in MCP server
2. Implement context switching logic in `FlowContextManager.ts`
3. Modify agent prompts to include relevant timeframe data
4. Create context indicator UI in chat interface

**Gherkin Scenarios**:

```gherkin
Feature: Hierarchical Flow Context
  As a user I want conversation context to match my timeframe focus
  So that AI insights are relevant to my current planning horizon

  Scenario: User enters daily context
    Given I am planning my day
    When I say "How should I plan my work today?"
    Then the agent switches to daily context
    And provides suggestions based on today's energy patterns
    And shows recent daily flows for reference

  Scenario: Context cascades from daily to weekly
    Given I am in daily context
    When I ask "How does this week look overall?"
    Then the agent expands to weekly context
    And provides insights incorporating this week's daily patterns
    And maintains conversation history from daily context
```

### 5. Keyword & Phrase Mapping

**User Story**: As a user, I want specific keywords to automatically trigger relevant tide tools so that I can use natural shortcuts for common actions.

**Technical Requirements**:

- Fuzzy keyword matching using Workers AI embeddings
- Configurable keyword → tool mappings
- Context-aware keyword interpretation
- User-customizable phrase shortcuts

**Implementation Steps**:

1. Create `KeywordMatcher.ts` with embedding-based fuzzy matching
2. Implement keyword configuration in user preferences
3. Add keyword training from conversation patterns
4. Create keyword management UI

**Gherkin Scenarios**:

```gherkin
Feature: Keyword & Phrase Mapping
  As a user I want keywords to trigger specific tools
  So that I can use natural shortcuts for common actions

  Scenario: Productivity keywords trigger analysis
    Given I have keyword mappings configured
    When I say "productivity" or "how did I do" or "performance"
    Then the agent automatically runs productivity analysis
    And displays insights without requiring explicit tool calls

  Scenario: Flow keywords start sessions
    Given I am ready to work
    When I say "focus time" or "deep work" or "flow session"
    Then the agent starts a new tide session
    And suggests optimal duration based on energy level
```

### 6. Retroactive Flow Closure

**User Story**: As a user, I want to close flows retroactively with accurate timestamps so that my productivity data reflects reality when I forget to close sessions.

**Technical Requirements**:

- Detect abandoned flows (app closed, long inactivity)
- UI for retroactive timestamp assignment
- Conversation prompts for closure notes
- Flow metadata completion ("what got accomplished", "how did you feel")

**Implementation Steps**:

1. Implement flow abandonment detection in `FlowManager.ts`
2. Create retroactive closure UI modal/screen
3. Add conversation-based metadata collection
4. Integrate with existing MCP flow management tools

**Gherkin Scenarios**:

```gherkin
Feature: Retroactive Flow Closure
  As a user I want to close flows with accurate past timestamps
  So that my data reflects when work actually ended

  Scenario: User returns after abandoning flow
    Given I started a flow 2 days ago
    And I closed the app without ending the flow
    When I return to the app
    Then the agent says "I notice you have an open flow from 2 days ago. When did that session actually end?"
    And provides time selection options (2 hours ago, yesterday 5pm, etc.)

  Scenario: Retroactive closure with reflection
    Given I am closing a flow retroactively
    When I select "yesterday at 5pm" as end time
    Then the agent asks "What did you accomplish in that session?"
    And "How did you feel about the work quality?"
    And saves responses as flow metadata
```

---

## P2 - Enhanced User Experience

### 7. IDE-Style Autocomplete System

**User Story**: As a user, I want intelligent autocomplete like in an IDE so that I can discover and execute commands efficiently.

**Technical Requirements**:

- Real-time autocomplete with fuzzy search
- Context-aware suggestions based on conversation
- Tool parameter hints and documentation
- Keyboard navigation (arrow keys, tab completion)

**Implementation Steps**:

1. Create `AutocompleteEngine.ts` with fuzzy search algorithms
2. Implement suggestion ranking based on usage patterns
3. Add tool documentation integration
4. Create keyboard navigation handlers

### 8. Enhanced Visual Design

**User Story**: As a user, I want a polished chat interface that feels natural and informative so that I enjoy using the conversational features.

**Technical Requirements**:

- Gradient background scroll effects
- Section dividers between tool results
- Optimized spacing and typography
- Priority highlighting for important tools/flows
- Tide management in top menu integration

**Implementation Steps**:

1. Update chat UI components with design system
2. Implement gradient scroll effects
3. Add contextual tool result formatting
4. Integrate tide management in navigation

---

## P3 - Future Enhancements

### 9. Project-Based Flow Management

**User Story**: As a user, I want to organize flows by projects so that I can track productivity across different work streams.

**Technical Requirements**:

- Project categorization for flows
- Cross-project analytics and insights
- Project-specific conversation contexts
- Team collaboration features (future)

---

## Technical Implementation Details

### MCP Integration Architecture

```typescript
// Chat message handling with MCP integration
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCall?: MCPToolCall;
  timestamp: string;
  flowId: string;
}

interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}
```

### Flow Context Data Structure

```typescript
interface FlowContext {
  id: string;
  type: "daily" | "weekly" | "monthly" | "seasonal";
  startTime: string;
  endTime?: string;
  conversationHistory: ChatMessage[];
  tidesMetadata: TideSession[];
  userPreferences: FlowPreferences;
  closed: boolean;
  retroactiveClosure?: {
    actualEndTime: string;
    accomplishments: string;
    reflection: string;
  };
}
```

### AI Service Integration

Extend existing `aiService.ts` with:

- Conversation context management
- Tool intent classification using embeddings
- Fuzzy keyword matching
- Conversation memory for flow contexts

### React Native Implementation

Key components to develop:

- `ChatInterface.tsx` - Main conversation UI
- `ToolAutocomplete.tsx` - IDE-style command completion
- `FlowContextIndicator.tsx` - Visual context display
- `RetroactiveFlowClosure.tsx` - Flow closure management
- `MessageBubble.tsx` - Enhanced message display with tool results

### Error Handling Strategy

- Network failures: Cache last known state, provide offline tool access
- AI service failures: Fall back to direct MCP tool execution with helpful guidance
- Tool execution failures: Agent explains what went wrong and suggests alternatives
- Context corruption: Graceful degradation with conversation history preservation

---

## Definition of Done

### P0 Completion Criteria

- [ ] Agent responds to messages using existing Workers AI integration
- [ ] All 8 MCP tools callable directly via chat interface
- [ ] Fuzzy tool matching works for natural language input
- [ ] Conversation history persists within flows
- [ ] Error handling provides clear user feedback

### P1 Completion Criteria

- [ ] Flow contexts switch automatically based on user timeframe focus
- [ ] Keywords trigger appropriate tools with 90%+ accuracy
- [ ] Retroactive flow closure UI functional with metadata collection
- [ ] IDE-style autocomplete provides relevant suggestions

### Testing Strategy

- Unit tests for AI service integration and tool matching
- Integration tests for MCP tool execution via chat
- User testing for conversation flow and error handling
- Performance testing for autocomplete responsiveness

### Monitoring & Analytics

- Track conversation → tool execution success rates
- Monitor AI service performance and fallback usage
- Measure user engagement with different conversation patterns
- Analyze flow context switching patterns for optimization

---

_This specification provides clear, actionable implementation guidance while building on existing architecture and leveraging researched best practices from React Native, MCP, and conversational AI patterns._
