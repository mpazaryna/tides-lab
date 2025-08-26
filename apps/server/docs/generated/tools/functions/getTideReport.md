[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / getTideReport

# Function: getTideReport()

> **getTideReport**(`params`, `storage`): `Promise`\<\{ `success`: `boolean`; `error`: `string`; `content?`: `undefined`; `format?`: `undefined`; `report?`: `undefined`; \} \| \{ `success`: `boolean`; `format`: `string`; `content`: `string`; `report?`: `undefined`; `error?`: `undefined`; \} \| \{ `content?`: `undefined`; `success`: `boolean`; `format`: `string`; `report`: \{ `tide_id`: `string`; `name`: `string`; `flow_type`: `"daily"` \| `"weekly"` \| `"project"` \| `"seasonal"`; `created_at`: `string`; `total_flows`: `number`; `total_duration`: `number`; `average_duration`: `number`; `energy_progression`: `string`[]; `linked_tasks`: `number`; `last_flow`: `null` \| `string`; \}; `error?`: `undefined`; \}\>

Defined in: [src/tools/tide-analytics.ts:191](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-analytics.ts#L191)

Generates a comprehensive report for a tide

## Parameters

### params

The report parameters

#### tide_id

`string`

The ID of the tide to generate a report for

#### format?

`"json"` \| `"markdown"` \| `"csv"`

Output format for the report

### storage

`TideStorage`

Storage instance for data retrieval

## Returns

`Promise`\<\{ `success`: `boolean`; `error`: `string`; `content?`: `undefined`; `format?`: `undefined`; `report?`: `undefined`; \} \| \{ `success`: `boolean`; `format`: `string`; `content`: `string`; `report?`: `undefined`; `error?`: `undefined`; \} \| \{ `content?`: `undefined`; `success`: `boolean`; `format`: `string`; `report`: \{ `tide_id`: `string`; `name`: `string`; `flow_type`: `"daily"` \| `"weekly"` \| `"project"` \| `"seasonal"`; `created_at`: `string`; `total_flows`: `number`; `total_duration`: `number`; `average_duration`: `number`; `energy_progression`: `string`[]; `linked_tasks`: `number`; `last_flow`: `null` \| `string`; \}; `error?`: `undefined`; \}\>

Promise resolving to tide report

## Description

Creates a detailed analytics report for a tide including flow sessions,
energy progression, task links, and summary statistics. Perfect for displaying
progress dashboards, analytics screens, or exporting data.

## Example

```ts
// React Native usage - get JSON report for analytics screen
const result = await getTideReport({
  tide_id: "tide_1738366800000_abc123",
  format: "json"
}, storage);

if (result.success) {
  // Perfect for charts and analytics displays
  const { total_flows, total_duration, energy_progression } = result.report;
}
```

## Since

2.0.0
