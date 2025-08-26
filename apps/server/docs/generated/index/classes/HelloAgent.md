[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [index](../README.md) / HelloAgent

# Class: HelloAgent

Defined in: [agents/hello/agent.ts:236](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L236)

HelloAgent - A test/demo Durable Object agent that demonstrates the agent pattern

This agent serves as a reference implementation for the Tides autonomous agent system.
It showcases key patterns including:
- State persistence using Durable Object storage
- REST API endpoints for external interaction
- WebSocket support for real-time communication
- Multi-client broadcasting capabilities
- Error handling and recovery

## REST API Endpoints

### GET /hello
Returns a simple greeting message
```typescript
// Response
{
  message: "Hello from HelloAgent!",
  agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
}
```

### POST /hello
Returns a personalized greeting
```typescript
// Request
{ name: "React Native" }

// Response
{
  message: "Hello, React Native!",
  timestamp: 1754511234567,
  agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
}
```

### GET /visits
Increments and returns the visit counter (demonstrates state persistence)
```typescript
// Response
{
  visits: 42,
  agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
}
```

### POST /message
Stores a message and broadcasts to connected WebSocket clients
```typescript
// Request
{ message: "Hello from React Native!" }

// Response
{ success: true, message: "Message stored" }
```

### GET /messages
Retrieves all stored messages
```typescript
// Response
{
  messages: [
    { text: "Hello world", timestamp: 1754511234567 },
    { text: "Another message", timestamp: 1754511234890 }
  ],
  count: 2
}
```

### GET /stats
Returns agent statistics and health information
```typescript
// Response
{
  visits: 42,
  messageCount: 15,
  connectedClients: 3,
  agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482",
  uptime: 1754511234567
}
```

### POST /reset
Resets all agent state (visits=0, messages=[])
```typescript
// Response
{
  message: "Agent state reset",
  agentId: "f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482"
}
```

## WebSocket API

Connect to the agent via WebSocket for real-time interaction:
```typescript
const ws = new WebSocket('wss://tides-001.mpazbot.workers.dev/agents/hello/ws');
```

### Welcome Message
Sent immediately upon connection:
```typescript
{
  type: 'welcome',
  message: 'Connected to HelloAgent',
  agentId: 'f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482',
  timestamp: 1754511234567
}
```

### Ping/Pong
Test connection health:
```typescript
// Send
{ type: 'ping' }

// Receive
{ type: 'pong', timestamp: 1754511234567 }
```

### Echo
Echo back any payload:
```typescript
// Send
{ type: 'echo', payload: 'Hello WebSocket!' }

// Receive
{ type: 'echo_response', payload: 'Hello WebSocket!', timestamp: 1754511234567 }
```

### Broadcast
Send a message to all connected clients:
```typescript
// Send
{ type: 'broadcast', message: 'Hello everyone!' }

// All clients receive
{
  type: 'broadcast',
  from: 'f429cdfc979a8bed2f8a24776c8b86fa09c493226bda6e5f09f53e86b9fba482',
  message: 'Hello everyone!',
  timestamp: 1754511234567
}
```

### Get Stats
Request current agent statistics:
```typescript
// Send
{ type: 'get_stats' }

// Receive
{
  type: 'stats',
  visits: 42,
  messageCount: 15,
  connectedClients: 3
}
```

## React Native Integration Example

```typescript
// REST API usage
const response = await fetch('https://tides-001.mpazbot.workers.dev/agents/hello/hello', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'React Native App' })
});
const data = await response.json();
console.log(data.message); // "Hello, React Native App!"

// WebSocket usage
const ws = new WebSocket('wss://tides-001.mpazbot.workers.dev/agents/hello/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'welcome') {
    console.log('Connected to HelloAgent');
  }
};

ws.onopen = () => {
  // Send ping to test connection
  ws.send(JSON.stringify({ type: 'ping' }));
};
```

## State Persistence

The HelloAgent demonstrates Durable Object state persistence patterns:
- **Automatic initialization**: Loads state from storage on construction
- **Incremental updates**: Saves state after each modification
- **Crash recovery**: State survives agent restarts
- **Cross-instance isolation**: Each agent ID maintains separate state

## Error Handling

The agent implements comprehensive error handling:
- **400 Bad Request**: Invalid JSON in POST requests
- **404 Not Found**: Unknown REST endpoints
- **405 Method Not Allowed**: Wrong HTTP method
- **500 Internal Server Error**: Unexpected errors with details
- **WebSocket errors**: Graceful client disconnection handling

## Usage in Tides System

HelloAgent serves as a reference for implementing production agents:
- **TideAgent**: Autonomous flow session management
- **AnalyticsAgent**: Productivity pattern analysis
- **NotificationAgent**: Smart reminder system
- **CollaborationAgent**: Multi-user session coordination

## Example

```typescript
// Route to HelloAgent
const helloId = env.HELLO_AGENT.idFromName('user-123');
const helloAgent = env.HELLO_AGENT.get(helloId);
return helloAgent.fetch(request);
```

## Implements

- `DurableObject`

## Constructors

### Constructor

> **new HelloAgent**(`state`, `env`): `HelloAgent`

Defined in: [agents/hello/agent.ts:261](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L261)

Creates a new HelloAgent instance

The constructor automatically initializes state from Durable Object storage,
ensuring the agent resumes with previous state after restarts.

#### Parameters

##### state

`DurableObjectState`

Durable Object state interface

##### env

`Env`

Environment bindings (HELLO_AGENT, DB, etc.)

#### Returns

`HelloAgent`

## Methods

### initialize()

> `private` **initialize**(): `Promise`\<`void`\>

Defined in: [agents/hello/agent.ts:281](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L281)

Initializes agent state from Durable Object storage

This method is called during construction to restore persistent state.
It handles cases where storage is empty (new agent) or contains previous state.

#### Returns

`Promise`\<`void`\>

Promise that resolves when initialization is complete

***

### fetch()

> **fetch**(`request`): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:307](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L307)

