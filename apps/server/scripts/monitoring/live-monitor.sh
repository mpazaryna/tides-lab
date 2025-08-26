#!/bin/bash

# Cloudflare Workers Live Monitor
# 
# This script provides a live view of your Worker's logs and performance.
# It uses wrangler tail to stream logs in real-time.
#
# Usage:
#   ./live-monitor.sh [worker-name]
#
# Options:
#   worker-name - Name of the worker to monitor (default: tides)

WORKER_NAME=${1:-tides}

# Set wrangler log directory to project logs folder
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
export WRANGLER_LOG_PATH="$PROJECT_ROOT/logs"

echo "Starting live monitor for Worker: $WORKER_NAME"
echo "Press Ctrl+C to stop"
echo "================================================"

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Function to format JSON logs
format_logs() {
    while IFS= read -r line; do
        # Check if line is JSON
        if echo "$line" | jq -e . >/dev/null 2>&1; then
            # Parse JSON and format nicely
            echo "$line" | jq -r '
                "\(.timestamp | strftime("%Y-%m-%d %H:%M:%S")) [\(.outcome)] \(.scriptName)",
                if .exceptions | length > 0 then
                    "  ❌ Exceptions: \(.exceptions | join(", "))"
                else empty end,
                if .logs | length > 0 then
                    "  📝 Logs:",
                    (.logs[] | "     \(.message[0])")
                else empty end,
                "  ⏱️  CPU: \(.event.cpuTime // "N/A")ms, Duration: \(.event.duration // "N/A")ms",
                "---"
            ' 2>/dev/null || echo "$line"
        else
            # Not JSON, print as is
            echo "$line"
        fi
    done
}

# Start tailing with formatted output
if [ -t 1 ]; then
    # Terminal output - use formatting
    wrangler tail "$WORKER_NAME" --format json 2>&1 | format_logs
else
    # Piped output - keep raw JSON
    wrangler tail "$WORKER_NAME" --format json
fi