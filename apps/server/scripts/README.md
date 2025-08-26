# Cloudflare Workers Monitoring Scripts

This directory contains scripts to monitor your Cloudflare Workers deployment.

## Prerequisites

1. Create a Cloudflare API token with these permissions:
   - Account > Cloudflare Workers Scripts > Read
   - Account > Analytics > Read

2. Configuration is automatically loaded from:
   - **`.dev.vars`** - Contains your `CLOUDFLARE_API_TOKEN`
   - **`wrangler.toml`** - Contains your `CLOUDFLARE_ACCOUNT_ID`

   No need to set environment variables! The scripts will read from these files automatically.

   If you need to override or haven't set up these files, you can still use environment variables:

   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
   ```

## Available Scripts

### Directory Structure

- **[monitoring/](#monitoring-scripts)** - Worker analytics and health monitoring scripts
- **[tide-creation/](#tide-creation-scripts)** - Scripts for creating different types of tides
- **[testing/](#testing-scripts)** - Productivity agent and system testing utilities
- **[setup/](#setup-scripts)** - Environment and deployment setup scripts
- **[debug/](#debug-utilities)** - Development debugging and troubleshooting utilities
- **[benchmark/](#benchmark-scripts)** - Performance testing and benchmarking tools
- **[lib/](#library-utilities)** - Shared utility functions and configuration loaders

### Debug Utilities

See [debug/README.md](debug/README.md) for development and debugging utilities including:

- `debug-template-processing.js` - MCP prompt template debugging
- `extract-sse-data.js` - Server-Sent Events parsing utility
- `debug-server.js` - MCP server debugging tool

## Monitoring Scripts

### 1. monitoring/metrics-fetcher.js

Fetches and displays Worker analytics from the GraphQL API.

```bash
# Basic usage (last 24 hours)
npm run monitor

# Last 6 hours
node scripts/monitoring/metrics-fetcher.js --hours 6

# Different worker
node scripts/monitoring/metrics-fetcher.js --worker my-other-worker

# Raw JSON output
node scripts/monitoring/metrics-fetcher.js --json

# Help
node scripts/monitoring/metrics-fetcher.js --help
```

**Output includes:**

- Total requests and errors
- Success rate
- Average duration
- Status code breakdown
- Recent activity

**Note:** Requires proper GraphQL API permissions. If you get authorization errors, use the simple monitor instead.

### 2. monitoring/simple-monitor.js

Basic monitoring using Wrangler CLI (fallback when GraphQL API isn't available).

```bash
# Check worker status
npm run monitor:simple

# Check specific worker
node scripts/monitoring/simple-monitor.js my-worker
```

**Features:**

- Authentication check
- Deployment validation
- Startup time measurement
- No API permissions required

### 3. monitoring/monitor-alerts.js

Monitors Worker health and sends alerts when thresholds are exceeded.

```bash
# Run once
node scripts/monitoring/monitor-alerts.js

# Set up as cron job (every 5 minutes)
*/5 * * * * cd /path/to/tides && node scripts/monitoring/monitor-alerts.js >> logs/monitor.log 2>&1
```

**Default thresholds:**

- Error rate > 5%
- CPU time P99 > 50ms
- Response time P99 > 1000ms

**Alert destinations:**

- Console output (default)
- Webhook URL (Slack/Discord compatible)

To use webhooks:

```bash
export WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### 4. monitoring/live-monitor.sh

Streams Worker logs in real-time using wrangler tail.

```bash
# Monitor default worker (tides)
./scripts/monitoring/live-monitor.sh

# Monitor specific worker
./scripts/monitoring/live-monitor.sh my-worker

# Save to file
./scripts/monitoring/live-monitor.sh > worker-logs.txt

# Pipe to grep for filtering
./scripts/monitoring/live-monitor.sh | grep ERROR
```

**Features:**

- Real-time log streaming
- Formatted output for terminal
- Raw JSON when piped
- Shows exceptions, logs, and performance metrics

## Setting Up Monitoring

### Quick Start

1. Set up environment variables
2. Test metrics fetching:
   ```bash
   node scripts/monitoring/metrics-fetcher.js --hours 1
   ```
3. Test live monitoring:
   ```bash
   ./scripts/monitoring/live-monitor.sh
   ```

### Production Setup

1. The logs directory is already created and configured to store all Wrangler logs locally in `./logs/`

2. Add cron job for alerts:

   ```bash
   crontab -e
   # Add this line:
   */5 * * * * cd /path/to/tides && node scripts/monitoring/monitor-alerts.js >> logs/monitor.log 2>&1
   ```

