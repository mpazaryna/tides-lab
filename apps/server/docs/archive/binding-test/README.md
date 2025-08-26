# Cloudflare Workers Binding Test Utility

## Overview

This directory contains a diagnostic Cloudflare Worker designed to verify environment bindings configuration. It was created during the initial Tides project setup to troubleshoot and validate that various Cloudflare services were properly bound to the worker environment.

## Purpose

The binding test worker serves as a simple health check for:
- **KV Namespaces** - Key-value storage bindings
- **D1 Databases** - SQL database bindings
- **R2 Buckets** - Object storage bindings
- **Environment Variables** - Custom configuration values

## Usage

1. Deploy the worker:
   ```bash
   cd binding-test
   wrangler deploy
   ```

2. Visit the test endpoint:
   ```
   https://your-worker.workers.dev/test
   ```

3. Review the JSON response showing binding status:
   ```json
   {
     "hasKV": false,
     "hasD1": true,
     "hasR2": false,
     "hasVar": true,
     "varValue": "Hello from vars",
     "envKeys": ["TEST_VAR", "TEST_DB"],
     "envEntries": [["TEST_VAR", "string"], ["TEST_DB", "object"]]
   }
   ```

## Configuration

The `wrangler.toml` file contains the binding configuration:
- `TEST_VAR` - A simple environment variable for testing
- `TEST_DB` - D1 database binding pointing to the production Tides database

## Status

**Archived**: As of August 1, 2025, this utility has been archived as the production environment bindings are now stable and properly configured. The code remains available for reference and can be reactivated if binding issues arise in the future.

## Related Documentation

- [Cloudflare Workers Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- Main Tides project: `../../README.md`