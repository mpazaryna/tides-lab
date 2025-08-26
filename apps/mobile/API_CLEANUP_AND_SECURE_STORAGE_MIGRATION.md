# API Reference Cleanup & SecureStorage Migration Plan

This document outlines the remaining work to complete the authentication migration from API keys to UUID auth tokens, including cleanup of remaining API references and preparation for SecureStorage migration.

## Phase 1: API Reference Cleanup

### Overview
Most "API" references in the codebase are legitimate (referring to application programming interfaces), but some still reference the old "API key" authentication system and need updating.

### Files Requiring Updates

#### 1. **screens/Main/Settings.tsx** (2 updates)
**Current Issues:**
- Line 255: `"No API key available"` - user-facing error message
- Line 276: `"Mobile clients use custom API keys for enhanced security"` - outdated help text

**Required Changes:**
```typescript
// Line 255: Change error message
- "No API key available"
+ "No auth token available"

// Line 276: Update help text
- "Mobile clients use custom API keys for enhanced security."
+ "Mobile clients use UUID auth tokens for enhanced security."
```

#### 2. **context/ServerEnvironmentTypes.ts** (1 update)
**Current Issue:**
- Line 78: `"API Key Registration"` in features array for env006

**Required Change:**
```typescript
// Line 78: Update feature description
features: [
  "D1 Database", 
- "API Key Registration", 
+ "UUID Authentication",
  "Supabase Auth", 
  "Durable Objects", 
  "Working MCP Flow"
]
```

#### 3. **services/authService.ts** (4 comment updates)
**Current Issues:**
- Line 52: Comment mentions "API key"
- Line 145: Migration comment uses old terminology
- Line 149: Old key check comment
- Line 152: Removal comment

**Required Changes:**
```typescript
// Line 52: Clarify UUID usage
- // Use Supabase UUID directly as API key (per auth-specs.md)
+ // Use Supabase UUID directly as auth token (per auth-specs.md)

// Line 145: Update migration comment
- // Migration: Check for old API key format and migrate to UUID
+ // Migration: Check for legacy API key storage and migrate to UUID

// Line 149: Update check comment
- console.log('[AuthService] Old API key check:', { hasOldKey: !!oldApiKey });
+ console.log('[AuthService] Legacy API key check:', { hasOldKey: !!oldApiKey });

// Line 152: Update removal comment
- console.log('[AuthService] Removing old API key');
+ console.log('[AuthService] Removing legacy API key');
```

#### 4. **context/AuthContext.tsx** (1 cleanup)
**Current Issue:**
- Line 33: Unused `updateAuthState` function declaration

**Required Change:**
```typescript
// Remove unused function declaration
- const updateAuthState = useCallback(async () => {
```

### Files to Keep As-Is (Legitimate API Usage)

#### ✅ **constants/index.ts**
- **Lines 10, 26, 27-30, 41**: HTTP API configuration (timeouts, retries)
- **Verdict**: Keep - these configure general API behavior, not authentication

#### ✅ **types/api.ts**
- **Lines 1, 21, 87**: API request/response type definitions
- **Verdict**: Keep - legitimate API interface types

#### ✅ **types/connection.ts**
- **Line 273**: `authMethod: "bearer" | "api_key" | "oauth" | "custom"`
- **Verdict**: Keep - legitimate auth method type definitions for various systems

#### ✅ **types/index.ts & types/models.ts**
- Module exports and generic API response wrapper types
- **Verdict**: Keep - standard API programming interface references

## Phase 2: SecureStorage Migration Plan

### Overview
The current implementation uses AsyncStorage due to Keychain/SecureStorage issues. When those issues are resolved, we can migrate back to secure storage with minimal changes.

### Current Architecture Analysis

#### **Storage Locations in authService.ts:**
```typescript
// Non-sensitive data (can stay in AsyncStorage)
- Line 29: Server URL retrieval
- Line 48: Server URL storage

// Sensitive data (should move to SecureStorage)
- Line 65: UUID storage (signUp)
- Line 96: UUID storage (signIn)  
- Line 109: UUID removal (signOut)
- Line 142: UUID retrieval (getAuthToken)
- Line 148: Legacy API key check
- Line 153: Legacy API key removal
- Line 163: UUID storage (migration)
- Line 187: UUID storage (auth state change)
- Line 190: UUID removal (auth state change)
```

### Migration Strategy

#### **Step 1: Import Changes**
```typescript
// Current (Line 3-4)
// import { secureStorage } from "./secureStorage"; // TODO: Re-enable once Keychain is fixed
import AsyncStorage from "@react-native-async-storage/async-storage";

// After migration
import { secureStorage } from "./secureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Keep for non-sensitive data
```

