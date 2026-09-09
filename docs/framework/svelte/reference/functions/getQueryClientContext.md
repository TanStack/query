---
id: getQueryClientContext
title: getQueryClientContext
---

```ts
function getQueryClientContext(): QueryClient;
```

Defined in: [packages/svelte-query/src/context.ts:14](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/context.ts#L14)

Retrieves the `QueryClient` set on Svelte's context by `QueryClientProvider` (or by
[setQueryClientContext](setQueryClientContext.md) directly). This is what [useQueryClient](useQueryClient.md) calls internally.

## Returns

[`QueryClient`](../classes/QueryClient.md)

The `QueryClient` set on context, whether by `QueryClientProvider` or [setQueryClientContext](setQueryClientContext.md).

## Throws

If no `QueryClient` was found in context.
