---
id: usePrefetchQuery
title: usePrefetchQuery
redirect_from:
  - framework/react/reference/usePrefetchQuery
---

```ts
function usePrefetchQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>(options, queryClient?): void;
```

Defined in: [packages/react-query/src/usePrefetchQuery.tsx:42](https://github.com/TanStack/query/blob/main/packages/react-query/src/usePrefetchQuery.tsx#L42)

`usePrefetchQuery` does not return anything, it should be used just to fire a prefetch during render, before
a suspense boundary that wraps a component that uses `useSuspenseQuery`. You can pass everything to
`usePrefetchQuery` that you can pass to `queryClient.query`, though `queryKey` is always required, and
`queryFn` is required unless a default query function has been defined.

The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
over from a previous attempt — so calling this on every render is cheap and won't refetch data that's
already there or already in flight.

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

The [UsePrefetchQueryOptions](../type-aliases/UsePrefetchQueryOptions.md) to use — everything you can pass to `queryClient.query`.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`void`

`void` — nothing is returned.

## Example

```tsx
import { Suspense } from 'react'
import { usePrefetchQuery } from '@tanstack/react-query'

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
