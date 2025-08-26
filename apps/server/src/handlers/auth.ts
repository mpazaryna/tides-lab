/**
 * @fileoverview Authentication MCP Handlers - API Key Validation Tools
 * 
 * This module handles the registration of authentication-related MCP tools
 * for testing multi-user authentication flows and API key validation.
 * 
 * Follows Cloudflare MCP Server patterns for security-focused tools with
 * proper error handling and informative responses for debugging auth issues.
 * 
 * @author Tides Development Team
 * @version 2.1.0
 * @since 2025-08-07
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TideStorage } from "../storage";
import { createStorage } from "../storage";

/**
 * Register authentication-related MCP tools with the server
 * 
 * Implements security best practices with:
 * - Careful validation of API keys
 * - Informative error messages for debugging
 * - Clear success/failure response formatting
 * - Support for different storage backend capabilities
 * 
 * @param server - The MCP server instance to register tools with
 * @param storage - Storage instance for auth operations
 */
export function registerAuthHandlers(server: McpServer, storage: TideStorage) {
  /**
   * MCP Tool: auth_key_validate
   * 
   * Validates API keys and returns user information for testing multi-user
   * authentication flows. Essential for development and debugging.
   * 
   * Following service_noun_verb pattern: auth_key_validate
   */
  server.registerTool(
    "auth_validate_key",
    {
      title: "Validate API Key",
      description: "Validate an API key and return user information for testing multi-user authentication flows. Use for debugging auth issues, testing user isolation, and verifying API key validity. Returns user details or error information.",
      inputSchema: {
        api_key: z.string().describe("API key to validate"),
      },
    },
    async ({ api_key }) => {
      try {
        // Check if storage has the validateApiKey method (D1R2HybridStorage)
        if ('validateApiKey' in storage && typeof storage.validateApiKey === 'function') {
          const authContext = await (storage as any).validateApiKey(api_key);
          
          if (authContext) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    valid: true,
                    user_id: authContext.userId,
                    api_key_name: authContext.apiKeyName,
                    message: `API key validated successfully for user: ${authContext.userId}`,
                  }, null, 2),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    valid: false,
                    message: "Invalid API key provided",
                  }, null, 2),
                },
              ],
            };
          }
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "API key validation not supported by current storage backend",
                }, null, 2),
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Error validating API key: ${error instanceof Error ? error.message : String(error)}`,
              }, null, 2),
            },
          ],
        };
      }
    },
  );
}

/**
 * API Key Registration Schema for validation
 */
const ApiKeyRegistrationSchema = z.object({
  api_key: z.string().min(1).describe("The API key to register"),
  user_id: z.string().min(1).describe("The user ID associated with this key"),
  user_email: z.string().email().describe("The user's email address from Supabase"),
  name: z.string().optional().describe("Optional name for the API key")
});

/**
 * Hash API key using SHA-256
 */
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Register API Key Handler
 * 
 * Accepts mobile-generated API keys and stores them in D1 database
 * for authentication validation. This bridges the gap between mobile
 * key generation and server-side validation.
 */
export async function registerApiKey(request: Request, env: Env): Promise<Response> {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  };

  console.log("[API-KEY-REG] Starting API key registration");

  try {
    // Parse request body
    const body = await request.json() as any;
    console.log("[API-KEY-REG] Request body received:", { 
      hasApiKey: !!body.api_key, 
      hasUserId: !!body.user_id,
      hasUserEmail: !!body.user_email,
      apiKeyLength: body.api_key?.length || 0
    });

    // Validate input
    const validation = ApiKeyRegistrationSchema.safeParse(body);
    if (!validation.success) {
      console.log("[API-KEY-REG] Validation failed:", validation.error.issues);
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid request data",
        details: validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    const { api_key, user_id, user_email, name } = validation.data;

    // Validate API key format (must start with tides_)
    if (!api_key.startsWith("tides_")) {
      console.log("[API-KEY-REG] Invalid API key format:", { apiKey: api_key.substring(0, 10) + "..." });
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid API key format",
        details: "API key must start with 'tides_'"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    // Hash the API key for storage
    const keyHash = await hashApiKey(api_key);
    console.log("[API-KEY-REG] API key hashed successfully");

    // Initialize storage
    const storage = createStorage(env);
    
    // Check if storage supports direct D1 operations
    if ('storeApiKey' in storage && typeof storage.storeApiKey === 'function') {
      console.log("[API-KEY-REG] Using storage.storeApiKey method");
      try {
        await (storage as any).storeApiKey(keyHash, user_id, user_email, name || 'Mobile Generated Key');
        console.log("[API-KEY-REG] API key stored successfully via storage method");
      } catch (storageError) {
        console.error("[API-KEY-REG] Storage method failed:", storageError);
        throw storageError;
      }
    } else {
      // Fallback to direct D1 database access
      console.log("[API-KEY-REG] Using direct D1 database access");
      
      if (!env.DB) {
        throw new Error("D1 database not available");
      }

      // Check if key already exists
      const existingKey = await env.DB.prepare(
        "SELECT key_hash FROM api_keys WHERE key_hash = ?"
      ).bind(keyHash).first();

      if (existingKey) {
        console.log("[API-KEY-REG] API key already exists in database");
        return new Response(JSON.stringify({
          success: true,
          message: "API key already registered",
          key_hash: keyHash
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
      }

      // Check if user exists, create if not (for mobile app users authenticated via Supabase)
      const existingUser = await env.DB.prepare(
        "SELECT id FROM users WHERE id = ?"
      ).bind(user_id).first();

      if (!existingUser) {
        console.log("[API-KEY-REG] Creating new user for mobile client:", { user_id, email: user_email });
        await env.DB.prepare(
          "INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, datetime('now'))"
        ).bind(user_id, user_email, `Mobile User ${user_id}`).run();
      }

      // Insert the API key
      await env.DB.prepare(
        "INSERT INTO api_keys (key_hash, user_id, name, created_at) VALUES (?, ?, ?, datetime('now'))"
      ).bind(keyHash, user_id, name || 'Mobile Generated Key').run();

      console.log("[API-KEY-REG] API key inserted directly into D1");
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      message: "API key registered successfully",
      key_hash: keyHash,
      user_id: user_id
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });

  } catch (error) {
    console.error("[API-KEY-REG] Registration failed:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to register API key",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }
}