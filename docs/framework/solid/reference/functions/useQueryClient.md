---
id: useQueryClient
title: useQueryClient
---

```ts
function useQueryClient(queryClient?): QueryClient;
```

Defined in: [packages/solid-query/src/QueryClientProvider.tsx:28](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClientProvider.tsx#L28)

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
