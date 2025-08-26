[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / listTides

# Function: listTides()

> **listTides**(`params`, `storage`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `tides`: `object`[]; `count`: `number`; \} \| \{ `success`: `boolean`; `error`: `string`; `tides`: `never`[]; `count`: `number`; \}\>

Defined in: [src/tools/tide-core.ts:221](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-core.ts#L221)

Lists tides with optional filtering

## Parameters

### params

The filtering parameters

#### flow_type?

`string`

Filter by flow type ('daily', 'weekly', 'project', 'seasonal')

#### active_only?

`boolean`

If true, only return active tides

### storage

`TideStorage`

Storage instance for data retrieval

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `tides`: `object`[]; `count`: `number`; \} \| \{ `success`: `boolean`; `error`: `string`; `tides`: `never`[]; `count`: `number`; \}\>

Promise resolving to tide list

## Description

Retrieves a list of tides with optional filtering by flow type and status.
Returns a formatted list optimized for display in lists and cards, including summary
information like flow count and last flow time.

## Example

```ts
// Get all active daily tides
const result = await listTides({
  flow_type: "daily",
  active_only: true
}, storage);

if (result.success) {
  const tidesForList = result.tides;
}
```

## Since

2.0.0
