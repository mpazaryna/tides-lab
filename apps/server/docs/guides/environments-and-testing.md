# Environments and Testing Guide

## Deployed Environments

Tides has three environments for development, staging, and production testing:

| Environment   | URL                                   | Purpose     | Status    |
| ------------- | ------------------------------------- | ----------- | --------- |
| **tides-003** | https://tides-003.mpazbot.workers.dev | Development | ✅ Active |
| **tides-002** | https://tides-002.mpazbot.workers.dev | Staging     | ✅ Active |
| **tides-001** | https://tides-001.mpazbot.workers.dev | Production  | ✅ Active |

### Environment Resources

Each environment has isolated resources:

#### D1 Databases

- **tides-003-db**: Development database
- **tides-002-db**: Staging database
- **tides-001-db**: Production database

#### R2 Storage Buckets

- **tides-003-storage**: Development storage
- **tides-002-storage**: Staging storage
- **tides-001-storage**: Production storage

## Test Users and Authentication

### Current Working API Keys

All environments use the same test API keys for development:

| User ID     | API Key              | Purpose             |
| ----------- | -------------------- | ------------------- |
| testuser001 | `tides_testuser_001` | Primary test user   |
| testuser002 | `tides_testuser_002` | Secondary test user |
| testuser003 | `tides_testuser_003` | Third test user     |
| testuser004 | `tides_testuser_004` | Fourth test user    |
| testuser005 | `tides_testuser_005` | Fifth test user     |

**Authentication Format:**

```
Authorization: Bearer tides_testuser_001
```

### Quick Test Examples

#### Test MCP Tool Call

```bash
# Test tide creation in development
curl -X POST https://tides-003.mpazbot.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "tide_create",
      "arguments": {
        "name": "Test Tide",
        "flow_type": "daily",
        "description": "Testing the deployment"
      }
    }
  }'
```

#### Test Authentication

```bash
# Validate API key
curl -X POST https://tides-003.mpazbot.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "auth_validate_key",
      "arguments": {
        "api_key": "tides_testuser_001"
      }
    }
  }'
```

#### List Available Tools

```bash
# Get all available MCP tools
curl -X POST https://tides-003.mpazbot.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## MCP Tools Available

All environments support the complete MCP tool suite:

### Core Tide Management

- `tide_create` - Create new tides
- `tide_list` - List/filter tides
- `tide_flow` - Start flow sessions
- `tide_add_energy` - Track energy levels

### Task Integration

- `tide_link_task` - Link external tasks
- `tide_list_task_links` - View task links

### Analytics

- `tide_get_report` - Generate analytics
- `tide_get_raw_json` - Get complete tide data

### Multi-User Support

- `tides_get_participants` - List all users
- `auth_validate_key` - Test authentication

## Client Configuration

### Postman Setup

1. **Create Environment Variables:**

   ```
   base_url = https://tides-003.mpazbot.workers.dev
   api_key = tides_testuser_001
   ```

2. **Authorization Header:**

   ```
   Authorization: Bearer {{api_key}}
   ```

3. **MCP Request Body Template:**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "{{tool_name}}",
       "arguments": {{tool_arguments}}
     }
   }
   ```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "tides-dev": {
      "command": "npx",
      "args": ["mcp-remote", "https://tides-003.mpazbot.workers.dev/mcp"],
      "env": {
        "AUTHORIZATION": "Bearer tides_testuser_001"
      }
    }
  }
}
```

### cURL Template

```bash
#!/bin/bash
BASE_URL="https://tides-003.mpazbot.workers.dev"
API_KEY="tides_testuser_001"

curl -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "tide_list",
      "arguments": {"limit": 5}
    }
  }'
```

## End-to-End Testing

### Run Test Scripts

```bash
# Test all environments with health checks
npm run test:e2e

# Test specific environment
TIDES_URL=https://tides-003.mpazbot.workers.dev npm run test:e2e
```

### Create Synthetic Test Data

```bash
# Create comprehensive test tide
cd scripts/tide-creation
./create-synthetic-tide.sh

# Create in specific environment
TIDES_URL=https://tides-001.mpazbot.workers.dev ./create-synthetic-tide.sh
```

## Deployment Commands

```bash
# Deploy to environments
npm run deploy:dev      # Deploy to tides-003 (development)
npm run deploy:staging  # Deploy to tides-002 (staging)
npm run deploy:prod     # Deploy to tides-001 (production)

# Local development
npm run dev             # Local development server
npm run dev:prod        # Local with production config
```

## Storage Architecture

### D1/R2 Hybrid System

Each environment uses an enhanced storage system:

- **D1 Database**: Fast metadata, user profiles, analytics
- **R2 Storage**: Complete tide data, file attachments
- **Composite Indexes**: Optimized queries across both systems

### Analytics Tables

- `tide_analytics` - Performance metrics per tide
- `user_activity_rollups` - Daily/weekly activity summaries
- `flow_session_summary` - Denormalized session data

## Monitoring

```bash
# Monitor environment health
npm run monitor:simple     # Basic status check
npm run monitor:live       # Real-time logs
npm run monitor            # Full analytics (requires permissions)
```

## Security Notes

### Development vs Production

- **Development Keys**: `tides_testuser_XXX` format for testing
- **User Isolation**: Each key maps to isolated user data
- **Environment Isolation**: No data shared between environments

### Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for API keys in applications
3. **Rotate keys regularly** in production
4. **Monitor usage patterns** for anomalies

## Migration Notes

### Legacy Test Key Format

The D1 databases contain legacy `test-key-001` format keys, but the current system uses `tides_testuser_001` format for compatibility. Future migration may unify these formats.

### Authentication Evolution

- **Current**: Fallback authentication with simple validation
- **Future**: Full D1-based authentication with user profiles
- **Migration Path**: Gradual transition maintaining backward compatibility

## Troubleshooting

### Common Issues

| Issue            | Solution                                    |
| ---------------- | ------------------------------------------- |
| 401 Unauthorized | Verify API key format: `tides_testuser_XXX` |
| Network timeout  | Check environment URL is correct            |
| Empty responses  | Ensure using `/mcp` endpoint                |
| CORS errors      | MCP server handles CORS automatically       |

### Debug Commands

```bash
# Validate authentication
curl -X POST https://tides-003.mpazbot.workers.dev/mcp \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"auth_validate_key","arguments":{"api_key":"tides_testuser_001"}},"id":1}'

# Check environment health
curl -s https://tides-003.mpazbot.workers.dev/health || echo "Environment down"
```

## Related Documentation

- **[Authentication Overview](./auth-overview.md)** - Complete authentication guide
- **[React Native Integration](./auth-react-native.md)** - Mobile app integration
- **[Architecture ADR](../adr/002-storage-architecture.md)** - Technical decisions

---

_All environments are production-ready with comprehensive testing, monitoring, and documentation._
