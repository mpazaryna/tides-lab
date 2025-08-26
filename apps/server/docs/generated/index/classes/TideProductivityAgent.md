[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [index](../README.md) / TideProductivityAgent

# Class: TideProductivityAgent

Defined in: [agents/tide-productivity-agent/index.ts:52](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L52)

## Implements

- `DurableObject`

## Constructors

### Constructor

> **new TideProductivityAgent**(`state`, `env`): `TideProductivityAgent`

Defined in: [agents/tide-productivity-agent/index.ts:63](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L63)

#### Parameters

##### state

`DurableObjectState`

##### env

`Env`

#### Returns

`TideProductivityAgent`

## Methods

### initialize()

> `private` **initialize**(): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:77](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L77)

Initialize agent state and MCP server

#### Returns

`Promise`\<`void`\>

***

### initializeMCPServer()

> `private` **initializeMCPServer**(): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:84](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L84)

Initialize agent for accessing external services

#### Returns

`Promise`\<`void`\>

***

### getPrompt()

> `private` **getPrompt**(`promptName`, `args`): `Promise`\<`any`\>

Defined in: [agents/tide-productivity-agent/index.ts:96](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L96)

Get a prompt by making an HTTP request to the MCP server

#### Parameters

##### promptName

`string`

##### args

`any`

#### Returns

`Promise`\<`any`\>

***

### fetch()

> **fetch**(`request`): `Promise`\<`Response`\>

Defined in: [agents/tide-productivity-agent/index.ts:173](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L173)

Cloudflare Workers fetch handler for REST API and WebSocket upgrades

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

#### Implementation of

`DurableObject.fetch`

***

### handleWebSocketUpgrade()

> `private` **handleWebSocketUpgrade**(`request`): `Response`

Defined in: [agents/tide-productivity-agent/index.ts:201](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L201)

Handle WebSocket upgrade for real-time communication

#### Parameters

##### request

`Request`

#### Returns

`Response`

***

### handleWebSocket()

> `private` **handleWebSocket**(`webSocket`): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:216](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L216)

Handle WebSocket connections and messages

#### Parameters

##### webSocket

`WebSocket`

#### Returns

`Promise`\<`void`\>

***

### provideDailyInsights()

> **provideDailyInsights**(`userId`): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:277](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L277)

Generate daily productivity insights for a user

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`void`\>

***

### optimizeUserSchedule()

> **optimizeUserSchedule**(`userId`, `preferences`): `Promise`\<`any`[]\>

Defined in: [agents/tide-productivity-agent/index.ts:328](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L328)

Optimize user schedule based on energy patterns

#### Parameters

##### userId

`string`

##### preferences

`UserPreferences`

#### Returns

`Promise`\<`any`[]\>

***

### handleUserQuestion()

> **handleUserQuestion**(`userId`, `question`, `tideId?`): `Promise`\<`any`\>

Defined in: [agents/tide-productivity-agent/index.ts:382](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L382)

Handle custom user questions about productivity

#### Parameters

##### userId

`string`

##### question

`string`

##### tideId?

`string`

#### Returns

`Promise`\<`any`\>

***

### sendSmartNotification()

> **sendSmartNotification**(`userId`, `notification`): `Promise`\<`boolean`\>

Defined in: [agents/tide-productivity-agent/index.ts:452](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L452)

Send smart notification to user via WebSocket

#### Parameters

##### userId

`string`

##### notification

`SmartNotification`

#### Returns

`Promise`\<`boolean`\>

***

### broadcastToUser()

> `private` **broadcastToUser**(`userId`, `message`): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:470](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L470)

Broadcast message to specific user via WebSocket

#### Parameters

##### userId

`string`

##### message

`any`

#### Returns

`Promise`\<`void`\>

***

### updateUserPreferences()

> **updateUserPreferences**(`userId`, `preferences`): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:489](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L489)

Update user preferences

#### Parameters

##### userId

`string`

##### preferences

`UserPreferences`

#### Returns

`Promise`\<`void`\>

***

### getUserPreferences()

> **getUserPreferences**(`userId`): `Promise`\<`null` \| `UserPreferences`\>

Defined in: [agents/tide-productivity-agent/index.ts:496](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L496)

Get user preferences

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`null` \| `UserPreferences`\>

***

### recordAnalysis()

> **recordAnalysis**(`userId`, `record`): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:503](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L503)

Record analysis for tracking and learning

#### Parameters

