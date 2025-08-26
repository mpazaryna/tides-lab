#!/usr/bin/env node

/**
 * Cloudflare Workers Metrics Fetcher
 * 
 * This script fetches analytics data for your Cloudflare Worker using the GraphQL API.
 * 
 * Usage:
 *   node metrics-fetcher.js [options]
 * 
 * Options:
 *   --hours <number>    Number of hours to look back (default: 24)
 *   --worker <name>     Worker name (default: tides)
 *   --json              Output raw JSON
 * 
 * Environment variables required:
 *   CLOUDFLARE_API_TOKEN - Your Cloudflare API token
 *   CLOUDFLARE_ACCOUNT_ID - Your Cloudflare account ID
 */

import https from 'https';
import { loadConfig } from './lib/config-loader.js';

// Load configuration from .dev.vars and wrangler.toml
const config = loadConfig();

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  hours: 24,
  worker: 'tides',
  json: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--hours':
      options.hours = parseInt(args[++i]) || 24;
      break;
    case '--worker':
      options.worker = args[++i];
      break;
    case '--json':
      options.json = true;
      break;
    case '--help':
      console.log(`
Cloudflare Workers Metrics Fetcher

Usage:
  node metrics-fetcher.js [options]

Options:
  --hours <number>    Number of hours to look back (default: 24)
  --worker <name>     Worker name (default: tides)
  --json              Output raw JSON
  --help              Show this help message

Environment variables required:
  CLOUDFLARE_API_TOKEN - Your Cloudflare API token
  CLOUDFLARE_ACCOUNT_ID - Your Cloudflare account ID
      `);
      process.exit(0);
  }
}

// Check for required configuration
const API_TOKEN = config.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = config.CLOUDFLARE_ACCOUNT_ID;

if (!API_TOKEN || !ACCOUNT_ID) {
  console.error('Error: Missing required configuration');
  console.error('Please ensure CLOUDFLARE_API_TOKEN is in .dev.vars or environment');
  console.error('and CLOUDFLARE_ACCOUNT_ID is in wrangler.toml or environment');
  console.error('');
  console.error('Current config:');
  console.error(`  API_TOKEN: ${API_TOKEN ? '***' + API_TOKEN.slice(-4) : 'NOT SET'}`);
  console.error(`  ACCOUNT_ID: ${ACCOUNT_ID || 'NOT SET'}`);
  process.exit(1);
}

// Calculate date range
const now = new Date();
const hoursAgo = new Date(now.getTime() - (options.hours * 60 * 60 * 1000));

// GraphQL query for Worker analytics
const query = {
  query: `
    query GetWorkerAnalytics($accountTag: String!, $scriptName: String!, $datetimeStart: String!, $datetimeEnd: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            filter: {
              scriptName: $scriptName
              datetime_geq: $datetimeStart
              datetime_leq: $datetimeEnd
            }
            limit: 10000
            orderBy: [datetime_ASC]
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
    scriptName: options.worker,
    datetimeStart: hoursAgo.toISOString(),
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

const req = https.request(requestOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.errors) {
        console.error('API Errors:', result.errors);
        process.exit(1);
      }

      // Process and display the results
      const analytics = result.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive || [];
      
      if (analytics.length === 0) {
        console.log(`No data found for worker "${options.worker}" in the last ${options.hours} hours`);
        return;
      }

      console.log(`\nCloudflare Worker Analytics: ${options.worker}`);
      console.log(`Time Range: ${hoursAgo.toLocaleString()} - ${now.toLocaleString()}`);
      console.log('=' .repeat(60));

      // Calculate totals
      let totalRequests = 0;
      let totalErrors = 0;
      let totalDuration = 0;
      const statusCounts = {};

      analytics.forEach(item => {
        if (item.sum) {
          totalRequests += item.sum.requests || 0;
          totalErrors += item.sum.errors || 0;
          totalDuration += item.sum.duration || 0;
        }
        
        if (item.dimensions?.status) {
          statusCounts[item.dimensions.status] = (statusCounts[item.dimensions.status] || 0) + (item.sum?.requests || 0);
        }
      });

      // Display summary
      console.log('\nSummary:');
      console.log(`  Total Requests: ${totalRequests.toLocaleString()}`);
      console.log(`  Total Errors: ${totalErrors.toLocaleString()} (${((totalErrors/totalRequests) * 100).toFixed(2)}%)`);
      console.log(`  Success Rate: ${(((totalRequests - totalErrors)/totalRequests) * 100).toFixed(2)}%`);
      console.log(`  Avg Duration: ${totalRequests > 0 ? (totalDuration/totalRequests).toFixed(2) : 0}ms`);

      // Display status breakdown
      console.log('\nStatus Breakdown:');
      Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
        console.log(`  ${status}: ${count.toLocaleString()} (${((count/totalRequests) * 100).toFixed(2)}%)`);
      });

      // Show recent activity
      console.log('\nRecent Activity (last 5 data points):');
      analytics.slice(-5).forEach(item => {
        const time = new Date(item.dimensions.datetime).toLocaleString();
        console.log(`  ${time}: ${item.sum.requests} requests, ${item.sum.errors} errors`);
      });

    } catch (error) {
      console.error('Error parsing response:', error);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

// Send the request
req.write(postData);
req.end();