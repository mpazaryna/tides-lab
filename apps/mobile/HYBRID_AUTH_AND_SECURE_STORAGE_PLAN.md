# Hybrid Authentication & SecureStorage Implementation Plan

## Overview
Complete implementation of secure, hybrid authentication with Supabase verification and persistent API keys, plus migration to SecureStorage for sensitive data.

## Phase 0: API Key Format Implementation (Critical - 5 mins)

### 0.1 Update API Key Generation Format
**File:** `src/services/authService.ts`

**Fix generateApiKey method:**
```typescript
private generateApiKey(userId: string) {
  // Generate a random suffix for uniqueness (6 chars)
  const randomId = Math.random().toString(36).substring(2, 8);
  // Format: tides_userId_randomId (per server auth requirements)
  return `tides_${userId}_${randomId}`;
}
```

**Benefits:**
- ✅ Matches MCP server format requirements (`tides_` prefix)
- ✅ Persistent API keys across app restarts
- ✅ Unique API keys per device/session
- ✅ Industry-standard format for future API key management
- ✅ Enables future revocation and multi-device support

## Phase 1: Hybrid Auth Implementation (Critical - 20 mins)

### 1.1 Add Verification Method to AuthService
**File:** `src/services/authService.ts`

**Add new method:**
```typescript
async verifyStoredAuth(): Promise<{
  isValid: boolean;
  user?: User;
  isOffline?: boolean;
}> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Auth error - user no longer valid in Supabase
      console.log('[AuthService] User verification failed:', error.message);
      return { isValid: false };
    }
    
    console.log('[AuthService] User verification successful');
    return { isValid: true, user };
  } catch (networkError) {
    // Network error - allow offline mode
    console.log('[AuthService] Network error during verification, allowing offline mode');
    return { isValid: true, isOffline: true };
  }
}
```

### 1.2 Update AuthContext Initialization Logic
**File:** `src/context/AuthContext.tsx`

**Replace current API key-only check with hybrid verification:**
```typescript
// Replace getInitialAuth function logic:
const getInitialAuth = async () => {
  try {
    // Step 1: Check for stored API key
    const apiKey = await secureStorage.getItem("api_key");
    
    if (!apiKey) {
      // No API key - user needs to authenticate
      dispatch({ type: "CLEAR_AUTH" });
      return;
    }
    
    // Step 2: Verify with Supabase
    const verification = await authService.verifyStoredAuth();
    
    if (verification.isValid) {
      // Valid user - set authenticated state
      const user = verification.user || { id: apiKey.split('_')[1] } as any;
      dispatch({
        type: "SET_AUTH_SUCCESS",
        payload: { 
          user, 
          session: null, 
          authToken: apiKey 
        }
      });
      
      if (verification.isOffline) {
        console.log('[AuthContext] Running in offline mode');
        // Could add offline indicator to state if needed
      }
    } else {
      // User no longer valid - clear auth data
      console.log('[AuthContext] Clearing invalid auth data');
      await secureStorage.removeItem("api_key");
      dispatch({ type: "CLEAR_AUTH" });
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error('[AuthContext] Auth initialization failed:', error);
    dispatch({ type: "SET_ERROR", payload: "Failed to verify authentication" });
  }
};
```

### 1.3 Update Sign Out for Complete Cleanup
**File:** `src/services/authService.ts`

**Ensure offline-friendly sign out:**
```typescript
async signOut() {
  // Clear local API key first (works offline)
  await secureStorage.removeItem("api_key");
  
  // Then try Supabase signout (may fail if offline)
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  } catch (error) {
    console.log('[AuthService] Supabase signout failed (may be offline):', error);
    // Don't throw - local cleanup is more important
  }
}
```

## Phase 2: SecureStorage Migration (15 mins)

### 2.1 Test SecureStorage First
**Action:** Use the test button in Settings.tsx to verify Keychain works

### 2.2 If SecureStorage Test Passes - Update AuthService
**File:** `src/services/authService.ts`

**Update imports:**
```typescript
import { secureStorage } from "./secureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Keep for non-sensitive data
```

**Update all API key storage calls:**
```typescript
// Change storage key from "user_uuid" to "api_key" for industry standard naming
// Change: AsyncStorage.setItem("user_uuid", apiKey)
// To:     secureStorage.setItem("api_key", apiKey)

// Change: AsyncStorage.getItem("user_uuid") 
// To:     secureStorage.getItem("api_key")

// Change: AsyncStorage.removeItem("user_uuid")
// To:     secureStorage.removeItem("api_key")
```

