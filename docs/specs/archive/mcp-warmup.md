// GREEN

# MCP Server Warm-up Specification

## Overview

This document describes the implementation of a server warm-up strategy to mitigate cold start delays when connecting to MCP servers hosted on Google Cloud.

## Problem Statement

- MCP servers hosted on Google Cloud experience significant cold start delays
- Initial connection times can reach up to 9 seconds when the server needs to spin up
- This creates a poor user experience, especially for first-time interactions
- Users may think the application is frozen or broken during long connection attempts

## Solution

Implement a proactive server warm-up mechanism that triggers on the home page load, ensuring servers are ready before users attempt to use them.

### Implementation Details

#### 1. Connection Timer Display

Add connection timing to the `Home.tsx` component to provide visibility into server response times:

- Displays connection time in seconds below the session ID
- Use accurate millisecond timing
- Shows time rounded to 1 decimal place (e.g., "2.3s")
- Resets when connection is closed

#### 2. Server Warm-up Utility

Created a dedicated warm-up utility that sends lightweight requests to wake servers:

**Features**:

- Sends minimal ping requests to trigger server initialization
- Supports both production and staging environments
- Runs asynchronously without blocking UI
- Silently handles errors (best-effort approach)
- Fires parallel requests to multiple environments

#### 3. Home Page Integration

Integrated warm-up calls into the home page lifecycle:

- Uses React `useEffect` to trigger on component mount
- Calls `warmUpAllServers()` immediately on page load
- Non-blocking - UI renders while warm-up happens in background

## Technical Considerations

### Request Format

The warm-up request uses a minimal JSON-RPC format:

```json
{
  "jsonrpc": "2.0",
  "id": "warmup",
  "method": "ping",
  "params": {}
}
```

### Error Handling

- Warm-up failures are logged but not surfaced to users
- The application continues to function normally even if warm-up fails
- Actual connection attempts will still work, just with potential cold start delay

### Performance Impact

- Minimal - only adds lightweight HTTP requests on home page load
- Requests are fire-and-forget (no waiting for responses)
- No impact on initial page render time

## Benefits

1. **Improved User Experience**: Reduces connection time from ~9s to typical response times
2. **Transparency**: Connection timer shows actual performance metrics
3. **Proactive**: Problems are solved before users encounter them
4. **Graceful Degradation**: Application works normally even if warm-up fails

## Future Considerations

1. **Caching Strategy**: Consider implementing a more sophisticated warm-up schedule
2. **Health Checks**: Could expand to include actual health status monitoring
3. **Analytics**: Track warm-up success rates and actual connection times
4. **Configuration**: Make warm-up behavior configurable via environment variables

## Deployment Notes

No special deployment considerations required. The warm-up feature:

- Works with existing API proxy setup
- Requires no server-side changes
- Is backward compatible with servers that don't recognize the ping method
