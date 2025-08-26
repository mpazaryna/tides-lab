[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / startTideFlow

# Function: startTideFlow()

> **startTideFlow**(`params`, `storage`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `session_id`: `string`; `tide_id`: `string`; `intensity`: `"gentle"` \| `"moderate"` \| `"strong"`; `duration`: `number`; `started_at`: `string`; `energy_level`: `string`; `work_context`: `string`; `message`: `string`; \} \| \{ `tide_id?`: `undefined`; `session_id?`: `undefined`; `intensity?`: `undefined`; `duration?`: `undefined`; `started_at?`: `undefined`; `energy_level?`: `undefined`; `work_context?`: `undefined`; `message?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Defined in: [src/tools/tide-sessions.ts:164](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-sessions.ts#L164)

Starts a new flow session for a tide

## Parameters

### params

The flow session parameters

#### tide_id

`string`

The ID of the tide to start a flow session for

#### intensity?

`"gentle"` \| `"moderate"` \| `"strong"`

Work intensity level

#### duration?

`number`

Session duration in minutes

#### initial_energy?

`string`

Starting energy level description

#### work_context?

`string`

Context or description of work

### storage

`TideStorage`

Storage instance for persistence

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `session_id`: `string`; `tide_id`: `string`; `intensity`: `"gentle"` \| `"moderate"` \| `"strong"`; `duration`: `number`; `started_at`: `string`; `energy_level`: `string`; `work_context`: `string`; `message`: `string`; \} \| \{ `tide_id?`: `undefined`; `session_id?`: `undefined`; `intensity?`: `undefined`; `duration?`: `undefined`; `started_at?`: `undefined`; `energy_level?`: `undefined`; `work_context?`: `undefined`; `message?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Promise resolving to flow session details

## Description

Initiates a focused work session within a tide. This is the core function
for starting a "flow state" - a timed, focused work period. Perfect for Pomodoro-style
work sessions or any focused work period tracking.

## Example

```ts
// React Native usage - start a Pomodoro session
const result = await startTideFlow({
  tide_id: "tide_1738366800000_abc123",
  intensity: "moderate",
  duration: 25,
  initial_energy: "high",
  work_context: "Implementing user authentication"
}, storage);

if (result.success) {
  // Start timer UI with result.duration
  // Show intensity indicator with result.intensity
}
```

## Since

2.0.0
