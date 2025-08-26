#!/bin/bash

# Create a complete synthetic tide with real flow sessions, energy updates, and tasks
# This creates realistic productivity data for testing the TideProductivityAgent

set -e

# Configuration
BASE_URL="https://tides-001.mpazbot.workers.dev/mcp"
API_KEY="tides_testuser_001"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🌊 Creating Complete Synthetic Tide${NC}"
echo -e "${YELLOW}This will create a tide with realistic productivity patterns${NC}"
echo ""

# Step 1: Create tide
echo -e "${CYAN}1. Creating main tide...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "tide_create",
      "arguments": {
        "name": "Deep Work Day - Complete Test",
        "flow_type": "daily",
        "description": "Full day of focused work with realistic energy patterns and task management"
      }
    }
  }')

# Extract tide ID from SSE response
TIDE_ID=$(echo "$RESPONSE" | grep "data:" | head -1 | sed 's/data: //' | jq -r '.result.content[0].text | fromjson | .tide_id')

if [ "$TIDE_ID" != "null" ] && [ -n "$TIDE_ID" ]; then
  echo -e "${GREEN}✅ Created tide: $TIDE_ID${NC}"
else
  echo -e "❌ Failed to create tide"
  echo "Response: $RESPONSE"
  exit 1
fi

# Step 2: Add flow sessions (realistic daily pattern)
echo -e "${CYAN}2. Adding flow sessions...${NC}"

# Morning deep work (9:00-10:30)
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "tide_flow",
      "arguments": {
        "tide_id": "'$TIDE_ID'",
        "intensity": "strong",
        "duration": 90,
        "initial_energy": "high",
        "work_context": "Deep focus: Architecture design and complex problem solving"
      }
    }
  }' > /dev/null

# Late morning session (11:00-12:00)
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "tide_flow",
      "arguments": {
        "tide_id": "'$TIDE_ID'",
        "intensity": "moderate",
        "duration": 60,
        "initial_energy": "medium",
        "work_context": "Code review and team collaboration"
      }
    }
  }' > /dev/null

# Afternoon session (2:00-3:15)
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "tide_flow",
      "arguments": {
        "tide_id": "'$TIDE_ID'",
        "intensity": "gentle",
        "duration": 75,
        "initial_energy": "low",
        "work_context": "Documentation and email processing"
      }
    }
  }' > /dev/null

# Late afternoon burst (4:00-5:00)
curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "tide_flow",
      "arguments": {
        "tide_id": "'$TIDE_ID'",
        "intensity": "strong",
        "duration": 60,
        "initial_energy": "high",
        "work_context": "Creative problem solving and feature implementation"
      }
    }
  }' > /dev/null

echo -e "${GREEN}✅ Added 4 flow sessions (285 total minutes)${NC}"

# Step 3: Add energy updates throughout the day
echo -e "${CYAN}3. Adding energy level updates...${NC}"

ENERGY_UPDATES=(
  "high:Morning coffee effect - very focused and ready for complex tasks"
  "medium:Post-meeting energy, good for collaborative work but not deep focus"
  "low:Post-lunch dip, struggling with concentration on difficult problems"
  "medium:Second wind kicking in, creative energy returning"
  "high:Late afternoon burst, excellent focus for implementation work"
  "low:End of day fatigue, suitable only for routine administrative tasks"
)

for i in "${!ENERGY_UPDATES[@]}"; do
  IFS=':' read -ra ENERGY_DATA <<< "${ENERGY_UPDATES[$i]}"
  LEVEL="${ENERGY_DATA[0]}"
  CONTEXT="${ENERGY_DATA[1]}"
  
  curl -s -X POST "$BASE_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
      "jsonrpc": "2.0",
      "id": '$((10+i))',
      "method": "tools/call",
      "params": {
        "name": "tide_add_energy",
        "arguments": {
          "tide_id": "'$TIDE_ID'",
          "energy_level": "'$LEVEL'",
          "context": "'$CONTEXT'"
        }
      }
    }' > /dev/null
done

echo -e "${GREEN}✅ Added 6 energy level updates${NC}"

# Step 4: Link realistic tasks
echo -e "${CYAN}4. Linking completed tasks...${NC}"

TASKS=(
  "github:Implement user authentication middleware for API endpoints"
  "jira:Fix memory leak in background worker process"
  "notion:Document new MCP integration patterns and best practices"
  "slack:Review architecture proposal for real-time notification system"
  "linear:Update CI/CD pipeline to support multi-environment deployments"
  "github:Add comprehensive error handling to payment processing module"
)

for i in "${!TASKS[@]}"; do
  IFS=':' read -ra TASK_DATA <<< "${TASKS[$i]}"
  TYPE="${TASK_DATA[0]}"
  TITLE="${TASK_DATA[1]}"
  URL="https://$TYPE.com/task/$(date +%s)$i"
  
  curl -s -X POST "$BASE_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
      "jsonrpc": "2.0",
      "id": '$((20+i))',
      "method": "tools/call",
      "params": {
        "name": "tide_link_task",
        "arguments": {
          "tide_id": "'$TIDE_ID'",
          "task_url": "'$URL'",
          "task_title": "'$TITLE'",
          "task_type": "'$TYPE'"
        }
      }
    }' > /dev/null
done

echo -e "${GREEN}✅ Linked 6 completed tasks${NC}"

# Summary
echo ""
echo -e "${BLUE}🎉 Complete Synthetic Tide Created Successfully!${NC}"
echo -e "${YELLOW}Tide ID: ${CYAN}$TIDE_ID${NC}"
echo -e "${YELLOW}Contains:${NC}"
echo -e "  • 4 Flow Sessions (285 total minutes of focused work)"
echo -e "  • 6 Energy Level Updates (realistic daily energy curve)"  
echo -e "  • 6 Linked Tasks (from GitHub, Jira, Notion, Slack, Linear)"
echo -e "  • Rich contextual data for meaningful AI analysis"
echo ""
echo -e "${CYAN}Ready to test TideProductivityAgent!${NC}"
echo -e "Test command:"
echo -e "${YELLOW}./test-productivity-agent-live.sh 4 \"Based on my complete tide data, what productivity insights can you provide?\" \"$TIDE_ID\"${NC}"