# E2E Test Scripts & Demos

## 🚀 Unified API Testing (Recommended)

### `api-test.sh` - One Script for All Testing
**Primary testing tool - replaces all individual curl scripts**

```bash
# Basic usage
./api-test.sh ENV SERVICE [OPTIONS]

# Examples
./api-test.sh 102 insights                    # Test insights on staging
./api-test.sh 103 optimize --timeframe=30d    # Test optimize with custom timeframe
./api-test.sh 102 questions --question="How productive was I?"
./api-test.sh 102 r2-test --path="users/.../tide_123.json"
```

**Environments:**
- `101` - Production (tides-001-storage)
- `102` - Staging (tides-006-storage) 
- `103` - Development (tides-003-storage)

**Services:**
- `insights`, `optimize`, `questions`, `preferences`, `reports`, `chat`, `r2-test`

**Features:**
- ✅ **Centralized config** - All API keys and endpoints in one place
- ✅ **Multi-environment** - Test across all environments easily  
- ✅ **Consistent output** - Standardized test results and metrics
- ✅ **Flexible options** - Custom parameters per service
- ✅ **TDD support** - Direct R2 testing with `r2-test` service

## Interactive Chat Demos (For UI Team)

### 🎯 `chat-demo.sh` - Simple Interactive CLI
**Best for quick demos and UI team testing**

```bash
./e2e/chat-demo.sh
```

Features:
- Simulates iOS app conversation flow
- Number shortcuts for suggestions (type 1, 2, or 3)
- Maintains conversation context
- Shows which service handled the request
- Clean, minimal interface

Example flow:
1. Type: "How am I doing?"
2. See suggestions, type: "1" (for "View productivity insights")
3. Get clarification or actual data

Commands:
- `quit` - Exit
- `new` - Start new conversation
- `1-3` - Select suggestion

### 📱 `chat-cli.sh` - Full Featured CLI
**More comprehensive iOS app simulation**

```bash
./e2e/chat-cli.sh
```

Features:
- Full color coding and formatting
- Displays full service responses (insights, optimization, etc.)
- Shows confidence scores and service routing
- Fold text for better readability

## ⚠️ Legacy Service Test Scripts (Deprecated)

### Individual Service Tests (Use `api-test.sh` instead)
~~Test each service with real R2 data:~~

```bash
# DEPRECATED - Use api-test.sh instead
./e2e/curl-insights.sh    # ➡️  ./api-test.sh 103 insights  
./e2e/curl-optimize.sh    # ➡️  ./api-test.sh 103 optimize
./e2e/curl-questions.sh   # ➡️  ./api-test.sh 103 questions
./e2e/curl-preferences.sh # ➡️  ./api-test.sh 103 preferences
```

**Migration Examples:**
- `./curl-insights.sh` → `./api-test.sh 103 insights`
- `./curl-insights-006.sh` → `./api-test.sh 102 insights`

### Service Inference Test
Test automatic service routing without specifying service:

```bash
./e2e/curl-inference.sh   # Tests chat agent & service inference
```

## Demo Scripts

### Conversation Flow Demos
Show the multi-turn conversation workflow:

```bash
./e2e/demo-conversation-flow.sh  # Shows 2-step conversation
./e2e/demo-ideal-flow.sh        # Shows ideal routing behavior
```

## Key Concepts for UI Team

### Response Structure
When `needs_clarification: true`:
```json
{
  "data": {
    "needs_clarification": true,
    "message": "Clarifying question...",
    "suggestions": ["Option 1", "Option 2", "Option 3"],
    "conversation_id": "conv_xxx"
  }
}
```

### Mobile App Implementation
```javascript
if (response.data.needs_clarification) {
  // Show chat UI with suggestions
  showMessage(response.data.message);
  showSuggestionButtons(response.data.suggestions);
  saveConversationId(response.data.conversation_id);
} else {
  // Show actual service data
  displayServiceData(response.data);
}
```

### Conversation Threading
Always include `conversation_id` in follow-up requests to maintain context.

## Testing Workflow

1. **Start with chat-demo.sh** - Quick interactive testing
2. **Test ambiguous queries** - See chat agent clarifications
3. **Select suggestions** - Type 1, 2, or 3
4. **Test clear queries** - "Show my productivity insights"
5. **Check service routing** - Note which service handles each request

## Current Behavior Notes

- Service inferrer is conservative (50% confidence threshold)
- Clear requests may still go to chat for clarification
- All services use real R2 mock data (no fallbacks)
- Chat agent uses Llama 3.1 8B for natural clarifications