##### userId

`string`

##### record

`AnalysisRecord`

#### Returns

`Promise`\<`void`\>

***

### getUserActiveTides()

> `private` **getUserActiveTides**(`userId`): `Promise`\<`TideInfo`[]\>

Defined in: [agents/tide-productivity-agent/index.ts:510](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L510)

Helper methods (would be implemented based on MCP integration)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`TideInfo`[]\>

***

### hasActionableRecommendations()

> `private` **hasActionableRecommendations**(`insights`): `boolean`

Defined in: [agents/tide-productivity-agent/index.ts:561](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L561)

#### Parameters

##### insights

`string`

#### Returns

`boolean`

***

### calculateInsightPriority()

> `private` **calculateInsightPriority**(`insights`): `number`

Defined in: [agents/tide-productivity-agent/index.ts:567](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L567)

#### Parameters

##### insights

`string`

#### Returns

`number`

***

### parseConfidenceScore()

> `private` **parseConfidenceScore**(`response`): `number`

Defined in: [agents/tide-productivity-agent/index.ts:578](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L578)

#### Parameters

##### response

`string`

#### Returns

`number`

***

### autoImplementScheduleChanges()

> `private` **autoImplementScheduleChanges**(`userId`, `optimization`): `Promise`\<`void`\>

Defined in: [agents/tide-productivity-agent/index.ts:584](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L584)

#### Parameters

##### userId

`string`

##### optimization

`any`

#### Returns

`Promise`\<`void`\>

***

### getMostRelevantTide()

> `private` **getMostRelevantTide**(`userId`, `question`): `Promise`\<`string`\>

Defined in: [agents/tide-productivity-agent/index.ts:589](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L589)

#### Parameters

##### userId

`string`

##### question

`string`

#### Returns

`Promise`\<`string`\>

***

### getUserIdFromSocket()

> `private` **getUserIdFromSocket**(`socket`): `undefined` \| `string`

Defined in: [agents/tide-productivity-agent/index.ts:595](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L595)

#### Parameters

##### socket

`WebSocket`

#### Returns

`undefined` \| `string`

***

### handleInsightsRequest()

> `private` **handleInsightsRequest**(`request`): `Promise`\<`Response`\>

Defined in: [agents/tide-productivity-agent/index.ts:601](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L601)

Request handlers for REST API

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### handleOptimizeRequest()

> `private` **handleOptimizeRequest**(`request`): `Promise`\<`Response`\>

Defined in: [agents/tide-productivity-agent/index.ts:620](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L620)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### handleQuestionRequest()

> `private` **handleQuestionRequest**(`request`): `Promise`\<`Response`\>

Defined in: [agents/tide-productivity-agent/index.ts:639](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L639)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### handlePreferencesRequest()

> `private` **handlePreferencesRequest**(`request`): `Promise`\<`Response`\>

Defined in: [agents/tide-productivity-agent/index.ts:671](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L671)

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`Response`\>

***

### handleStatusRequest()

> `private` **handleStatusRequest**(): `Response`

Defined in: [agents/tide-productivity-agent/index.ts:701](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L701)

#### Returns

`Response`

***

### logError()

> `private` **logError**(`message`, `error`): `void`

Defined in: [agents/tide-productivity-agent/index.ts:712](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L712)

#### Parameters

##### message

`string`

##### error

`Error`

#### Returns

`void`

***

### logInfo()

> `private` **logInfo**(`message`): `void`

Defined in: [agents/tide-productivity-agent/index.ts:716](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L716)

#### Parameters

##### message

`string`

#### Returns

`void`

## Properties

### state

> `private` **state**: `DurableObjectState`

Defined in: [agents/tide-productivity-agent/index.ts:54](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L54)

Durable Object state interface for persistence

***

### env

> `private` **env**: `Env`

Defined in: [agents/tide-productivity-agent/index.ts:57](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L57)

Environment bindings and configuration

***

### mcpServer

> `private` **mcpServer**: `any`

Defined in: [agents/tide-productivity-agent/index.ts:59](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L59)

***

### connectedClients

> `private` **connectedClients**: `Set`\<`WebSocket`\>

Defined in: [agents/tide-productivity-agent/index.ts:60](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L60)

***

### userSessions

> `private` **userSessions**: `Map`\<`WebSocket`, `string`\>

Defined in: [agents/tide-productivity-agent/index.ts:61](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/agents/tide-productivity-agent/index.ts#L61)
