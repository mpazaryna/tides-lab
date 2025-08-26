#!/bin/bash

# Simple script to create synthetic tide data manually
# Since MCP endpoints have issues, we'll create data step by step

set -e

# Configuration
BASE_URL="https://tides-001.mpazbot.workers.dev/mcp"
API_KEY="tides_testuser_001"

echo "🌊 Creating synthetic tide data manually..."

# Step 1: Create a tide using tools/call
echo "1. Creating tide..."
curl -X POST "$BASE_URL" \
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
        "name": "Daily Deep Work - Manual Test",
        "flow_type": "daily",
        "description": "Synthetic tide for agent testing with real flow patterns"
      }
    }
  }' > tide_creation.json

echo "Tide creation response:"
cat tide_creation.json | jq .

# Extract tide ID from response
TIDE_ID=$(cat tide_creation.json | jq -r '.result.content[0].text | fromjson | .tide.id')
echo "Created tide ID: $TIDE_ID"

if [ "$TIDE_ID" != "null" ] && [ -n "$TIDE_ID" ]; then
  echo "✅ Tide created successfully: $TIDE_ID"
  
  # Step 2: Start flow sessions
  echo "2. Starting flow sessions..."
  
  # Morning session
  curl -X POST "$BASE_URL" \
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
          "work_context": "Deep work: Feature development and code review"
        }
      }
    }' > flow1.json
  
  # Afternoon session  
  curl -X POST "$BASE_URL" \
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
          "duration": 45,
          "initial_energy": "medium", 
          "work_context": "Meetings and collaborative work"
        }
      }
    }' > flow2.json
  
  # Step 3: Add energy updates
  echo "3. Adding energy updates..."
  curl -X POST "$BASE_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
      "jsonrpc": "2.0",
      "id": 4,
      "method": "tools/call", 
      "params": {
        "name": "tide_add_energy",
        "arguments": {
          "tide_id": "'$TIDE_ID'",
          "energy_level": "high",
          "context": "Morning coffee kicked in, feeling very focused"
        }
      }
    }' > energy1.json
  
  curl -X POST "$BASE_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
      "jsonrpc": "2.0",
      "id": 5,
      "method": "tools/call",
      "params": {
        "name": "tide_add_energy", 
        "arguments": {
          "tide_id": "'$TIDE_ID'",
          "energy_level": "low",
          "context": "Post-lunch dip, struggling with concentration"
        }
      }
    }' > energy2.json
  
  # Step 4: Link tasks
  echo "4. Linking tasks..."
  curl -X POST "$BASE_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{
      "jsonrpc": "2.0", 
      "id": 6,
      "method": "tools/call",
      "params": {
        "name": "tide_link_task",
        "arguments": {
          "tide_id": "'$TIDE_ID'",
          "task_url": "https://github.com/user/project/issues/123",
          "task_title": "Implement real-time productivity analysis",
          "task_type": "github_issue"
        }
      }
    }' > task1.json
  
  echo "✅ Synthetic tide data created!"
  echo "Tide ID: $TIDE_ID"
  echo ""
  echo "Now testing the agent with this real data..."
  
  # Test the agent
  echo "5. Testing agent with real tide data..."
  ./test-productivity-agent-live.sh 4 "Based on my flow sessions, what were my most productive hours?" "$TIDE_ID"
  
else
  echo "❌ Failed to create tide"
  exit 1
fi

# Cleanup temp files
rm -f tide_creation.json flow1.json flow2.json energy1.json energy2.json task1.json