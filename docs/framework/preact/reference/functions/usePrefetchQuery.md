---
id: usePrefetchQuery
title: usePrefetchQuery
---

```ts
function usePrefetchQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>(options, queryClient?): void;
```

Defined in: [preact-query/src/usePrefetchQuery.tsx:38](https://github.com/TanStack/query/blob/main/packages/preact-query/src/usePrefetchQuery.tsx#L38)

`usePrefetchQuery` does not return anything, it should be used just to fire a prefetch during render, before
a suspense boundary that wraps a component that uses `useSuspenseQuery`. You can pass everything to
`usePrefetchQuery` that you can pass to `queryClient.fetchQuery`, though `queryKey` is always required, and
`queryFn` is required unless a default query function has been defined.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### options

[`UsePrefetchQueryOptions`](../type-aliases/UsePrefetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

The [UsePrefetchQueryOptions](../type-aliases/UsePrefetchQueryOptions.md) to use — everything you can pass to `queryClient.fetchQuery`.

### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

## Returns

`void`

`void` — nothing is returned.

## Example

```tsx
import { Suspense } from 'preact/compat'
import { usePrefetchQuery } from '@tanstack/preact-query'

function App() {
  // Fire the prefetch during render, before the suspense boundary below.
  usePrefetchQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <Suspense fallback={<h1>Loading posts...</h1>}>
      <Posts />
    </Suspense>
  )
}
```
