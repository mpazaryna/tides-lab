# Hybrid Authentication & SecureStorage Implementation Plan

## Overview
Complete implementation of secure, hybrid authentication with Supabase verification and UUID tokens, plus migration to SecureStorage for sensitive data.

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

**Replace current UUID-only check with hybrid verification:**
```typescript
// Replace getInitialAuth function logic:
const getInitialAuth = async () => {
  try {
    // Step 1: Check for stored UUID
    const uuid = await AsyncStorage.getItem("user_uuid");
    
    if (!uuid) {
      // No UUID - user needs to authenticate
      dispatch({ type: "CLEAR_AUTH" });
      return;
    }
    
    // Step 2: Verify with Supabase
    const verification = await authService.verifyStoredAuth();
    
    if (verification.isValid) {
      // Valid user - set authenticated state
      const user = verification.user || { id: uuid } as any;
      dispatch({
        type: "SET_AUTH_SUCCESS",
        payload: { 
          user, 
          session: null, 
          authToken: uuid 
        }
      });
      
      if (verification.isOffline) {
        console.log('[AuthContext] Running in offline mode');
        // Could add offline indicator to state if needed
      }
    } else {
      // User no longer valid - clear auth data
      console.log('[AuthContext] Clearing invalid auth data');
      await AsyncStorage.removeItem("user_uuid");
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
  // Clear local UUID first (works offline)
  await AsyncStorage.removeItem("user_uuid");
  
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

**Update all UUID storage calls (9 locations):**
```typescript
// Lines 65, 96, 109, 142, 153, 163, 187, 190
// Change: AsyncStorage.setItem("user_uuid", uuid)
// To:     secureStorage.setItem("user_uuid", uuid)

// Change: AsyncStorage.getItem("user_uuid") 
// To:     secureStorage.getItem("user_uuid")

// Change: AsyncStorage.removeItem("user_uuid")
// To:     secureStorage.removeItem("user_uuid")
```

**Add Migration Logic in getAuthToken():**
```typescript
async getAuthToken() {
  try {
    // Try SecureStorage first
    let uuid = await secureStorage.getItem("user_uuid");
    
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
    
    // Rest of existing verification logic...
    if (!uuid) {
      const verification = await this.verifyStoredAuth();
      if (verification.isValid && verification.user) {
        uuid = this.generateAuthToken(verification.user.id);
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

### 2.3 Update AuthContext for SecureStorage
**File:** `src/context/AuthContext.tsx`

**Update initialization to use secureStorage:**
```typescript
// In getInitialAuth function:
const uuid = await secureStorage.getItem("user_uuid");
```

**Add fallback for SecureStorage failures:**
```typescript
try {
  const uuid = await secureStorage.getItem("user_uuid");
  // ... verification logic
} catch (secureStorageError) {
  console.warn('[AuthContext] SecureStorage failed, trying AsyncStorage:', secureStorageError);
  try {
    const uuid = await AsyncStorage.getItem("user_uuid");
    // ... verification logic
  } catch (fallbackError) {
    console.error('[AuthContext] All storage methods failed:', fallbackError);
    dispatch({ type: "CLEAR_AUTH" });
  }
}
```

## Phase 3: Integration Testing (10 mins)

### Test Scenarios
1. **Fresh install** - Sign up new user
2. **App restart with valid user** - Should verify and continue
3. **App restart with deleted user** - Should clear auth and show login
4. **App restart offline** - Should work in offline mode
5. **SecureStorage migration** - Existing AsyncStorage users should migrate
6. **SecureStorage failure** - Should fallback gracefully

### Success Criteria
✅ Users verified on each app launch
✅ Offline mode works when network unavailable  
✅ Invalid users are logged out automatically
✅ SecureStorage handles sensitive data
✅ AsyncStorage used for non-sensitive data
✅ Migration from old storage works seamlessly
✅ Graceful fallbacks for storage failures

## Implementation Order
1. **Phase 1.1**: Add verifyStoredAuth to authService
2. **Phase 1.2**: Update AuthContext initialization  
3. **Phase 1.3**: Update signOut method
4. **Test Phase 1**: Verify hybrid auth works
5. **Phase 2.1**: Test SecureStorage functionality
6. **Phase 2.2-2.3**: Implement SecureStorage migration (if test passes)
7. **Phase 3**: Comprehensive testing

## Rollback Plan
If SecureStorage fails: Keep Phase 1 (hybrid auth) and stay with AsyncStorage for now. The hybrid auth improvements are valuable independently.

## Current Status
- Navigation fix: ✅ Complete (RootNavigator checks user+authToken)
- API terminology cleanup: ✅ Complete 
- SecureStorage test: ✅ Ready (button in Settings)
- Hybrid auth: ⏳ Ready to implement
- SecureStorage migration: ⏳ Pending test results