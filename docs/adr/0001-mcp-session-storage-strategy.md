# ADR 0001: MCP Session Storage vs Auth Session Storage

Date: 2025-08-03

## Status

Draft

## Context

The Tides mobile app currently manages two types of session state:

### Current Auth Session Implementation

- **Storage**: AsyncStorage for JWT token persistence, SecureStorage for API keys
- **State Management**: AuthContext tracks user, session, loading, and apiKey
- **Lifecycle**: Persistent across app restarts via AsyncStorage
- **Security**: API keys stored in SecureStorage, JWT handled by Supabase client

### Current MCP "Session" Implementation

- **Storage**: No persistent storage - state exists only in MCPContext memory
- **State Management**: MCPContext tracks connection status, tides list, selectedTide
- **Lifecycle**: Ephemeral - resets on app restart, rebuilt via API calls on reconnection
- **Connection**: Uses AuthService.workerUrl and apiKey for HTTP requests to MCP server

### The Decision Question

Should we:

1. **Extend Auth session storage** to include MCP session data (tides, connection preferences)
2. **Create separate MCP session storage** with its own persistence layer
3. **Keep current approach** with ephemeral MCP state

Key considerations:

- Tides data is already stored server-side and fetched via API calls
- Connection status is derived from API connectivity, not stored state
- User preferences for server URL are stored in AsyncStorage via AuthService
- MCP "session" is more about cached API data than true session state

## Decision

We will **implement dedicated MCP session storage** with persistent data caching:

1. **Auth Session Storage (unchanged)**: Continue using AsyncStorage/SecureStorage for authentication
2. **MCP Session Storage (new)**: Add persistent storage for MCP data and user preferences

Architecture:

```typescript
// Auth Session (unchanged)
- AsyncStorage: JWT tokens, server URL preferences
- SecureStorage: API keys
- AuthContext: user, session, loading, apiKey

// MCP Session Storage (new)
- AsyncStorage: cached tides list, flow sessions, user preferences
- In-memory: active connection status, real-time state
- Cache invalidation: timestamp-based with server sync
- MCPContext: hybrid local/remote data management
```

**Rationale**: Mobile apps require fast startup and offline viewing capabilities. Persistent MCP data storage enables instant tide list display and better user experience on poor connections.

## Consequences

### Positive

1. **Superior Mobile UX**

   - Instant app startup with cached tide data
   - Offline viewing of tide history and flow sessions
   - Smooth experience on poor network connections
   - Background sync when connectivity returns

2. **Performance Benefits**

   - Fast initial render with cached data
   - Reduced API calls for frequently accessed data
   - Smart cache invalidation prevents stale data
   - Optimistic updates for better responsiveness

3. **Offline Capabilities**
   - View complete tide history offline
   - Browse flow sessions and energy data
   - Draft new tides for sync when online
   - Graceful degradation with clear offline indicators

### Negative

1. **Storage Complexity**

   - Need cache invalidation strategy
   - Potential for data inconsistency
   - Additional storage management logic
   - Sync conflict resolution

2. **Storage Usage**
   - Increased AsyncStorage consumption
   - Need cleanup strategies for old data
   - Potential performance impact with large datasets

### Mitigations

1. **For Storage Complexity**:

   - Use timestamp-based cache invalidation (`last_sync`, `cache_expires_at`)
   - Implement atomic sync operations to prevent partial state corruption
   - Add data versioning for conflict resolution
   - Use optimistic updates with rollback on sync failure

2. **For Storage Usage**:
   - Implement LRU cache with size limits
   - Regular cleanup of expired cache entries
   - User preference for cache size/retention
   - Monitor AsyncStorage usage and optimize

## Implementation Notes

### New MCP Session Storage System

```typescript
interface MCPCacheEntry<T> {
  data: T;
  timestamp: number;
  expires_at: number;
  version: string;
}

interface MCPSessionStorage {
  // Cached tide data
  tides: MCPCacheEntry<Tide[]>;
  selectedTideId?: string;
  
  // User preferences
  preferences: {
    defaultFlowType?: 'daily' | 'weekly' | 'project' | 'seasonal';
    preferredIntensity?: 'gentle' | 'moderate' | 'strong';
    cacheRetentionDays: number;
  };
  
  // Sync metadata
  lastSyncTimestamp: number;
  pendingOperations: PendingOperation[];
}

// AsyncStorage keys
- 'mcp_session_data': Main cache data
- 'mcp_sync_queue': Pending operations for offline sync
- 'mcp_user_preferences': User settings
```

### Required Changes

1. **MCPContext Updates**:
   - Add cache loading on app startup
   - Implement cache invalidation logic
   - Handle offline/online sync operations
   - Manage pending operations queue

2. **New MCPStorageService**:
   - AsyncStorage wrapper with cache management
   - Timestamp-based expiration
   - Optimistic update patterns
   - Sync conflict resolution

## Related Decisions

- Tide data storage format (see ADR 0002)
- Server-side JSONB storage strategy
- Offline capabilities roadmap

## References

- Current implementation in `src/context/AuthContext.tsx`
- Current implementation in `src/context/MCPContext.tsx`
- MCP service in `src/services/mcpService.ts`
- Server-side storage in `supabase-tides-demo-1/src/storage/index.ts`
