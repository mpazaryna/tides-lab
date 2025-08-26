[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [tools](../README.md) / linkTideTask

# Function: linkTideTask()

> **linkTideTask**(`params`, `storage`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `link_id`: `string`; `tide_id`: `string`; `task_url`: `string`; `task_title`: `string`; `task_type`: `string`; `linked_at`: `string`; `message`: `string`; \} \| \{ `tide_id?`: `undefined`; `message?`: `undefined`; `link_id?`: `undefined`; `task_url?`: `undefined`; `task_title?`: `undefined`; `task_type?`: `undefined`; `linked_at?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Defined in: [src/tools/tide-tasks.ts:174](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/tools/tide-tasks.ts#L174)

Links an external task to a tide

## Parameters

### params

The task linking parameters

#### tide_id

`string`

The ID of the tide to link the task to

#### task_url

`string`

The URL of the external task

#### task_title

`string`

The title/name of the task

#### task_type?

`string`

The type of task system

### storage

`TideStorage`

Storage instance for persistence

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `link_id`: `string`; `tide_id`: `string`; `task_url`: `string`; `task_title`: `string`; `task_type`: `string`; `linked_at`: `string`; `message`: `string`; \} \| \{ `tide_id?`: `undefined`; `message?`: `undefined`; `link_id?`: `undefined`; `task_url?`: `undefined`; `task_title?`: `undefined`; `task_type?`: `undefined`; `linked_at?`: `undefined`; `success`: `boolean`; `error`: `string`; \}\>

Promise resolving to link details

## Description

Creates a connection between a tide and an external task from systems
like GitHub, Linear, Jira, Obsidian, etc. This enables unified workflow tracking
across all your tools and provides context for flow sessions.

## Example

```ts
// React Native - link GitHub issue
const result = await linkTideTask({
  tide_id: "tide_1738366800000_abc123",
  task_url: "https://github.com/user/repo/issues/42",
  task_title: "Implement OAuth2 integration", 
  task_type: "github_issue"
}, storage);
```

## Since

2.0.0
