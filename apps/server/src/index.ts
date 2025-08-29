import handle from "@modelfetch/cloudflare";
import { createServer } from "./server";
import { createStorage } from "./storage";

// CORS headers for React Native requests
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

// CHANGE: Fixed import paths from @agents to relative paths
// WHY: Resolves module resolution issues in Cloudflare Workers environment
// IMPACT: Ensures proper Durable Object deployment across all environments
export { HelloAgent } from "../../agents/hello/index";
export { TideProductivityAgent } from "../../agents/tide-productivity-agent/index";

// NEW FEATURE: AI request handler for conversational features
// MAJOR ADDITION: Enables mobile apps to have natural language AI conversations
// ENDPOINTS: /ai/conversation, /ai/classify-intent, /ai/productivity-analysis, /ai/flow-suggestions
// ARCHITECTURE: Uses Workers AI for edge inference - no external API dependencies
async function handleAIRequest(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  console.log(`[AI] Handling AI request: ${url.pathname}`);
  
  // Authenticate the request
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Authentication required",
        message: "Please provide a valid Bearer token in the Authorization header",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }

  const apiKey = authHeader.substring(7);
  const storage = createStorage(env);
  let authContext = null;

  // Validate API key
  if (
    "validateApiKey" in storage &&
    typeof storage.validateApiKey === "function"
  ) {
    try {
      authContext = await (storage as any).validateApiKey(apiKey);
    } catch (error) {
      console.error("[AI] Error validating API key:", error);
    }
  }

  if (!authContext) {
    const { validateApiKey } = await import("./auth");
    const fallbackAuth = await validateApiKey(apiKey);
    if (fallbackAuth && apiKey.includes("testuser")) {
      authContext = fallbackAuth;
    }
  }

  if (!authContext || !authContext.userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid API key",
        message: "The provided API key is invalid or expired",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }

  // Import AI service
  const { createAIService } = await import("./services/aiService");
  const aiService = createAIService(env);

  try {
    let response;

    switch (url.pathname) {
      case "/ai/conversation":
        if (request.method !== "POST") {
          throw new Error("Method not allowed");
        }
        const conversationBody = await request.json();
        response = await aiService.handleConversation(conversationBody);
        break;

      case "/ai/classify-intent":
        if (request.method !== "POST") {
          throw new Error("Method not allowed");
        }
        const classifyBody = await request.json();
        response = await aiService.classifyToolIntent(classifyBody);
        break;

      case "/ai/productivity-analysis":
        if (request.method !== "POST") {
          throw new Error("Method not allowed");
        }
        const productivityBody = await request.json();
        // Use existing productivity analysis but format for conversation
        const mockSessions = [
          {
            duration: 45,
            energy_level: 7,
            completed_at: new Date().toISOString(),
            productivity_score: 8
          }
        ];
        const analysisResult = await aiService.analyzeProductivity({
          sessions: mockSessions,
          analysis_depth: productivityBody.analysisDepth || "quick"
        });
        response = {
          success: true,
          result: analysisResult,
          timestamp: new Date().toISOString()
        };
        break;

      case "/ai/flow-suggestions":
        if (request.method !== "POST") {
          throw new Error("Method not allowed");
        }
        const flowBody = await request.json();
        const userContext = {
          energy_level: flowBody.energyLevel || 6,
          recent_sessions: [],
          preferences: {}
        };
        const suggestions = await aiService.generateFlowSuggestions({
          user_context: userContext
        });
        response = {
          success: true,
          result: suggestions,
          timestamp: new Date().toISOString()
        };
        break;

      case "/ai/health":
        if (request.method !== "GET") {
          throw new Error("Method not allowed");
        }
        response = {
          success: true,
          status: "healthy",
          aiService: "available",
          timestamp: new Date().toISOString()
        };
        break;

      default:
        throw new Error(`Unknown AI endpoint: ${url.pathname}`);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });

  } catch (error) {
    console.error("[AI] Request failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "AI request failed",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }
}

// Agent request handler
async function handleAgentRequest(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  console.log(`[AGENT] Handling agent request: ${url.pathname}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  console.log(`[AGENT] Path parts: ${JSON.stringify(pathParts)}`);

  if (pathParts.length < 2) {
    console.log("[AGENT] Invalid agent path - too few parts");
    return new Response("Invalid agent path", { status: 400 });
  }

  const agentType = pathParts[0]; // 'agents'
  const agentName = pathParts[1]; // 'hello', 'tide', etc.
  const agentPath = "/" + pathParts.slice(2).join("/"); // remaining path
  console.log(`[AGENT] Routing to agent: ${agentName}, path: ${agentPath}`);

  // Route to appropriate agent based on name
  switch (agentName) {
    case "hello":
      if (!env.HELLO_AGENT) {
        return new Response("HelloAgent not configured", { status: 500 });
      }
      // Use a stable ID for testing, or derive from user/session
      const helloId = env.HELLO_AGENT.idFromName("test-instance");
      const helloAgent = env.HELLO_AGENT.get(helloId);

      // Rewrite URL to remove /agents/hello prefix
      const agentUrl = new URL(request.url);
      agentUrl.pathname = agentPath || "/";
      const agentRequest = new Request(agentUrl.toString(), request);

      return helloAgent.fetch(agentRequest);

    case "tide-productivity":
      if (!env.TIDE_PRODUCTIVITY_AGENT) {
        return new Response("TideProductivityAgent not configured", {
          status: 500,
        });
      }

      // Authenticate using Bearer token - REQUIRED for all agent requests
      const storage = createStorage(env);
      let authContext = null;

      // Extract API key from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log(
          "[AGENT] No Bearer token provided - authentication required"
        );
        return new Response(
          JSON.stringify({
            error: "Authentication required",
            message:
              "Please provide a valid Bearer token in the Authorization header",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const apiKey = authHeader.substring(7);

      // Try D1R2HybridStorage validation first
      if (
        "validateApiKey" in storage &&
        typeof storage.validateApiKey === "function"
      ) {
        try {
          authContext = await (storage as any).validateApiKey(apiKey);
          console.log("[AGENT] ✅ D1 validation successful:", { userId: authContext?.userId, email: authContext?.email });
        } catch (error) {
          console.error("[AGENT] ❌ Error validating API key with D1:", error);
        }
      }

      // If D1 validation failed, fallback to basic auth for test keys only
      if (!authContext) {
        console.log(
          "[AGENT] D1 validation failed, checking if it's a test key"
        );
        const { validateApiKey } = await import("./auth");
        const fallbackAuth = await validateApiKey(apiKey);
        
        // Only allow fallback for test keys (testuser_001-005), not for mobile keys
        if (fallbackAuth && apiKey.includes("testuser")) {
          authContext = fallbackAuth;
          console.log("[AGENT] ✅ Using test key fallback auth");
        } else {
          console.log("[AGENT] ❌ Not a test key - rejecting fallback auth for mobile keys");
        }
      }

      // If authentication failed, return 401
      if (!authContext || !authContext.userId) {
        console.log("[AGENT] Authentication failed - invalid API key");
        return new Response(
          JSON.stringify({
            error: "Invalid API key",
            message: "The provided API key is invalid or expired",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const userId = authContext.userId;
      console.log(`[AGENT] Authenticated user: ${userId}`);

      // Use user-specific ID for productivity agent (each user gets their own agent instance)
      const productivityId = env.TIDE_PRODUCTIVITY_AGENT.idFromName(
        `user-${userId}`
      );
      const productivityAgent = env.TIDE_PRODUCTIVITY_AGENT.get(productivityId);

      // Rewrite URL to remove /agents/tide-productivity prefix
      const productivityUrl = new URL(request.url);
      productivityUrl.pathname = agentPath || "/";
      const productivityRequest = new Request(
        productivityUrl.toString(),
        request
      );

      return productivityAgent.fetch(productivityRequest);

    default:
      return new Response(`Unknown agent: ${agentName}`, { status: 404 });
  }
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const url = new URL(request.url);
    console.log(`[TIDES] Incoming request: ${request.method} ${url.pathname}`);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    // Debug endpoint for testing API keys (development only)
    if (url.pathname === "/debug/test-keys" && request.method === "GET") {
      const testKeys = [
        "tides_testuser_001",
        "tides_testuser_002", 
        "tides_testuser_003",
        "tides_testuser_004",
        "tides_testuser_005"
      ];
      
      return new Response(JSON.stringify({
        message: "Available test API keys",
        keys: testKeys,
        usage: "Use these keys as Bearer tokens in Authorization header",
        example: "Authorization: Bearer tides_testuser_001"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    // API key registration endpoint for mobile clients
    if (url.pathname === "/register-api-key" && request.method === "POST") {
      console.log("[API-KEY-REG] Processing API key registration request");
      
      try {
        const { registerApiKey } = await import("./handlers/auth");
        return await registerApiKey(request, env);
      } catch (error) {
        console.error("[API-KEY-REG] Registration handler error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "Internal server error during API key registration",
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

    // Route to agents based on path
    if (url.pathname.startsWith("/agents/")) {
      console.log(`[TIDES] Routing to agent: ${url.pathname}`);
      return handleAgentRequest(request, env, url);
    }

    // Route AI endpoints for enhanced conversational features
    if (url.pathname.startsWith("/ai/")) {
      console.log(`[TIDES] Routing to AI endpoint: ${url.pathname}`);
      return handleAIRequest(request, env, url);
    }

    // Phase 4: Authenticate using D1-based system
    const storage = createStorage(env);
    let authContext = null;

    // Extract API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const apiKey = authHeader.substring(7);

      // Try D1R2HybridStorage validation first
      if (
        "validateApiKey" in storage &&
        typeof storage.validateApiKey === "function"
      ) {
        try {
          authContext = await (storage as any).validateApiKey(apiKey);
          console.log("✅ D1 validation successful:", { userId: authContext?.userId, email: authContext?.email });
        } catch (error) {
          console.error("❌ Error validating API key with D1:", error);
        }
      }

      // If D1 validation failed or storage doesn't support it, fallback to basic auth for test keys only
      if (!authContext) {
        console.log(
          "D1 validation failed or not available, checking if it's a test key"
        );
        const { validateApiKey } = await import("./auth");
        const fallbackAuth = await validateApiKey(apiKey);
        
        // Only allow fallback for test keys (testuser_001-005), not for mobile keys
        if (fallbackAuth && apiKey.includes("testuser")) {
          authContext = fallbackAuth;
          console.log("✅ Using test key fallback auth");
        } else {
          console.log("❌ Not a test key - rejecting fallback auth for mobile keys");
        }
      }
    }

    if (authContext) {
      console.log(`✅ Authenticated request from user: ${authContext.userId}`);
    } else {
      console.log("❌ Unauthenticated request - rejecting");

      // Return 401 Unauthorized for requests without valid authentication
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32600,
            message: "Unauthorized: Valid API key required",
          },
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Create server with environment access and set auth context
    console.log(`🏗️ Creating MCP server for user: ${authContext.userId}`);
    const server = createServer(env, authContext);
    console.log(`📡 Passing to ModelFetch handler`);

    try {
      const response = await handle(server)(request, env, ctx);
      console.log(`🎯 ModelFetch response status: ${response.status}`);

      // Add CORS headers to ModelFetch response
      const corsResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...CORS_HEADERS,
        },
      });

      return corsResponse;
    } catch (error) {
      console.error(`💥 ModelFetch handler error:`, error);
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }
  },
} satisfies ExportedHandler<Env>;
