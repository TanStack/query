---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

```ts
function useSuspenseInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseSuspenseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useSuspenseInfiniteQuery.ts:66](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseInfiniteQuery.ts#L66)

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

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

## Returns

[`UseSuspenseInfiniteQueryResult`](../type-aliases/UseSuspenseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same object as `useInfiniteQuery`, except that `data` is guaranteed to be defined,
`isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived flags set
accordingly).

## Example

```tsx
import { Suspense } from 'preact/compat'
import { useSuspenseInfiniteQuery } from '@tanstack/preact-query'

function Projects() {
  // `data` is guaranteed to be defined here — no `isPending` check needed.
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

  return (
    <div>
      {data.pages.map((page) =>
        page.projects.map((project) => <p key={project.id}>{project.name}</p>),
      )}
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
        Load More
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