**Add Migration Logic in getApiKey():**
```typescript
async getApiKey() {
  try {
    // Try SecureStorage first (new format)
    let apiKey = await secureStorage.getItem("api_key");
    
    // Migration: Check old UUID storage if not found
    if (!apiKey) {
      // Check old SecureStorage key
      const oldToken = await secureStorage.getItem("user_uuid");
      if (oldToken) {
        console.log('[AuthService] Migrating from old storage key');
        // If old token is in wrong format, regenerate
        if (!oldToken.startsWith("tides_")) {
          const verification = await this.verifyStoredAuth();
          if (verification.isValid && verification.user) {
            apiKey = this.generateApiKey(verification.user.id);
            await secureStorage.setItem("api_key", apiKey);
            await secureStorage.removeItem("user_uuid"); // Clean up old key
            console.log('[AuthService] API key format migration completed');
          }
        } else {
          // Old token has correct format, just move it
          apiKey = oldToken;
          await secureStorage.setItem("api_key", apiKey);
          await secureStorage.removeItem("user_uuid"); // Clean up old key
        }
      } else {
        // Check legacy AsyncStorage
        const legacyToken = await AsyncStorage.getItem("user_uuid");
        if (legacyToken) {
          console.log('[AuthService] Migrating from AsyncStorage to SecureStorage');
          // Legacy tokens need format update
          const verification = await this.verifyStoredAuth();
          if (verification.isValid && verification.user) {
            apiKey = this.generateApiKey(verification.user.id);
            await secureStorage.setItem("api_key", apiKey);
            await AsyncStorage.removeItem("user_uuid"); // Clean up
            console.log('[AuthService] AsyncStorage migration completed');
          }
        }
      }
    }
    
    // Generate new API key if none exists and user is authenticated
    if (!apiKey) {
      const verification = await this.verifyStoredAuth();
      if (verification.isValid && verification.user) {
        apiKey = this.generateApiKey(verification.user.id);
        await secureStorage.setItem("api_key", apiKey);
        console.log('[AuthService] Generated new API key');
      }
    }
    
    return apiKey;
  } catch (error) {
    console.error('[AuthService] getApiKey failed:', error);
    return null;
  }
}
```

### 2.3 Update AuthContext for SecureStorage
**File:** `src/context/AuthContext.tsx`

**Update initialization to use secureStorage with new key:**
```typescript
// In getInitialAuth function:
const apiKey = await secureStorage.getItem("api_key");
```

**Add fallback for SecureStorage failures:**
```typescript
try {
  const apiKey = await secureStorage.getItem("api_key");
  // ... verification logic
} catch (secureStorageError) {
  console.warn('[AuthContext] SecureStorage failed, trying legacy storage:', secureStorageError);
  try {
    // Try old SecureStorage key first
    let apiKey = await secureStorage.getItem("user_uuid");
    if (!apiKey) {
      // Try AsyncStorage as final fallback
      apiKey = await AsyncStorage.getItem("user_uuid");
    }
    // ... verification logic
  } catch (fallbackError) {
    console.error('[AuthContext] All storage methods failed:', fallbackError);
    dispatch({ type: "CLEAR_AUTH" });
  }
}
```

## Phase 3: Integration Testing (10 mins)

### Test Scenarios
1. **Fresh install** - Sign up new user with `tides_userId_randomId` format
2. **App restart with valid user** - Should verify and continue with persistent auth token
3. **App restart with deleted user** - Should clear auth and show login
4. **App restart offline** - Should work in offline mode with stored auth token
5. **Token format migration** - Existing raw UUID users should get new format
6. **SecureStorage migration** - Existing AsyncStorage users should migrate
7. **SecureStorage failure** - Should fallback gracefully

### Success Criteria
✅ Users verified on each app launch with hybrid auth
✅ API keys generated in correct `tides_userId_randomId` format
✅ Offline mode works when network unavailable with persistent API keys
✅ Invalid users are logged out automatically via MCP validation
✅ SecureStorage handles sensitive API keys securely
✅ AsyncStorage used for non-sensitive data only
✅ Migration from old UUID format works seamlessly
✅ Migration from AsyncStorage to SecureStorage works
✅ Graceful fallbacks for storage failures
✅ MCP server accepts API keys (no more 401 errors)

## Implementation Order
1. **Phase 0.1**: Fix API key format generation (CRITICAL - fixes 401 errors)
2. **Phase 1.1**: Add verifyStoredAuth to authService  
3. **Phase 1.2**: Update AuthContext initialization
4. **Phase 1.3**: Update signOut method
5. **Test Phase 1**: Verify hybrid auth works with proper API key format
6. **Phase 2.1**: Test SecureStorage functionality
7. **Phase 2.2-2.3**: Implement SecureStorage migration with new API key format
8. **Phase 3**: Comprehensive testing

## Rollback Plan
If SecureStorage fails: Keep Phase 0-1 (API key format + hybrid auth) and stay with AsyncStorage for now. The API key format fix and hybrid auth improvements are valuable independently.

## Current Status
- Navigation fix: ✅ Complete (RootNavigator checks user+authToken)
- SecureStorage test: ✅ Complete (Keychain working)
- SecureStorage migration: ✅ Complete (implemented)
- API key format: ❌ **NEEDS FIX** (currently causes 401 errors)
- Hybrid auth: ✅ Complete (implemented but broken by API key format)
- **Next Step: Phase 0.1** - Fix API key generation format to resolve MCP authentication