3. Set up log rotation:
   ```bash
   # /etc/logrotate.d/tides-monitor
   /path/to/tides/logs/*.log {
       daily
       rotate 7
       compress
       delaycompress
       missingok
       notifempty
   }
   ```

### Integration with External Services

#### Slack Webhook

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Set environment variable:
   ```bash
   export WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```

#### Custom Monitoring Service

Modify `monitoring/monitor-alerts.js` to send data to your monitoring service:

- Datadog
- New Relic
- PagerDuty
- Custom HTTP endpoint

## Troubleshooting

### No data returned

- Verify worker name is correct
- Check if worker has received traffic in the time period
- Ensure API token has correct permissions

### Authentication errors

- Verify CLOUDFLARE_API_TOKEN is set correctly
- Check token permissions include Analytics Read
- Ensure CLOUDFLARE_ACCOUNT_ID matches your account

### Wrangler tail not working

- Ensure wrangler is installed: `npm install -g wrangler`
- Verify you're authenticated: `wrangler whoami`
- Check worker name is correct

## Example Output

### monitoring/metrics-fetcher.js

```
Cloudflare Worker Analytics: tides
Time Range: 7/30/2025, 3:00:00 PM - 7/31/2025, 3:00:00 PM
============================================================

Summary:
  Total Requests: 1,234
  Total Errors: 12 (0.97%)
  Success Rate: 99.03%
  Avg Duration: 45.23ms
  Avg CPU Time: 12.34ms

Status Breakdown:
  200: 1,200 (97.24%)
  404: 22 (1.78%)
  500: 12 (0.97%)

Performance Percentiles:
  CPU Time P50: 10.50ms
  CPU Time P90: 22.30ms
  CPU Time P99: 48.90ms
  Duration P50: 35.20ms
  Duration P90: 82.10ms
  Duration P99: 125.50ms
```

### monitoring/monitor-alerts.js

```
[2025-07-31T15:30:00.123Z] Monitor check completed
  Requests: 234, Errors: 15 (6.41%)
  CPU P99: 52.34ms, Duration P99: 890.12ms
  Alerts sent: 2
ALERT: High error rate detected: 6.41%
Details: { 'Error Rate': '6.41%', 'Total Errors': 15, 'Total Requests': 234, 'Threshold': '5%' }
ALERT: High CPU time detected: P99 = 52.34ms
Details: { 'CPU Time P99': '52.34ms', 'Threshold': '50ms', 'Time Period': 'Last 5 minutes' }
```

## Tide Creation Scripts

### tide-creation/create-complete-tide.sh

Creates a comprehensive productivity tide with all flow types and metadata.

```bash
# Create a complete tide
./scripts/tide-creation/create-complete-tide.sh
```

### tide-creation/create-manual-tide.sh

Creates a manually configured tide with user-specified parameters.

```bash
# Create a manual tide
./scripts/tide-creation/create-manual-tide.sh
```

### tide-creation/create-sample-tide.sh

Creates a sample tide for testing and demonstration purposes.

```bash
# Create a sample tide
./scripts/tide-creation/create-sample-tide.sh
```

**Data Files:**

- `tide_creation.json` - Tide creation template data
- `response.json` - Sample API response format

## Testing Scripts

### testing/test-productivity-agent.sh

Tests the TideProductivityAgent functionality and MCP integration.

```bash
# Test productivity agent
./scripts/testing/test-productivity-agent.sh
```

### testing/test-productivity-agent-live.sh

Live testing of productivity agent against deployed environment.

```bash
# Test against live environment
./scripts/testing/test-productivity-agent-live.sh
```

## Setup Scripts

### setup/setup-environments.sh

Configures and sets up all deployment environments (tides-001, tides-002, tides-003).

```bash
# Set up all environments
./scripts/setup/setup-environments.sh
```

**Features:**

- Creates D1 databases
- Configures R2 buckets
- Sets up Durable Objects
- Validates environment configuration

## Benchmark Scripts

### benchmark/benchmark.ts

Performance benchmarking utilities for load testing and optimization.

```bash
# Run benchmarks
npm run benchmark
```

### benchmark/run-benchmark.ts

Automated benchmark execution and reporting.

## Library Utilities

### lib/config-loader.js

Shared configuration loading utilities used across scripts.

**Features:**

- Loads from `.dev.vars` and `wrangler.toml`
- Environment variable fallbacks
- Centralized configuration management
