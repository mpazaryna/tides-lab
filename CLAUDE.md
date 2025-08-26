# Tides Monorepo

**Tides** - MCP ecosystem with:

- **Server** (`apps/server/`): Cloudflare Workers MCP server
- **Mobile** (`apps/mobile/`): React Native workflow tracker
- **Architecture**: Mobile → HTTP/JSON-RPC 2.0 → MCP Server → Supabase

## Structure

```
tides/
├── apps/
│   ├── agents/         # Shared implementations
│   ├── server/         # Cloudflare Workers MCP
│   ├── mobile/         # React Native app
│   ├── web/            # Next.js frontend
│   └── supabase-tides-demo-1/  # Testing
├── docs/
├── scripts/
└── shared/
```

## Commands

### Development

```bash
npm run dev                # All apps
npm run dev:server         # Server
npm run dev:mobile         # Mobile
npm run dev:web            # Web
```

### Testing

```bash
npm run test               # All tests
npm run test:server        # Server tests
npm run test:mobile        # Mobile tests
npm run test:web           # Web tests
```

### Deployment

```bash
npm run build              # Build all
npm run build:server       # Deploy server
npm run build:mobile:android
npm run build:mobile:ios
```

## Tech Stack

**Server**: Cloudflare Workers, ModelFetch, MCP SDK, Zod, Jest
**Mobile**: React Native 0.80.2 (NO EXPO), TypeScript, Supabase, React Navigation
**Web**: Next.js 15.4.3, React 19.1.0, TypeScript
**Testing**: Jest (server), Vitest (demo app)

## Architecture

**Entry Points:**

- `apps/server/src/index.ts` - HTTP handler
- `apps/server/src/server.ts` - MCP server

**Protocol**: MCP over HTTP (JSON-RPC 2.0)
**Auth**: Bearer tokens (`tides_{userId}_{randomId}` mobile, `{uuid}` desktop)

**MCP Tools:**

1. `tide_create`, `tide_list`, `tide_flow`
2. `tide_add_energy`, `tide_link_task`
3. `tide_list_task_links`, `tide_get_report`
4. `tides_get_participants`

## Config

**Supabase**: `hcfxujzqlyaxvbetyano.supabase.co`
**Mobile**: Bundle ID `com.tidesmobile`
**Workers Envs**:

- env.001 → `tides-001.mpazbot.workers.dev` (dev)
- env.002 → `tides-002.mpazbot.workers.dev` (staging)
- env.003 → `tides-003.mpazbot.workers.dev` (prod)

## Guidelines

**Context7 Library IDs:**

- Cloudflare Workers: `/llmstxt/developers_cloudflare_com-workers-llms-full.txt`
- MCP patterns: `/cloudflare/mcp-server-cloudflare`
- React Native: `/facebook/react-native-website`
- Supabase: `/supabase/supabase`

**Standards:**

- Server: MCP patterns, Zod validation, 90%+ test coverage
- Mobile: NO Expo, TypeScript interfaces in components, AsyncStorage auth
- Database: JSONB over enterprise complexity

**Workflow:**

1. Query Context7 MCP first
2. Test auth flows thoroughly
3. Use root scripts for cross-app ops

## Dependencies

**Server**: MCP SDK 1.17.0, ModelFetch 0.15.2, Zod 3.25.76, Jest 30.0.5
**Mobile**: Supabase JS 2.52.1, React Navigation 7.x, AsyncStorage 2.2.0
**Package Manager**: npm throughout

## Status

**Completed**: Monorepo, MCP foundation, mobile auth, navigation
**Active**: 8 tide tools integration, hybrid auth optimization
**Next**: Complete MCP integration, desktop UUID/QR setup

**Requirements**:

1. Query Context7 MCP first
2. Test hybrid auth flows
3. Error handling for network requests
4. Cross-client compatibility
5. JSONB over R2 complexity

## References

See `apps/server/CLAUDE.md` and `apps/mobile/CLAUDE.md` for app-specific docs.

**Source Repos**

- MCP Server: <https://github.com/mpazaryna/tides-server>
- Mobile App: <https://github.com/masonomara/TidesMobile>
- Web App: <https://github.com/masonomara/tides-app-bare>
