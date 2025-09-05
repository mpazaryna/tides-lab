/**
 * Authentication and authorization utilities for Tides Agent
 */

import type { Env } from './types.js';

/**
 * Hash API key using SHA-256
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const keyBuffer = new TextEncoder().encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate API key format and authenticate user
 */
export async function validateRequest(apiKey: string, tidesId: string, env: Env): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Validate API key format
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        valid: false,
        error: 'Invalid API key format: API key is required'
      };
    }

    // Expected format: tides_{userId}_{randomId}
    // Note: userId may contain underscores, so we need to handle this carefully
    const parts = apiKey.split('_');
    if (parts.length < 3 || parts[0] !== 'tides' || !parts[parts.length - 1]) {
      return {
        valid: false,
        error: 'Invalid API key format: must be in format tides_{userId}_{randomId}'
      };
    }

    // Extract userId as everything between 'tides' and the last part (randomId)
    const userId = parts.slice(1, -1).join('_');
    
    // Validate that userId is not empty
    if (!userId) {
      return {
        valid: false,
        error: 'Invalid API key format: must be in format tides_{userId}_{randomId}'
      };
    }

    // Validate tides ID
    if (!tidesId || typeof tidesId !== 'string') {
      return {
        valid: false,
        error: 'Tides ID is required'
      };
    }

    // Hash the API key to look up in KV
    const hashedKey = await hashApiKey(apiKey);

    // Look up API key in KV storage
    const apiKeyData = await env.TIDES_AUTH_KV.get(`api_key:${hashedKey}`);
    if (!apiKeyData) {
      return {
        valid: false,
        error: 'Invalid API key'
      };
    }

    let parsedData;
    try {
      parsedData = JSON.parse(apiKeyData);
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key'
      };
    }

    // Verify the stored hash matches our calculated hash
    if (parsedData.api_key_hash !== hashedKey) {
      return {
        valid: false,
        error: 'Invalid API key'
      };
    }

    // Verify user ID matches
    if (parsedData.user_id !== userId) {
      return {
        valid: false,
        error: 'Invalid API key'
      };
    }

    // Check tides ownership (if tide exists)
    const tideData = await env.TIDES_AUTH_KV.get(`tide:${tidesId}`);
    if (tideData) {
      try {
        const parsedTideData = JSON.parse(tideData);
        if (parsedTideData.user_id !== userId) {
          return {
            valid: false,
            error: 'Tides ID does not belong to authenticated user'
          };
        }
      } catch (error) {
        // If we can't parse tide data, still allow the request
        // The service will handle the "tide not found" case
      }
    }

    return {
      valid: true,
      userId: userId
    };

  } catch (error) {
    return {
      valid: false,
      error: 'Authentication service temporarily unavailable'
    };
  }
}

export class AuthService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Validate API key against stored hash in KV
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      // Hash the provided API key using SHA-256
      const keyBuffer = new TextEncoder().encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashedKey = Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');

      // Look up the hashed key in KV storage
      const userData = await this.env.TIDES_AUTH_KV.get(hashedKey);
      
      if (!userData) {
        console.log(`[AuthService] API key not found: ${hashedKey.substring(0, 10)}...`);
        return { valid: false };
      }

      const user = JSON.parse(userData);
      console.log(`[AuthService] API key validated for user: ${user.user_id}`);
      
      return {
        valid: true,
        userId: user.user_id
      };

    } catch (error) {
      console.error('[AuthService] API key validation failed:', error);
      return { valid: false };
    }
  }

  /**
   * Validate tides_id format and ownership
   */
  async validateTidesId(tidesId: string, userId: string): Promise<boolean> {
    try {
      // Basic format validation
      if (!tidesId || typeof tidesId !== 'string') {
        console.log('[AuthService] Invalid tides_id format');
        return false;
      }

      // TODO: In real implementation, check if tide exists and belongs to user
      // For now, just validate format and return true for mock implementation
      console.log(`[AuthService] Tides ID validated: ${tidesId} for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('[AuthService] Tides ID validation failed:', error);
      return false;
    }
  }

  /**
   * Extract and validate authorization from request
   */
  async validateRequest(request: Request): Promise<{
    valid: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Parse request body to get api_key
      const body = await request.json() as { api_key?: string; tides_id?: string };
      
      if (!body.api_key) {
        return {
          valid: false,
          error: 'api_key is required in request body'
        };
      }

      if (!body.tides_id) {
        return {
          valid: false,
          error: 'tides_id is required in request body'
        };
      }

      // Validate API key
      const apiKeyResult = await this.validateApiKey(body.api_key);
      if (!apiKeyResult.valid || !apiKeyResult.userId) {
        return {
          valid: false,
          error: 'Invalid API key'
        };
      }

      // Validate tides_id
      const tidesIdValid = await this.validateTidesId(body.tides_id, apiKeyResult.userId);
      if (!tidesIdValid) {
        return {
          valid: false,
          error: 'Invalid tides_id or access denied'
        };
      }

      return {
        valid: true,
        userId: apiKeyResult.userId
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate request'
      };
    }
  }
}