# Refactor Plan - UUID-Based Authentication Migration
*Generated: 2025-08-20 20:31:42*

## Initial State Analysis

### Current Architecture
- **API Key Format**: Custom `tides_{userId}_{randomId}` (52 chars)
- **Generation**: Complex random string generation with custom formatting
- **Registration**: Mobile app attempts server registration via `/register-api-key`
- **Storage**: Secure storage using key `"user_api_key"`
- **Validation**: Server expects complex format, validates against D1 database
- **References**: 66 occurrences across 11 files

### Problem Areas
1. **Complex Generation Logic** - 8+ lines for simple UUID task
2. **Failed Server Registration** - Blocking auth flow, causing network errors
3. **Format Mismatch** - Server/client expecting different key formats
4. **Over-Engineering** - Custom format when UUID suffices
5. **Maintenance Overhead** - Registration flow, error handling, retry logic

### Dependencies
- **External**: Supabase Auth (UUID source), Cloudflare KV (target validation)
- **Internal**: authService, mcpService, agentService, AuthContext, MCPContext
- **Storage**: SecureStorage, AsyncStorage

### Test Coverage
- **Current**: Auth flows tested, but API key generation not unit tested
- **Risk**: Medium - auth is critical but current tests should pass with UUID

## Refactoring Tasks

### Phase 1: Core Authentication Logic (LOW RISK)
- [ ] **Replace generateApiKey()** - Return `userId` instead of complex format
- [ ] **Remove registerApiKeyWithServer()** - Delete entire method (56 lines)
- [ ] **Update signUpWithEmail()** - Store UUID directly, skip registration
- [ ] **Update signInWithEmail()** - Store UUID directly, skip registration  
- [ ] **Simplify getApiKey()** - Return UUID or regenerate from user.id

### Phase 2: Storage Key Migration (MEDIUM RISK)
- [ ] **Update storage key** - Change `"user_api_key"` to `"user_uuid"` for clarity
- [ ] **Add migration logic** - Handle existing stored complex keys
- [ ] **Update SecureStorage calls** - All get/set/remove operations

### Phase 3: Service Integration Updates (MEDIUM RISK)
- [ ] **mcpService.ts** - Update header expectations, logging
- [ ] **agentService.ts** - Update API key handling
- [ ] **AuthContext.tsx** - Update state management types
- [ ] **MCPContext.tsx** - Update connection logic

### Phase 4: Type System Updates (LOW RISK)
- [ ] **authTypes.ts** - Update API key type definitions
- [ ] **api.ts** - Update request/response types
- [ ] **connection.ts** - Update connection state types

### Phase 5: UI and Debug Features (LOW RISK)
- [ ] **Settings.tsx** - Update debug key display format
- [ ] **Hooks** - Update useAuthStatus, useMCPConnection
- [ ] **Remove debug logging** - Clean up complex key generation logs

## Target Architecture

### Simplified Flow
```typescript
// BEFORE (Complex)
const apiKey = this.generateApiKey(userId);        // 8 lines of complexity
await this.registerApiKeyWithServer(apiKey, ...);  // 52 lines of complexity
await secureStorage.setItem("user_api_key", apiKey);

// AFTER (Simple) 
const uuid = userId;  // That's it!
await secureStorage.setItem("user_uuid", uuid);
```

### Data Flow
```gherkin
Given a user signs up through the React Native app
When Supabase generates a UUID for the user
Then the app stores the UUID directly in secure storage
And uses the UUID as the API key for all MCP requests
And the server validates the UUID against Cloudflare KV
```

## Validation Checklist

### Functionality Preservation
- [ ] All authentication flows work (sign up, sign in, sign out)
- [ ] MCP requests include proper UUID in headers
- [ ] Server can validate UUID format (simple string validation)
- [ ] Debug features work with UUID display
- [ ] Storage migration handles existing users

### Code Quality
- [ ] Remove all complex API key generation code (~60 lines)
- [ ] Remove server registration complexity (~52 lines) 
- [ ] Update all 66 API key references across 11 files
- [ ] No broken imports or references
- [ ] All tests passing
- [ ] TypeScript compilation clean

### Security
- [ ] UUID stored securely (same as before)
- [ ] No UUID logged in plain text
- [ ] Migration doesn't expose old keys
- [ ] Server validates UUID format properly

## De-Para Mapping

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| **API Key Format** | `tides_1c0ce35b-8f6d-40eb-b7ed-642149be1214_Ab3Fg7Kl9mN2` | `1c0ce35b-8f6d-40eb-b7ed-642149be1214` | Pending |
| **Generation Method** | `generateApiKey(userId)` | `userId` (direct) | Pending |
| **Registration** | `registerApiKeyWithServer(...)` | *(removed)* | Pending |
| **Storage Key** | `"user_api_key"` | `"user_uuid"` | Pending |
| **Header Format** | `Authorization: Bearer tides_...` | `Authorization: Bearer uuid` | Pending |
| **Server Validation** | D1 database lookup | Cloudflare KV lookup | Pending (Server-side) |

## Risk Assessment

### Low Risk Changes
- generateApiKey() replacement - pure function change
- Storage key updates - backward compatible with migration
- Type definition updates - compile-time checked

### Medium Risk Changes  
- Server registration removal - requires server-side KV setup
- Authentication flow changes - core functionality
- Header format changes - needs server coordination

### High Risk Mitigations
- **Git checkpoint** before starting
- **Incremental testing** after each phase
- **Rollback plan** if server integration fails
- **Debug key override** for testing

## Success Metrics

### Code Reduction
- **Lines Removed**: ~112 lines (generateApiKey + registerApiKeyWithServer)
- **Complexity Reduction**: 90% simpler auth flow
- **Files Simplified**: 11 files with cleaner API key handling

### Performance Improvements
- **No network registration** on auth (faster login/signup)
- **Simpler string operations** (UUID vs complex generation)
- **Reduced error handling** (no registration failures)

### Maintenance Benefits
- **Single source of truth** - Supabase UUID
- **No custom format maintenance** - standard UUID format
- **Simplified server logic** - KV lookup vs D1 queries
- **Cross-client consistency** - same UUID everywhere

## Next Steps

1. **Execute Phase 1** - Core auth logic replacement
2. **Test thoroughly** - Ensure auth flows work with UUID
3. **Coordinate server update** - KV-based validation implementation
4. **Deploy incrementally** - Mobile first, then server validation
5. **Monitor and validate** - Real-world UUID authentication

---

*Ready to proceed with Phase 1: Core Authentication Logic replacement?*