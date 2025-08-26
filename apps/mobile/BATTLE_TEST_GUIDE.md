# 🔥 Battle-Test Guide: Hybrid Authentication & SecureStorage

**PREREQUISITES:** Make sure your React Native emulator is running before starting.

## 🎯 Test Plan Overview

You'll battle-test 7 critical scenarios to verify the hybrid authentication and secure storage implementation works flawlessly. Each test includes **what to do** and **what to observe**.

---

## 📱 **TEST 1: SecureStorage Functionality Test**

_Verifies the secure keychain is working properly_

### What to Do:

1. Open the Tides app
2. Navigate to **Settings** screen (bottom tab or main menu)
3. Scroll down to find the **"Test SecureStorage"** button
4. Tap the **"Test SecureStorage"** button

### What to Observe:

- ✅ **SUCCESS**: Alert shows "✅ SecureStorage test passed!"
- ✅ **Console logs** show write/read/remove operations working
- ❌ **FAILURE**: Alert shows error message about keychain access

---

## 🆕 **TEST 2: Fresh User Registration**

_Tests new user flow with correct API key format_

### What to Do:

1. If logged in, go to Settings and tap **"Sign Out"**
2. On login screen, tap **"Create an Account"**
3. Enter a new email: `test-battle-[random]@example.com`
4. Enter password: `TestPass123!`
5. Tap **"Sign Up"**

### What to Observe:

- ✅ **SUCCESS**: Automatically logged in and taken to Home screen
- ✅ **Console logs** show: `Generated API key` with `tides_[userId]_[randomId]` format
- ✅ **Console logs** show: `Stored API key in SecureStorage`
- ❌ **FAILURE**: Stuck on loading, error messages, or format issues

---

## 🔄 **TEST 3: App Restart with Valid User** - Complete (No P0s or P1s)

_Tests persistent authentication across app restarts_

### What to Do:

1. While logged in from Test 2, **force-close the app completely**
   - iOS: Double-tap home button, swipe up on app
   - Android: Recent apps button, swipe away app
2. **Reopen the app** from home screen
3. Watch the startup sequence

### What to Observe:

- ✅ **SUCCESS**: App opens directly to Home screen (no login required)
- ✅ **Console logs** show: `Retrieved API key from SecureStorage`
- ✅ **Console logs** show: `User verification successful`
- ❌ **FAILURE**: Taken to login screen or error messages

---

## 🛜 **TEST 4: Offline Mode Functionality**

_Tests offline authentication with stored credentials_

### What to Do:

1. While logged in, **turn off WiFi and mobile data** on device
2. **Force-close and reopen the app**
3. Try to navigate around the app

### What to Observe:

- ✅ **SUCCESS**: App opens to Home screen in offline mode
- ✅ **Console logs** show: `Network error during verification, allowing offline mode`
- ✅ **Console logs** show: `Running in offline mode`
- ✅ **UI works** but may show network error messages for data loading
- ❌ **FAILURE**: Kicked to login screen or app crashes

**Don't forget to turn WiFi back on after this test!**

---

## 🗑️ **TEST 5: Deleted User Cleanup**

_Tests automatic logout when user is deleted from backend_

### What to Do:

1. **Turn WiFi back on**
2. While logged in, you need to simulate a "deleted user" scenario
3. Go to **Settings** → **"Sign Out"**
4. Sign back in with the same test credentials
5. Force-close and reopen app

### What to Observe:

- ✅ **SUCCESS**: App automatically logs in and works normally
- ✅ **Console logs** show successful authentication flow
- ❌ **FAILURE**: Authentication errors or app stuck

_Note: This test simulates the deleted user scenario through sign-out/sign-in cycle_

---

## 📈 **TEST 6: MCP Server Authentication**

_Tests that API keys work with the MCP server_

### What to Do:

1. While logged in, navigate to **Home screen**
2. Look for any **Chat** or **AI features** in the app
3. Try to **send a message** or **trigger any AI functionality**
4. Try **creating a tide** or using any server-connected features

### What to Observe:

- ✅ **SUCCESS**: Features work without 401 authentication errors
- ✅ **Console logs** show successful API calls to MCP server
- ✅ **No "Unauthorized" errors** in console or UI
- ❌ **FAILURE**: 401 errors, "Invalid API key" messages

---

## 🔄 **TEST 7: Migration Scenario Simulation**

_Tests migration from old storage format_

### What to Do:

1. Go to **Settings**
2. Look for any **Debug** or **Developer** options
3. If available, try any **"Clear Storage"** or **"Reset Auth"** options
4. **Sign out completely**
5. **Sign back in** with your test credentials
6. **Force-close and reopen app** multiple times

### What to Observe:

- ✅ **SUCCESS**: Each restart works smoothly
- ✅ **Console logs** may show migration messages like:
  - `Migrating from old storage key`
  - `API key migration completed`
  - `Migration from AsyncStorage to SecureStorage`
- ✅ **Consistent behavior** across multiple app restarts
- ❌ **FAILURE**: Different behavior on different restarts

---

## 🏆 **SUCCESS CRITERIA CHECKLIST**

After completing all tests, you should observe:

### ✅ **Authentication Flow**

- [ ] Fresh registration works with correct API key format
- [ ] App restarts maintain login state
- [ ] Offline mode allows app usage
- [ ] Sign out completely clears auth state

### ✅ **Storage Security**

- [ ] SecureStorage test passes
- [ ] API keys stored securely in keychain
- [ ] Migration between storage formats works

### ✅ **Server Integration**

- [ ] MCP server accepts API keys (no 401 errors)
- [ ] All server-connected features work
- [ ] Console shows successful API communications

### ✅ **Error Handling**

- [ ] Graceful fallbacks for storage failures
- [ ] Network errors don't crash the app
- [ ] Invalid users are logged out cleanly

---

## 🚨 **If Any Test Fails**

**Immediate Actions:**

1. **Check Console Logs** - Look for error messages in developer console
2. **Note Exact Behavior** - What happened vs what was expected
3. **Try Again** - Some failures might be temporary network issues
4. **Document Issues** - Screenshot errors, copy console logs

**Common Issues to Look For:**

- API key format problems (`tides_` prefix missing)
- SecureStorage/Keychain permission issues
- Network connectivity problems
- MCP server authentication failures

The app should handle all these scenarios gracefully with proper error messages and recovery mechanisms!