#### **Step 2: Storage Strategy Decision**
**Option A: Hybrid Approach (Recommended)**
- **SecureStorage**: UUID auth tokens (sensitive)
- **AsyncStorage**: Server URLs, preferences (non-sensitive)

**Option B: Full SecureStorage**
- Move everything to SecureStorage for consistency

#### **Step 3: Code Changes (11 locations)**
```typescript
// UUID-related storage (change AsyncStorage → secureStorage)
// Lines: 65, 96, 109, 142, 148, 153, 163, 187, 190

// Example:
- await AsyncStorage.setItem("user_uuid", uuid);
+ await secureStorage.setItem("user_uuid", uuid);

- const uuid = await AsyncStorage.getItem("user_uuid");
+ const uuid = await secureStorage.getItem("user_uuid");

- await AsyncStorage.removeItem("user_uuid");
+ await secureStorage.removeItem("user_uuid");
```

#### **Step 4: Data Migration Logic**
Add one-time migration in `getAuthToken()`:

```typescript
async getAuthToken() {
  try {
    console.log('[AuthService] getAuthToken called');
    
    // Try SecureStorage first
    let uuid = await secureStorage.getItem("user_uuid");
    console.log('[AuthService] Retrieved UUID from SecureStorage:', { hasUuid: !!uuid });
    
    // Migration: Check AsyncStorage if not in SecureStorage
    if (!uuid) {
      uuid = await AsyncStorage.getItem("user_uuid");
      if (uuid) {
        console.log('[AuthService] Migrating UUID from AsyncStorage to SecureStorage');
        await secureStorage.setItem("user_uuid", uuid);
        await AsyncStorage.removeItem("user_uuid"); // Clean up
        console.log('[AuthService] UUID migration completed');
      }
    }
    
    // Rest of existing logic for user generation...
    if (!uuid) {
      const user = await this.getCurrentUser();
      if (user) {
        uuid = this.generateApiKey(user.id); // Note: rename this method to generateAuthToken
        await secureStorage.setItem("user_uuid", uuid);
      }
    }
    
    return uuid;
  } catch (error) {
    console.error('[AuthService] getAuthToken failed:', error);
    return null;
  }
}
```

### Existing SecureStorage Implementation

The SecureStorage service is already implemented and ready:

```typescript
// /services/secureStorage.ts
class SecureStorage {
  private service = "com.tidesmobile.keychain";

  async setItem(key: string, value: string) // ✅ Same API as AsyncStorage
  async getItem(key: string)                // ✅ Same API as AsyncStorage  
  async removeItem(key: string)             // ✅ Same API as AsyncStorage
}
```

### Testing Strategy

#### **Pre-Migration Testing:**
1. Verify AsyncStorage UUID storage works correctly
2. Test auth flows on both iOS and Android
3. Ensure migration logic handles edge cases

#### **Post-Migration Testing:**
1. Test fresh installs (no existing data)
2. Test existing users (migration from AsyncStorage)
3. Test auth token persistence across app restarts
4. Verify Keychain integration on both platforms

### Risk Assessment

#### **Low Risk:**
- ✅ Same API interface (setItem/getItem/removeItem)
- ✅ Well-defined migration path
- ✅ Existing SecureStorage implementation
- ✅ Clear TODO markers in code

#### **Medium Risk:**
- ⚠️ Data migration complexity for existing users
- ⚠️ Keychain permissions on iOS
- ⚠️ Different error handling between storage systems

#### **Mitigation Strategies:**
- Add comprehensive error handling for migration
- Include fallback to AsyncStorage if SecureStorage fails
- Test thoroughly on both platforms before release

## Implementation Timeline

### Phase 1: API Cleanup (Immediate)
1. Update Settings.tsx user-facing messages
2. Update ServerEnvironmentTypes.ts feature description
3. Clean up authService.ts comments
4. Remove unused AuthContext function
5. **Total**: 7 changes across 4 files

### Phase 2: SecureStorage Migration (When Keychain is Fixed)
1. Update imports in authService.ts
2. Change 11 storage calls from AsyncStorage to secureStorage
3. Add migration logic for existing users
4. Test on both iOS and Android
5. **Total**: ~15 changes in 1 file + testing

## Summary

- **Phase 1**: Simple terminology cleanup, no functional changes
- **Phase 2**: Straightforward storage migration with existing infrastructure
- **Risk Level**: Low to Medium, well-planned migration path
- **User Impact**: Minimal, seamless transition with proper migration logic

The architecture is well-prepared for both phases, with clear separation of concerns and existing TODO markers guiding the implementation.