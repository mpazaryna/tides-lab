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

## 📱 Interactive Chat Demo (For iOS Team)

### 🌐 **Web Chat Demo** - `../../demo/chat/` (Recommended)
**Best for iOS developers - Visual, interactive chat interface**

```bash
cd ../../demo/chat/
python3 -m http.server 8080
# Open: http://localhost:8080
```

**Features:**
- ✅ **Mobile-like interface** - Chat bubbles, suggestions, responsive design
- ✅ **Real API integration** - See actual network requests in browser DevTools
- ✅ **Environment switching** - Test against 101/102/103 environments
- ✅ **Developer tools** - JSON response viewer, cURL export
- ✅ **No setup required** - Just open HTML file in browser

**Why better than terminal:**
- Shows what the mobile chat should look like
- iOS developers can inspect network requests (F12)
- Interactive suggestions and conversation flow
- Works on mobile devices for testing

### ⚠️ Legacy Terminal Demos (Deprecated)
~~Terminal-based chat interfaces moved to `legacy/` folder~~

**Use the web demo instead** - it provides a much better representation of the mobile chat experience.

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