#!/usr/bin/env node

/**
 * Cloudflare Workers Monitoring & Alerting Script
 * 
 * This script monitors your Worker's health and sends alerts when thresholds are exceeded.
 * Designed to be run as a cron job (e.g., every 5 minutes).
 * 
 * Usage:
 *   node monitor-alerts.js
 * 
 * Environment variables required:
 *   CLOUDFLARE_API_TOKEN - Your Cloudflare API token
 *   CLOUDFLARE_ACCOUNT_ID - Your Cloudflare account ID
 *   WEBHOOK_URL - (Optional) Webhook URL for alerts (Slack, Discord, etc.)
 */

import https from 'https';
import { loadConfig } from './lib/config-loader.js';

// Load configuration from .dev.vars and wrangler.toml
const configFromFiles = loadConfig();

// Configuration
const CONFIG = {
  worker: 'tides',
  checkInterval: 5, // minutes to look back
  thresholds: {
    errorRate: 5, // Alert if error rate > 5%
    cpuTimeP99: 50, // Alert if P99 CPU time > 50ms
    durationP99: 1000, // Alert if P99 duration > 1000ms
    minRequests: 10 // Minimum requests to trigger alerts (avoid false positives)
  }
};

// Check for required configuration
const API_TOKEN = configFromFiles.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = configFromFiles.CLOUDFLARE_ACCOUNT_ID;
const WEBHOOK_URL = configFromFiles.WEBHOOK_URL;

if (!API_TOKEN || !ACCOUNT_ID) {
  console.error('Error: Missing required configuration');
  console.error('Please ensure CLOUDFLARE_API_TOKEN is in .dev.vars or environment');
  console.error('and CLOUDFLARE_ACCOUNT_ID is in wrangler.toml or environment');
  process.exit(1);
}

// Calculate date range
const now = new Date();
const minutesAgo = new Date(now.getTime() - (CONFIG.checkInterval * 60 * 1000));

// Function to send webhook alert
async function sendAlert(message, details) {
  if (!WEBHOOK_URL) {
    console.log('ALERT:', message);
    console.log('Details:', details);
    return;
  }

  // Format for common webhook services
  const payload = {
    text: `🚨 Cloudflare Worker Alert: ${CONFIG.worker}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      },
      {
        type: 'section',
        fields: Object.entries(details).map(([key, value]) => ({
          type: 'mrkdwn',
          text: `*${key}:* ${value}`
        }))
      }
    ]
  };

  // Send webhook
  const webhookUrl = new URL(WEBHOOK_URL);
  const postData = JSON.stringify(payload);
  
  const options = {
    hostname: webhookUrl.hostname,
    port: 443,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {}); // Consume response
      res.on('end', () => resolve());
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// GraphQL query
const query = {
  query: `
    query GetWorkerMetrics($accountTag: String!, $scriptName: String!, $datetimeStart: String!, $datetimeEnd: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            filter: {
              scriptName: $scriptName
              datetime_geq: $datetimeStart
              datetime_leq: $datetimeEnd
            }
            limit: 10000
          ) {
            sum {
              requests
              errors
              subrequests
              duration
            }
            dimensions {
              datetime
              status
            }
          }
        }
      }
    }
  `,
  variables: {
    accountTag: ACCOUNT_ID,
    scriptName: CONFIG.worker,
    datetimeStart: minutesAgo.toISOString(),
    datetimeEnd: now.toISOString()
  }
};

// Make the API request
const postData = JSON.stringify(query);

const requestOptions = {
  hostname: 'api.cloudflare.com',
  port: 443,
  path: '/client/v4/graphql',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(requestOptions, async (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', async () => {
    try {
      const result = JSON.parse(data);
      
      if (result.errors) {
        console.error('API Errors:', result.errors);
        process.exit(1);
      }

      const analytics = result.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive || [];
      
      if (analytics.length === 0) {
        console.log(`No data found for worker "${CONFIG.worker}" in the last ${CONFIG.checkInterval} minutes`);
        return;
      }

      // Calculate metrics
      let totalRequests = 0;
      let totalErrors = 0;
      let totalDuration = 0;

      analytics.forEach(item => {
        if (item.sum) {
          totalRequests += item.sum.requests || 0;
          totalErrors += item.sum.errors || 0;
          totalDuration += item.sum.duration || 0;
        }
      });

      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
      const avgDuration = totalRequests > 0 ? totalDuration / totalRequests : 0;
      
      // Check thresholds and send alerts
      const alerts = [];

      if (totalRequests >= CONFIG.thresholds.minRequests) {
        if (errorRate > CONFIG.thresholds.errorRate) {
          alerts.push({
            message: `High error rate detected: ${errorRate.toFixed(2)}%`,
            details: {
              'Error Rate': `${errorRate.toFixed(2)}%`,
              'Total Errors': totalErrors,
              'Total Requests': totalRequests,
              'Threshold': `${CONFIG.thresholds.errorRate}%`
            }
          });
        }

        if (avgDuration > CONFIG.thresholds.durationP99) {
          alerts.push({
            message: `High response time detected: Avg = ${avgDuration.toFixed(2)}ms`,
            details: {
              'Avg Duration': `${avgDuration.toFixed(2)}ms`,
              'Threshold': `${CONFIG.thresholds.durationP99}ms`,
              'Time Period': `Last ${CONFIG.checkInterval} minutes`
            }
          });
        }
      }

      // Send alerts
      for (const alert of alerts) {
        await sendAlert(alert.message, alert.details);
      }

      // Log status
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Monitor check completed`);
      console.log(`  Requests: ${totalRequests}, Errors: ${totalErrors} (${errorRate.toFixed(2)}%)`);
      console.log(`  Avg Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Alerts sent: ${alerts.length}`);

    } catch (error) {
      console.error('Error processing metrics:', error);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

req.write(postData);
req.end();