// GREEN

# MCP Server Connection Roadmap

**Goal:** HTTP-based JSON-RPC 2.0 MCP client connected during user auth session.

Right now we have a loose framework of our Tides mobile app. This will be the first mobile MCP client that uses an HTTP connection. The following needs to be achieved in the app, in correct order:

The app requires an auth context, followed by an MCP context.

If the user is signed in, they should automatically connect to MCP.

If the user is signed in, their initial route is `main`; otherwise, it is `auth`. Ensure this is reflected and enforced starting from `App.tsx`.

Only after a user is signed in does the app begin to fetch the MCP connection. Preliminary example details on how to fetch this connection can be found in `mcp-warmup.md`.

## Required Reading

- `docs/specs/mcp-warmup.md` - Tides Server warmup documentation
- `docs/specs/mcp-server-documentation.md` - AI-generated Tides Server docs
- Context7 MCP - Complete technology reference

## Implementation Steps

- Supabase JWT bearer token integration for MCP authentication
- MCP session management (session ID storage/retrieval)
- Configurable MCP server URL (default: https://tides-server-282019336468.us-central1.run.app/mcp/)
- Connection status UI components
