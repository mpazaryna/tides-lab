/**
 * Cloudflare Workers Binding Test Utility
 * 
 * @fileoverview A diagnostic tool for verifying Cloudflare Workers environment bindings.
 * This worker helps debug and validate that KV namespaces, D1 databases, R2 buckets,
 * and environment variables are properly configured and accessible within a Worker.
 * 
 * @module binding-test
 * @author Tides Development Team
 * @created 2025-07-31
 * @deprecated Archived as of 2025-08-01 - Production bindings are now stable
 * 
 * @example
 * // Deploy this worker and visit https://your-worker.workers.dev/test
 * // Response will show which bindings are available:
 * {
 *   "hasKV": false,
 *   "hasD1": true,
 *   "hasR2": false,
 *   "hasVar": true,
 *   "varValue": "Hello from vars",
 *   "envKeys": ["TEST_VAR", "TEST_DB"],
 *   "envEntries": [["TEST_VAR", "string"], ["TEST_DB", "object"]]
 * }
 * 
 * @see {@link https://developers.cloudflare.com/workers/runtime-apis/bindings/} Cloudflare Bindings Documentation
 */

export default {
  /**
   * Main fetch handler for the binding test worker
   * 
   * @param {Request} request - The incoming HTTP request
   * @param {Object} env - Worker environment containing bindings
   * @param {KVNamespace} [env.TEST_KV] - Test KV namespace binding
   * @param {D1Database} [env.TEST_DB] - Test D1 database binding
   * @param {R2Bucket} [env.TEST_R2] - Test R2 bucket binding
   * @param {string} [env.TEST_VAR] - Test environment variable
   * @param {ExecutionContext} ctx - Worker execution context
   * @returns {Response} JSON response with binding status or welcome message
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/test') {
      /**
       * @typedef {Object} BindingStatus
       * @property {boolean} hasKV - Whether KV namespace is bound
       * @property {boolean} hasD1 - Whether D1 database is bound
       * @property {boolean} hasR2 - Whether R2 bucket is bound
       * @property {boolean} hasVar - Whether test variable exists
       * @property {string|undefined} varValue - Value of TEST_VAR if present
       * @property {string[]} envKeys - All environment binding keys
       * @property {Array<[string, string]>} envEntries - Binding keys with their types
       */
      const bindings = {
        hasKV: !!env.TEST_KV,
        hasD1: !!env.TEST_DB,
        hasR2: !!env.TEST_R2,
        hasVar: !!env.TEST_VAR,
        varValue: env.TEST_VAR,
        envKeys: Object.keys(env),
        envEntries: Object.entries(env).map(([k, v]) => [k, typeof v])
      };
      
      return new Response(JSON.stringify(bindings, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Test worker - visit /test');
  }
};