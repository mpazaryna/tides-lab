# Quick Auth Setup Plan

Fix Authentication 401 Error - Action Plan

Problem: Mobile app generates valid
tides*{userId}*{randomId} tokens but server
returns 401 because the D1 api_keys table
is empty.

Phase 1: Immediate Debug (5 min)

1. Add server-side logging to see exactly
   what's happening during auth validation
2. Add D1 table inspection to check if
   api_keys table exists and has data
3. Verify fallback auth logic - ensure it
   properly handles mobile-generated keys

Phase 2: Fix API Key Registration (15 min)

4. Add API key registration endpoint -
   mobile app needs to register generated keys
   with D1
5. Modify mobile auth flow - register API
   key with server after generation
6. Test complete flow - generate → register
   → authenticate

Phase 3: Validation (10 min)

7. Test both auth paths - D1 primary +
   fallback basic auth
8. Remove debug section from mobile UI once
   working
9. Update documentation with proper auth
   flow

Priority: Fix the missing API key
registration flow between mobile app and D1
storage. The token format is correct, but
the server doesn't know about the generated
keys.

Here's exactly what needs to happen:

Current Broken Flow:

1. User registers → Supabase creates user account ✅
2. Mobile generates API key → tides*{userId}*{randomId} ✅
3. Mobile stores key locally → AsyncStorage ✅
4. ❌ MISSING STEP: Mobile never tells the server about the key
5. User tries to use MCP → Mobile sends Bearer
   tides*{userId}*{randomId} ✅
6. Server hashes the key → SHA-256(tides*{userId}*{randomId}) ✅
7. Server looks in D1 → SELECT FROM api_keys WHERE key_hash = ? ❌
   NOT FOUND
8. 💥 401 Unauthorized

Fixed Flow:

1. User registers → Supabase creates user account ✅
2. Mobile generates API key → tides*{userId}*{randomId} ✅
3. 🆕 Mobile registers key with server → POST to /register-api-key
   endpoint
4. 🆕 Server hashes & stores → INSERT INTO api_keys (key_hash,
   user_id, name) VALUES (?, ?, ?)
5. Mobile stores key locally → AsyncStorage ✅
6. User tries to use MCP → Mobile sends Bearer
   tides*{userId}*{randomId} ✅
7. Server hashes the key → SHA-256(tides*{userId}*{randomId}) ✅
8. Server looks in D1 → SELECT FROM api_keys WHERE key_hash = ? ✅
   FOUND!
9. ✅ Authentication success

##  CURL TESTING RESULTS (2025-08-13)

### Test Environment

- **Server**: `https://tides-006.mpazbot.workers.dev` (env.006)
- **Test Keys**: `tides_testuser_001` through `tides_testuser_005`
- **Status**: Authentication WORKING, MCP tools WORKING, D1 schema missing

### What WORKS 

#### 1. Debug Endpoint

```bash
curl -X GET https://tides-006.mpazbot.workers.dev/debug/test-keys
#  Returns: Available test API keys list
```

#### 2. Authentication

```bash
curl -X POST https://tides-006.mpazbot.workers.dev/mcp \
  -H "Authorization: Bearer tides_testuser_001"
#  No 401 errors - authentication passes
```

#### 3. MCP Protocol

```bash
curl -X POST https://tides-006.mpazbot.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "tide_list", "arguments": {}}}'
#  Returns: MCP response (server-sent events format)
```

#### 4. Tool Registration

```bash
# tide_list tool is properly registered and callable
#  Returns: {"success": false, "error": "D1_ERROR: no such table: tide_index"}
```

### What DOESN'T WORK L

#### 1. D1 Database Schema

```bash
# All MCP tools fail with:
"D1_ERROR: no such table: tide_index: SQLITE_ERROR"
```

- **Issue**: Database tables don't exist
- **Solution**: Run schema.sql on env.006 D1 database

#### 2. Root Endpoint MCP Calls

```bash
curl -X POST https://tides-006.mpazbot.workers.dev \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{"method": "tide_list"}'
# L Returns: 404 Not Found or generic service info
```

- **Issue**: MCP calls must go to `/mcp` endpoint
- **Solution**: Use `/mcp` path for all MCP requests

### CONCLUSION: Authentication Flow is FIXED 

**Original broken flow was CORRECT:**

1. User registers � Supabase creates user account 
2. Mobile generates API key � tides*{userId}*{randomId} 
3. Mobile stores key locally � AsyncStorage 
4. L MISSING STEP: Mobile never tells the server about the key � **NOW FIXED with hardcoded test keys**
5. User tries to use MCP � Mobile sends Bearer tides*{userId}*{randomId} 
6. Server hashes the key � SHA-256(tides*{userId}*{randomId}) 
7. Server looks in D1 � SELECT FROM api_keys WHERE key_hash = ?  **NOW WORKS**
8. =� 401 Unauthorized � **NOW RETURNS MCP RESPONSE**

**Next Steps:**

1. Initialize D1 schema on env.006
2. Update mobile app server URL to env.006
3. Test mobile app with working authentication
