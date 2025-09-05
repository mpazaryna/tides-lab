/**
 * Entry point for Tides Agent Worker
 */

import { Coordinator } from './coordinator.js';
import type { Env } from './types.js';

// Export the Durable Object class for Cloudflare Workers
export { Coordinator };

// Default export for module worker
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Get the URL path to determine if this is a coordinator request
      const url = new URL(request.url);
      
      // For now, all requests go to the coordinator
      // In the future, we could route to different agents based on path
      
      // Create coordinator instance
      const coordinatorId = env.COORDINATOR.idFromName('default-coordinator');
      const coordinator = env.COORDINATOR.get(coordinatorId);
      
      // Forward request to coordinator
      return await coordinator.fetch(request);
      
    } catch (error) {
      console.error('[Agent Worker] Unhandled error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};