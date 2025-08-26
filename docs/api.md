# Tides API Documentation

## MCP Server Endpoints

Base URL: `https://tides-001.mpazbot.workers.dev`

### Available MCP Tools

1. `tide_create` - Create new tide workflows
2. `tide_list` - List existing tides  
3. `tide_flow` - Manage tide flow states
4. `tide_add_energy` - Add energy measurements
5. `tide_link_task` - Link tasks to tides
6. `tide_list_task_links` - List task linkages
7. `tide_get_report` - Generate tide reports
8. `tides_get_participants` - Get tide participants

### Authentication

Two authentication methods supported:

**Mobile Clients:**
```
Authorization: Bearer tides_{userId}_{randomId}
```

**Desktop Clients:**  
```
Authorization: Bearer {uuid}
```

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "tide_create",
  "params": {
    "title": "Morning Workflow",
    "description": "High energy morning routine"
  },
  "id": 1
}
```

### Response Format

```json
{
  "jsonrpc": "2.0", 
  "result": {
    "id": "tide_123",
    "status": "created"
  },
  "id": 1
}
```