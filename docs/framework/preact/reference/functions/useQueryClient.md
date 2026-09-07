---
id: useQueryClient
title: useQueryClient
---

```ts
function useQueryClient(queryClient?): QueryClient;
```

Defined in: [packages/preact-query/src/QueryClientProvider.tsx:21](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L21)

The `useQueryClient` hook returns the current `QueryClient` instance.

## Parameters

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`QueryClient`](../classes/QueryClient.md)

The current `QueryClient` instance.

## Throws

If no `queryClient` argument is passed and no `QueryClientProvider` is found in the component tree.
