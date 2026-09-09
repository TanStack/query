---
id: resolveQueryClient
title: resolveQueryClient
---

```ts
function resolveQueryClient(explicit?): QueryClient;
```

Defined in: [packages/lit-query/src/context.ts:118](https://github.com/TanStack/query/blob/main/packages/lit-query/src/context.ts#L118)

Resolves an explicit `QueryClient` or falls back to `useQueryClient`.

## Parameters

### explicit?

[`QueryClient`](../classes/QueryClient.md)

Optional client supplied by the caller.

## Returns

[`QueryClient`](../classes/QueryClient.md)

The explicit client when provided, otherwise the current default
client.
