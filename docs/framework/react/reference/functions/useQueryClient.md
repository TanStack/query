---
id: useQueryClient
title: useQueryClient
redirect_from:
  - framework/react/reference/useQueryClient
---

```ts
function useQueryClient(queryClient?): QueryClient;
```

Defined in: [packages/react-query/src/QueryClientProvider.tsx:21](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryClientProvider.tsx#L21)

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
