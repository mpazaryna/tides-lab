[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / listTideTaskLinks

# Function: listTideTaskLinks()

> **listTideTaskLinks**(`params`, `storage`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `tide_id`: `string`; `links`: `object`[]; `count`: `number`; \} \| \{ `success`: `boolean`; `error`: `string`; `tide_id`: `string`; `links`: `never`[]; `count`: `number`; \}\>

Defined in: [src/tools/tide-tasks.ts:238](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-tasks.ts#L238)

Lists all task links for a tide

## Parameters

### params

The listing parameters

#### tide_id

`string`

The ID of the tide to get task links for

### storage

`TideStorage`

Storage instance for data retrieval

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `tide_id`: `string`; `links`: `object`[]; `count`: `number`; \} \| \{ `success`: `boolean`; `error`: `string`; `tide_id`: `string`; `links`: `never`[]; `count`: `number`; \}\>

Promise resolving to task links list

## Description

Retrieves all external tasks linked to a specific tide, formatted
for display in task lists, cards, or navigation menus. Perfect for showing
context about what external work is associated with a tide.

## Example

```ts
// React Native - display linked tasks in tide detail
const result = await listTideTaskLinks({
  tide_id: "tide_1738366800000_abc123"
}, storage);

if (result.success) {
  // Perfect for FlatList of linked tasks
  const taskLinks = result.links;
}
```

## Since

2.0.0
