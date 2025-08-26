[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / createTide

# Function: createTide()

> **createTide**(`params`, `storage`): `Promise`\<\{ `success`: `boolean`; `tide_id`: `string`; `name`: `string`; `flow_type`: `"daily"` \| `"weekly"` \| `"project"` \| `"seasonal"`; `created_at`: `string`; `status`: `"active"` \| `"completed"` \| `"paused"`; `description`: `string`; `next_flow`: `null` \| `string`; `error?`: `undefined`; \} \| \{ `tide_id?`: `undefined`; `name?`: `undefined`; `flow_type?`: `undefined`; `created_at?`: `undefined`; `status?`: `undefined`; `description?`: `undefined`; `next_flow?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Defined in: [src/tools/tide-core.ts:145](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-core.ts#L145)

Creates a new tide (workflow/project) in the system

## Parameters

### params

The tide creation parameters

#### name

`string`

The display name for the tide (max 100 chars recommended)

#### flow_type

`"daily"` \| `"weekly"` \| `"project"` \| `"seasonal"`

How often this tide flows

#### description?

`string`

Optional description (max 500 chars recommended)

### storage

`TideStorage`

Storage instance for persistence

## Returns

`Promise`\<\{ `success`: `boolean`; `tide_id`: `string`; `name`: `string`; `flow_type`: `"daily"` \| `"weekly"` \| `"project"` \| `"seasonal"`; `created_at`: `string`; `status`: `"active"` \| `"completed"` \| `"paused"`; `description`: `string`; `next_flow`: `null` \| `string`; `error?`: `undefined`; \} \| \{ `tide_id?`: `undefined`; `name?`: `undefined`; `flow_type?`: `undefined`; `created_at?`: `undefined`; `status?`: `undefined`; `description?`: `undefined`; `next_flow?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Promise resolving to creation result

## Description

Creates a new tide with the specified parameters. Each tide represents
a workflow or project that can have flow sessions, energy updates, and task links.
The system automatically calculates the next flow time based on the flow type.

## Example

```ts
// React Native usage example
const result = await createTide({
  name: "Daily Standup Prep",
  flow_type: "daily",
  description: "Prepare talking points for daily standup meeting"
}, storage);

if (result.success) {
  console.log('Created tide:', result.tide_id);
} else {
  console.error('Failed to create tide:', result.error);
}
```

## Since

2.0.0
