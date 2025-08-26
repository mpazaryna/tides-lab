#!/usr/bin/env node

/**
 * Configuration loader for monitoring scripts
 * Loads values from .dev.vars and wrangler.toml to avoid manual environment setup
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadConfig() {
  const config = {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    WEBHOOK_URL: process.env.WEBHOOK_URL
  };

  // Try to load from .dev.vars file
  const devVarsPath = join(__dirname, '../../.dev.vars');
  if (existsSync(devVarsPath)) {
    try {
      const devVars = readFileSync(devVarsPath, 'utf8');
      const lines = devVars.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            // Only override if not already set in environment
            if (!config[key]) {
              config[key] = value.trim();
            }
          }
        }
      });
    } catch (error) {
      console.warn('Warning: Could not read .dev.vars file:', error.message);
    }
  }

  // Try to load account ID from wrangler.toml if not set
  if (!config.CLOUDFLARE_ACCOUNT_ID) {
    const wranglerPath = join(__dirname, '../../wrangler.toml');
    if (existsSync(wranglerPath)) {
      try {
        const wranglerContent = readFileSync(wranglerPath, 'utf8');
        const match = wranglerContent.match(/CLOUDFLARE_ACCOUNT_ID\s*=\s*"([^"]+)"/);
        if (match) {
          config.CLOUDFLARE_ACCOUNT_ID = match[1];
        }
      } catch (error) {
        console.warn('Warning: Could not read wrangler.toml file:', error.message);
      }
    }
  }

  return config;
}