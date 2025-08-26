[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / getTideRawJson

# Function: getTideRawJson()

> **getTideRawJson**(`params`, `storage`): `Promise`\<\{ `success`: `boolean`; `data?`: `Tide`; `error?`: `string`; \}\>

Defined in: [src/tools/tide-analytics.ts:324](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-analytics.ts#L324)

Retrieves the complete raw JSON data for a tide from R2 storage

## Parameters

### params

The request parameters

#### tide_id

`string`

The ID of the tide to retrieve

### storage

`TideStorage`

Storage instance for data retrieval

## Returns

`Promise`\<\{ `success`: `boolean`; `data?`: `Tide`; `error?`: `string`; \}\>

Promise resolving to the complete tide data

## Description

Returns the full, unprocessed tide object exactly as stored in R2,
including all nested arrays (flow_sessions, energy_updates, task_links) with
complete data. This is useful for data export, debugging, or when clients need
access to the complete data structure for custom processing.

## Examples

```ts
// React Native usage - get complete tide data for export
const result = await getTideRawJson({
  tide_id: "tide_1234567890_abc"
}, storage);

if (result.success) {
  // Access complete data structure
  const allSessions = result.data.flow_sessions;
  const allEnergy = result.data.energy_updates;
  const allTasks = result.data.task_links;
  
  // Export or process as needed
  await saveToFile(JSON.stringify(result.data));
}
```

```ts
// Comparison with getTideReport
// getTideReport returns processed analytics:
const report = await getTideReport({ tide_id }, storage);
// Returns: { total_flows: 5, average_duration: 45, energy_progression: [...] }

// getTideRawJson returns complete raw data:
const raw = await getTideRawJson({ tide_id }, storage);
// Returns: { id, name, flow_sessions: [...all], energy_updates: [...all], ... }
```

## Since

2.1.0
