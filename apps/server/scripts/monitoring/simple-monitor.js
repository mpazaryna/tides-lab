#!/usr/bin/env node

/**
 * Simple Cloudflare Workers Monitor using Wrangler CLI
 * 
 * This script provides basic monitoring using wrangler commands.
 * Use this as a fallback when GraphQL API access is not available.
 * 
 * Usage:
 *   node scripts/simple-monitor.js [worker-name]
 * 
 * Requirements:
 *   - wrangler CLI installed and authenticated
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

// Set wrangler log directory to project logs folder
const projectRoot = join(__dirname, '..');
const logsDir = join(projectRoot, 'logs');
process.env.WRANGLER_LOG_PATH = logsDir;

// Configuration
const WORKER_NAME = process.argv[2] || 'tides';

async function checkWorkerStatus() {
  try {
    console.log(`Checking status for Worker: ${WORKER_NAME}`);
    console.log('='.repeat(50));

    // Check if wrangler is installed
    try {
      await execAsync('npx wrangler --version');
    } catch (error) {
      try {
        await execAsync('npx wrangler --version');
      } catch (error2) {
        console.error('❌ Wrangler CLI not found. Please install with: npm install -g wrangler');
        process.exit(1);
      }
    }

    // Check authentication
    try {
      const { stdout: whoami } = await execAsync('npx wrangler whoami');
      console.log('✅ Authentication:', whoami.trim());
    } catch (error) {
      console.error('❌ Not authenticated. Run: npx wrangler login');
      process.exit(1);
    }

    // Check if worker exists and get basic info
    try {
      const { stdout: listOutput } = await execAsync('npx wrangler list');
      const lines = listOutput.split('\n');
      const workerLine = lines.find(line => line.includes(WORKER_NAME));

      if (workerLine) {
        console.log('✅ Worker found:', workerLine.trim());
      } else {
        console.log('⚠️  Worker not found in deployment list');
        console.log('Available workers:');
        lines.forEach(line => {
          if (line.trim() && !line.includes('name')) {
            console.log('  -', line.trim());
          }
        });
      }
    } catch (error) {
      console.log('⚠️  Could not list workers:', error.message);
    }

    // Test deployment with dry run to get startup time
    try {
      console.log('\n📊 Testing deployment (dry-run for metrics)...');
      const { stdout: deployOutput } = await execAsync(`npx wrangler deploy --dry-run`);

      // Look for startup time in output
      const startupMatch = deployOutput.match(/startup_time_ms:\s*(\d+)/);
      if (startupMatch) {
        console.log(`⚡ Startup time: ${startupMatch[1]}ms`);
      }

      console.log('✅ Deployment check passed');
    } catch (error) {
      console.log('⚠️  Deployment check failed:', error.message);
    }

    // Get recent deployments info
    try {
      console.log('\n📈 Recent deployment info...');
      const { stdout: statusOutput } = await execAsync(`npx wrangler status`);
      console.log(statusOutput);
    } catch (error) {
      console.log('⚠️  Could not get status:', error.message);
    }

    console.log('\n✨ Basic monitoring check completed');
    console.log('💡 For real-time logs, run: npm run monitor:live');
    console.log('💡 For detailed analytics (requires API permissions), run: npm run monitor');

  } catch (error) {
    console.error('❌ Monitoring check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkWorkerStatus();