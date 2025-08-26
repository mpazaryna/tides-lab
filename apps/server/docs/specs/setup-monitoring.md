# Cloudflare Workers Monitoring Setup

## Overview

Cloudflare Workers provides several monitoring options:

1. **Built-in Analytics** - Available in the Cloudflare Dashboard
2. **GraphQL Analytics API** - Programmatic access to metrics
3. **Tail Workers** - Real-time log streaming and event processing
4. **Observability Bindings** - Analytics Engine for custom metrics

## 1. Dashboard Monitoring

The easiest way to monitor your Workers is through the Cloudflare Dashboard:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > **Overview** > **[Your Worker]**
3. View the **Metrics** tab for:
   - Request count
   - CPU time
   - Errors (including "Exceeded Memory" errors)
   - Success rate
   - Response times

## 2. GraphQL Analytics API

For programmatic access, use the Cloudflare GraphQL Analytics API.

### API Endpoint

```
https://api.cloudflare.com/client/v4/graphql
```

### Required Headers

- `Authorization: Bearer YOUR_API_TOKEN`
- `Content-Type: application/json`

### Example Query for Worker Analytics

```graphql
{
  viewer {
    accounts(filter: { accountTag: "YOUR_ACCOUNT_ID" }) {
      workersInvocationsAdaptive(
        filter: {
          scriptName: "tides"
          datetime_geq: "2025-07-30T00:00:00Z"
          datetime_leq: "2025-07-31T23:59:59Z"
        }
        limit: 10000
      ) {
        sum {
          requests
          errors
          subrequests
          duration
          cpuTime
        }
        dimensions {
          datetime
          status
        }
      }
    }
  }
}
```

## 3. Tail Workers (Real-time Monitoring)

Tail Workers allow you to process logs and events from your Workers in real-time.

### Enable in wrangler.toml

```toml
[observability]
enabled = true
```

### Create a Tail Worker

```javascript
export default {
  async tail(events) {
    // Process events from your main Worker
    const metrics = events.map((event) => ({
      timestamp: event.timestamp,
      outcome: event.outcome,
      exceptions: event.exceptions,
      logs: event.logs,
      scriptName: event.scriptName,
    }));

    // Send to external monitoring service
    await fetch("https://your-monitoring-endpoint.com", {
      method: "POST",
      body: JSON.stringify(metrics),
    });
  },
};
```

## 4. Using Wrangler CLI for Monitoring

### Live Tail Logs

```bash
# Stream logs in real-time
npx wrangler tail tides

# Filter logs
npx wrangler tail tides --format json

# Save logs to file
npx wrangler tail tides --format json > logs.json
```

### Get Worker Metrics

```bash
# Check deployment status and startup time
npx wrangler deploy --dry-run

# The deployment output shows startup_time_ms
```

## 5. Analytics Engine (Advanced)

For custom metrics, use Analytics Engine:

```javascript
// In your Worker
export default {
  async fetch(request, env) {
    // Track custom metric
    env.ANALYTICS.writeDataPoint({
      indexes: ["user_id"],
      blobs: [request.headers.get("User-Agent")],
      doubles: [Date.now()],
    });

    // Your regular handler
    return new Response("Hello");
  },
};
```

## Setting Up Alerts

While Cloudflare doesn't have built-in alerting for Workers, you can:

1. Use Tail Workers to send metrics to external monitoring services
2. Set up a cron job to query the GraphQL API and check thresholds
3. Use third-party services that integrate with Cloudflare's API

## Recommended Monitoring Strategy

1. **Basic Monitoring**: Use the Cloudflare Dashboard for quick checks
2. **Programmatic Access**: Use the metrics script (see metrics-fetcher.js) for automated monitoring
3. **Real-time Issues**: Use `wrangler tail` during debugging
4. **Production Alerts**: Implement a Tail Worker that sends data to your alerting system

## API Token Requirements

Create an API token with these permissions:

- Account > Cloudflare Workers Scripts > Read
- Account > Analytics > Read

Save as environment variable:

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```
