[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / getParticipants

# Function: getParticipants()

> **getParticipants**(`params?`, `storage?`): `Promise`\<\{ `success`: `boolean`; `participants`: `object`[]; `count`: `number`; `filters_applied`: \{ `status`: `string`; `date_from`: `null` \| `string`; `date_to`: `null` \| `string`; `limit`: `number`; \}; \}\>

Defined in: [src/tools/tide-analytics.ts:380](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-analytics.ts#L380)

Retrieves participant information with filtering

## Parameters

### params?

Optional filtering parameters

#### status_filter?

`string`

Filter by participant status

#### date_from?

`string`

Start date for filtering (ISO format)

#### date_to?

`string`

End date for filtering (ISO format)

#### limit?

`number`

Maximum number of participants to return

### storage?

`TideStorage`

Storage instance for data retrieval

## Returns

`Promise`\<\{ `success`: `boolean`; `participants`: `object`[]; `count`: `number`; `filters_applied`: \{ `status`: `string`; `date_from`: `null` \| `string`; `date_to`: `null` \| `string`; `limit`: `number`; \}; \}\>

Promise resolving to participants list

## Description

Gets a list of system participants/users with optional filtering.
This is primarily used for admin interfaces, team dashboards, or multi-user
analytics. Returns standardized participant data across all environments.

## Example

```ts
// Admin dashboard - get all active participants
const result = await getParticipants({
  status_filter: "active",
  limit: 50
}, storage);

if (result.success) {
  const activeUsers = result.participants;
}
```

## Since

2.0.0
