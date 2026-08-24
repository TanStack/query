---
id: useInfiniteQuery
title: useInfiniteQuery
---

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): DefinedUseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useInfiniteQuery.ts:31](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useInfiniteQuery.ts#L31)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedUseInfiniteQueryResult`](../type-aliases/DefinedUseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
`fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
`isFetchingPreviousPage`.

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useInfiniteQuery.ts:58](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useInfiniteQuery.ts#L58)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
`fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
`isFetchingPreviousPage`.

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useInfiniteQuery.ts:115](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useInfiniteQuery.ts#L115)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
`fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
`isFetchingPreviousPage`.

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default refetch
behaviour, resulting in outdated data. Make sure to call these functions only in response to user actions,
or add conditions like `hasNextPage && !isFetching`.

### Example

```tsx
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId,
})

function Projects() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(projectsOptions)

  return (
    <button
      onClick={() => fetchNextPage()}
      disabled={!hasNextPage || isFetchingNextPage}
    >
      Load More
    </button>
  )
}
```