Main request handler for the HelloAgent

Routes incoming HTTP requests to appropriate handlers based on:
- WebSocket upgrade requests → handleWebSocket()
- REST API endpoints → specific handler methods

Implements comprehensive error handling and returns JSON responses.

#### Parameters

##### request

`Request`

Incoming HTTP request

#### Returns

`Promise`\<`Response`\>

Promise resolving to HTTP response

#### Implementation of

`DurableObject.fetch`

***

### handleHello()

> `private` **handleHello**(`request`): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:372](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L372)

Handles GET/POST requests to /hello endpoint

- GET: Returns simple greeting with agent ID
- POST: Returns personalized greeting with optional name from request body

#### Parameters

##### request

`Request`

HTTP request object

#### Returns

`Promise`\<`Response`\>

JSON response with greeting message

***

### handleVisits()

> `private` **handleVisits**(): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:410](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L410)

Handles GET requests to /visits endpoint

Increments the visit counter and persists to storage.
Demonstrates state persistence patterns for Durable Objects.

#### Returns

`Promise`\<`Response`\>

JSON response with current visit count

***

### handleMessage()

> `private` **handleMessage**(`request`): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:432](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L432)

Handles POST requests to /message endpoint

Stores a message in persistent storage and broadcasts to all connected
WebSocket clients. Demonstrates both persistence and real-time communication.

#### Parameters

##### request

`Request`

HTTP request with JSON body containing message

#### Returns

`Promise`\<`Response`\>

JSON response confirming message storage

***

### handleGetMessages()

> `private` **handleGetMessages**(): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:478](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L478)

Handles GET requests to /messages endpoint

Returns all stored messages with metadata.

#### Returns

`Promise`\<`Response`\>

JSON response with message array and count

***

### handleReset()

> `private` **handleReset**(): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:496](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L496)

Handles POST requests to /reset endpoint

Resets all agent state to initial values and persists changes.
Useful for testing and demo purposes.

#### Returns

`Promise`\<`Response`\>

JSON response confirming reset

***

### handleStats()

> `private` **handleStats**(): `Promise`\<`Response`\>

Defined in: [agents/hello/agent.ts:519](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L519)

Handles GET requests to /stats endpoint

Returns current agent statistics including state and connection info.
Useful for health monitoring and debugging.

#### Returns

`Promise`\<`Response`\>

JSON response with comprehensive agent statistics

***

### handleWebSocket()

> **handleWebSocket**(`webSocket`): `Promise`\<`void`\>

Defined in: [agents/hello/agent.ts:544](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L544)

Handles WebSocket connection setup and lifecycle management

Sets up event listeners for:
- message: Routes to handleWebSocketMessage()
- close: Cleans up connection tracking
- error: Handles connection errors gracefully

Sends a welcome message upon successful connection.

#### Parameters

##### webSocket

`WebSocket`

WebSocket connection to handle

#### Returns

`Promise`\<`void`\>

Promise that resolves when setup is complete

***

### handleWebSocketMessage()

> `private` **handleWebSocketMessage**(`webSocket`, `data`): `Promise`\<`void`\>

Defined in: [agents/hello/agent.ts:598](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L598)

Routes WebSocket messages to appropriate handlers

Supports these message types:
- ping: Responds with pong for connection testing
- echo: Echoes back the payload
- broadcast: Sends message to all connected clients
- get_stats: Returns current agent statistics

#### Parameters

##### webSocket

`WebSocket`

The WebSocket connection that sent the message

##### data

`any`

Parsed JSON message data

#### Returns

`Promise`\<`void`\>

***

### broadcast()

> **broadcast**(`message`): `Promise`\<`void`\>

Defined in: [agents/hello/agent.ts:655](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L655)

Broadcasts a message to all connected WebSocket clients

Automatically handles connection cleanup by removing clients
that are no longer connected or fail to receive the message.

This method is used for:
- Broadcasting new stored messages to all clients
- Distributing broadcast commands from one client to all others
- System-wide notifications or updates

#### Parameters

##### message

`any`

Message object to broadcast (will be JSON stringified)

#### Returns

`Promise`\<`void`\>

Promise that resolves when broadcast is complete

## Properties

### state

> `private` **state**: `DurableObjectState`

Defined in: [agents/hello/agent.ts:238](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L238)

Durable Object state interface for persistence

***

### env

> `private` **env**: `Env`

Defined in: [agents/hello/agent.ts:241](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L241)

Environment bindings and configuration

***

### visits

> `private` **visits**: `number` = `0`

Defined in: [agents/hello/agent.ts:244](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L244)

Visit counter - demonstrates persistent numeric state

***

### messages

> `private` **messages**: `Message`[] = `[]`

Defined in: [agents/hello/agent.ts:247](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L247)

Message storage - demonstrates persistent array state

***

### connectedClients

> `private` **connectedClients**: `Set`\<`WebSocket`\>

Defined in: [agents/hello/agent.ts:250](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/hello/agent.ts#L250)

Active WebSocket connections for real-time communication
