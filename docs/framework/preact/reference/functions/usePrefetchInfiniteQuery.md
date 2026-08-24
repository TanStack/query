---
id: usePrefetchInfiniteQuery
title: usePrefetchInfiniteQuery
---

```ts
function usePrefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): void;
```

Defined in: [preact-query/src/usePrefetchInfiniteQuery.tsx:48](https://github.com/TanStack/query/blob/main/packages/preact-query/src/usePrefetchInfiniteQuery.tsx#L48)

`usePrefetchInfiniteQuery` does not return anything, it should be used just to fire a prefetch during render,
before a suspense boundary that wraps a component that uses `useSuspenseInfiniteQuery`. You can pass
everything to `usePrefetchInfiniteQuery` that you can pass to `queryClient.fetchInfiniteQuery`, though
`queryKey`, `initialPageParam`, and `getNextPageParam` are always required, and `queryFn` is required unless
a default query function has been defined.

`getNextPageParam` receives both the last page of the infinite list of data and the full array of all pages,
as well as pageParam information, and should return a single variable that will be passed as the last
optional parameter to your query function. Return `undefined` or `null` to indicate there is no next page
available.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`UsePrefetchInfiniteQueryOptions`](../type-aliases/UsePrefetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UsePrefetchInfiniteQueryOptions](../type-aliases/UsePrefetchInfiniteQueryOptions.md) to use — everything you can pass to `queryClient.fetchInfiniteQuery`.

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
import { infiniteQueryOptions, usePrefetchInfiniteQuery } from '@tanstack/preact-query'

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
