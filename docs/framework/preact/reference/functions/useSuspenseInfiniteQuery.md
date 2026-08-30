---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

```ts
function useSuspenseInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseSuspenseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useSuspenseInfiniteQuery.ts:83](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseInfiniteQuery.ts#L83)

The options for `useSuspenseInfiniteQuery` are the same as for `useInfiniteQuery`, except for `throwOnError`,
`enabled`, and `placeholderData`.

Caveat: cancellation does not work.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `Error`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`UseSuspenseInfiniteQueryOptions`](../interfaces/UseSuspenseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UseSuspenseInfiniteQueryOptions](../interfaces/UseSuspenseInfiniteQueryOptions.md) to use — the same options as `useInfiniteQuery`, minus the ones listed above.

### queryClient?

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`UseSuspenseInfiniteQueryResult`](../type-aliases/UseSuspenseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same object as `useInfiniteQuery`, except that `data` is guaranteed to be defined,
`isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived flags set
accordingly).

## Remarks

Multiple suspenseful query calls in the same component suspend serially, causing a request
waterfall — each one blocks rendering until it resolves, so the next doesn't even start fetching until
then. There's no way to parallelize multiple infinite queries under Suspense. Also keep in mind that
imperative fetch calls, such as `fetchNextPage`, may interfere with the default refetch behavior,
resulting in outdated data. Make sure to call these functions only in response to user actions, or add
conditions like `hasNextPage && !isFetching`.

## See

[useInfiniteQuery](useInfiniteQuery.md) for the non-Suspense version of this hook.

## Example

```tsx
import { Suspense } from 'preact/compat'
import { useSuspenseInfiniteQuery } from '@tanstack/preact-query'

function Projects() {
  // `data` is guaranteed to be defined here — no `isPending` check needed.
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: ['projects'],
      queryFn: ({ pageParam }) => fetchProjects(pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    })

  return (
    <div>
      <ul>
        {data.pages.map((page) =>
          page.projects.map((project) => <li key={project.id}>{project.name}</li>),
        )}
      </ul>
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetching}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
            ? 'Load More'
            : 'Nothing more to load'}
      </button>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<h1>Loading projects...</h1>}>
      <Projects />
    </Suspense>
  )
}
```
