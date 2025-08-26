# Tide Creation Scripts

## Purpose

Create fully synthetic tides with realistic productivity data for testing MCP tools and prompts.

## Main Script

### `create-synthetic-tide.sh`

Creates a complete synthetic tide with:
- 6 flow sessions (varying intensity and duration)
- 8 energy level updates (realistic daily pattern)
- 5 task links (from different platforms)
- Full productivity report

### Usage

```bash
# Basic usage (creates in development environment)
./create-synthetic-tide.sh

# Specify environment
TIDES_URL=https://tides-001.mpazbot.workers.dev ./create-synthetic-tide.sh

# Custom tide name
TIDE_NAME="My Test Tide" ./create-synthetic-tide.sh

# Different flow type
FLOW_TYPE=weekly ./create-synthetic-tide.sh
```

### Environment Variables

- `TIDES_URL` - Server URL (default: tides-003 development)
- `TIDES_API_KEY` - Authentication key (default: tides_testuser_001)
- `TIDE_NAME` - Name for the tide (default: "Synthetic Test Tide")
- `FLOW_TYPE` - Type of tide: daily|weekly|custom (default: daily)

### Output

The script creates a complete tide and outputs:
1. Tide ID for further testing
2. Summary of created data
3. Example curl commands for testing

### Testing with Created Tide

After creation, use the tide ID to test:

```bash
# Get raw JSON data
curl -X POST https://tides-003.mpazbot.workers.dev/mcp \
  -H 'Authorization: Bearer tides_testuser_001' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"tide_get_raw_json","arguments":{"tide_id":"YOUR_TIDE_ID"}},"id":1}'

# Analyze with prompts
curl -X POST https://tides-003.mpazbot.workers.dev/mcp \
  -H 'Authorization: Bearer tides_testuser_001' \
  -d '{"jsonrpc":"2.0","method":"prompts/get","params":{"name":"analyze_tide","arguments":{"tide_id":"YOUR_TIDE_ID"}},"id":1}'
```

## Deprecated Scripts

The following scripts are deprecated and will be removed:
- `create-sample-tide.sh` - Replaced by create-synthetic-tide.sh
- `create-complete-tide.sh` - Replaced by create-synthetic-tide.sh
- `create-manual-tide.sh` - Replaced by create-synthetic-tide.sh

## Data Structure

### Flow Sessions
Creates 6 sessions with realistic patterns:
- Morning deep focus (50 min)
- Quick admin tasks (15 min)
- Team collaboration (45 min)
- Afternoon focus (30 min)
- Planning wrap-up (20 min)

### Energy Levels
Tracks energy throughout the day:
- Morning peak (85-90)
- Post-lunch dip (60)
- Afternoon recovery (70-80)
- Evening wind-down (50-65)

### Task Links
Includes tasks from:
- GitHub Issues
- Linear Tasks
- Notion Pages
- Jira Tickets
- Asana Tasks