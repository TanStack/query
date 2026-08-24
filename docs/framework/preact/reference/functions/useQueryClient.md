---
id: useQueryClient
title: useQueryClient
---

```ts
function useQueryClient(queryClient?): QueryClient;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:17](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L17)

The `useQueryClient` hook returns the current `QueryClient` instance.

## Parameters

### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

## Returns

`QueryClient`

The current `QueryClient` instance.
