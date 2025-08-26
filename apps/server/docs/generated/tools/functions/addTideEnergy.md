[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / addTideEnergy

# Function: addTideEnergy()

> **addTideEnergy**(`params`, `storage`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `energy_id`: `string`; `tide_id`: `string`; `energy_level`: `string`; `context`: `string`; `timestamp`: `string`; `message`: `string`; \} \| \{ `tide_id?`: `undefined`; `energy_level?`: `undefined`; `message?`: `undefined`; `energy_id?`: `undefined`; `context?`: `undefined`; `timestamp?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Defined in: [src/tools/tide-sessions.ts:233](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-sessions.ts#L233)

Records an energy level update for a tide

## Parameters

### params

The energy update parameters

#### tide_id

`string`

The ID of the tide to add energy to

#### energy_level

`string`

Energy level (recommend 1-10 scale or descriptive terms)

#### context?

`string`

Optional context about the energy state

### storage

`TideStorage`

Storage instance for persistence

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `energy_id`: `string`; `tide_id`: `string`; `energy_level`: `string`; `context`: `string`; `timestamp`: `string`; `message`: `string`; \} \| \{ `tide_id?`: `undefined`; `energy_level?`: `undefined`; `message?`: `undefined`; `energy_id?`: `undefined`; `context?`: `undefined`; `timestamp?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Promise resolving to energy update details

## Description

Tracks energy levels throughout a tide's lifecycle. Perfect for mood
tracking, energy monitoring, or any subjective state tracking. Use this to capture
how users feel during different parts of their workflow.

## Example

```ts
// React Native usage - energy slider (1-10 scale)
const result = await addTideEnergy({
  tide_id: "tide_1738366800000_abc123",
  energy_level: "8",
  context: "Feeling very focused after coffee break"
}, storage);
```

## Since

2.0.0
