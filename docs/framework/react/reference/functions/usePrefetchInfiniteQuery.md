---
id: usePrefetchInfiniteQuery
title: usePrefetchInfiniteQuery
redirect_from:
  - framework/react/reference/usePrefetchInfiniteQuery
---

```ts
function usePrefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): void;
```

Defined in: [packages/react-query/src/usePrefetchInfiniteQuery.tsx:56](https://github.com/TanStack/query/blob/main/packages/react-query/src/usePrefetchInfiniteQuery.tsx#L56)

`usePrefetchInfiniteQuery` does not return anything, it should be used just to fire a prefetch during render,
before a suspense boundary that wraps a component that uses `useSuspenseInfiniteQuery`. You can pass
everything to `usePrefetchInfiniteQuery` that you can pass to `queryClient.infiniteQuery`, though
`queryKey`, `initialPageParam`, and `getNextPageParam` are always required, and `queryFn` is required unless
a default query function has been defined.

`getNextPageParam` receives both the last page of the infinite list of data and the full array of all pages,
as well as pageParam information, and should return a single variable that will be passed to your query
function as `context.pageParam`. Return `undefined` or `null` to indicate there is no next page available.

The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
over from a previous attempt — so calling this on every render is cheap and won't refetch data that's
already there or already in flight.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`UsePrefetchInfiniteQueryOptions`](../type-aliases/UsePrefetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UsePrefetchInfiniteQueryOptions](../type-aliases/UsePrefetchInfiniteQueryOptions.md) to use — everything you can pass to `queryClient.infiniteQuery`.

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
import { infiniteQueryOptions, usePrefetchInfiniteQuery } from '@tanstack/react-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

function App() {
  // Fire the prefetch during render, before the suspense boundary below.
  usePrefetchInfiniteQuery(projectsOptions)

  return (
    <Suspense fallback={<h1>Loading projects...</h1>}>
      <Projects />
    </Suspense>
  )
}
```
