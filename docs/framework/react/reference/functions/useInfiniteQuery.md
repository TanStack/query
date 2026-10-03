---
id: useInfiniteQuery
title: useInfiniteQuery
redirect_from:
  - framework/react/reference/useInfiniteQuery
---

## Overview

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: QueryClient): DefinedUseInfiniteQueryResult<TData, TError>;
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: QueryClient): UseInfiniteQueryResult<TData, TError>;
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: QueryClient): UseInfiniteQueryResult<TData, TError>;
```

- [`DefinedInitialDataInfiniteOptions` → `DefinedUseInfiniteQueryResult`](#call-signature-1): The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
- [`UndefinedInitialDataInfiniteOptions` → `UseInfiniteQueryResult`](#call-signature-2): The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
- [`UseInfiniteQueryOptions` → `UseInfiniteQueryResult`](#call-signature-3): The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: QueryClient): DefinedUseInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/react-query/src/useInfiniteQuery.ts:65](https://github.com/TanStack/query/blob/main/packages/react-query/src/useInfiniteQuery.ts#L65)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

This overload is selected when `initialData` is set.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [DefinedInitialDataInfiniteOptions](../type-aliases/DefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedUseInfiniteQueryResult`](../type-aliases/DefinedUseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Example

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function Projects() {
  // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
  // list stays visible alongside the error.
  const { data, isError, error } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
    initialData: { pages: [], pageParams: [] },
  })

  return (
    <div>
      {isError ? <span>Error: {error.message}</span> : null}
      <ul>
        {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
      </ul>
    </div>
  )
}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: QueryClient): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/react-query/src/useInfiniteQuery.ts:191](https://github.com/TanStack/query/blob/main/packages/react-query/src/useInfiniteQuery.ts#L191)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UndefinedInitialDataInfiniteOptions](../type-aliases/UndefinedInitialDataInfiniteOptions.md) to use — everything you can pass to `useInfiniteQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Examples

Fetching the next page from a "Load More" button click:
```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function Projects() {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['projects'],
      queryFn: ({ pageParam }) => fetchProjects(pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    })

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
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
    </>
  )
}
```

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

function Projects() {
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (sentinel == null || !hasNextPage || isFetching) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) fetchNextPage()
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasNextPage, isFetching, fetchNextPage])

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
      <ul>
        {data.pages.map((page) =>
          page.projects.map((project) => <li key={project.id}>{project.name}</li>),
        )}
      </ul>
      <div ref={sentinelRef}>{isFetchingNextPage ? 'Loading more...' : null}</div>
    </>
  )
}
```

<a id="call-signature-3"></a>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient?: QueryClient): UseInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/react-query/src/useInfiniteQuery.ts:347](https://github.com/TanStack/query/blob/main/packages/react-query/src/useInfiniteQuery.ts#L347)

The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
`initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UseInfiniteQueryOptions](../interfaces/UseInfiniteQueryOptions.md) to use — everything you can pass to `useInfiniteQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

### Remarks

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
actions, or add conditions like `hasNextPage && !isFetching`.

### See

[infiniteQueryOptions](infiniteQueryOptions.md) to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.

### Examples

Fetching the next page from a "Load More" button click:
```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function Projects() {
  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['projects'],
      queryFn: ({ pageParam }) => fetchProjects(pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextId,
    })

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
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
    </>
  )
}
```

Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
sentinel element after the list:
```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

function Projects() {
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (sentinel == null || !hasNextPage || isFetching) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) fetchNextPage()
    })
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasNextPage, isFetching, fetchNextPage])

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
      <ul>
        {data.pages.map((page) =>
          page.projects.map((project) => <li key={project.id}>{project.name}</li>),
        )}
      </ul>
      <div ref={sentinelRef}>{isFetchingNextPage ? 'Loading more...' : null}</div>
    </>
  )
}
```

A query that's disabled, type safe, until `postId` is set — pass `skipToken` as `queryFn`
instead of setting `enabled: false`:
```tsx
import { skipToken, useInfiniteQuery } from '@tanstack/react-query'

function Comments({ postId }: { postId: string | undefined }) {
  // Use `isLoading`, not `isPending`, so the loading state doesn't show while the query is disabled.
  const { data, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['post', postId, 'comments'],
    queryFn:
      postId != null
        ? ({ pageParam }) => fetchComments(postId, pageParam)
        : skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextId,
  })

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data?.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
    </ul>
  )
}
```

<a id="parameters-summary"></a>

## Parameters

### options

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The [UseInfiniteQueryOptions](../interfaces/UseInfiniteQueryOptions.md) to use — everything you can pass to `useInfiniteQuery`.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="options-enabled"></a> `enabled?` | \| `false` \| `true` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` | `true` | Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys. To refetch the query, use the `refetch` method returned from the `useQuery` instance. Accepts a boolean or function that returns a boolean. |
| <a id="options-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used. Setting it to `Infinity` will disable garbage collection. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see `timeoutManager.setTimeoutProvider` for a workaround. |
| <a id="options-getnextpageparam"></a> `getNextPageParam` | (`lastPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `lastPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | `undefined` | This function can be set to automatically get the next cursor for infinite queries. The result will also be used to determine the value of `hasNextPage`. |
| <a id="options-getpreviouspageparam"></a> `getPreviousPageParam?` | (`firstPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `firstPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | `undefined` | This function can be set to automatically get the previous cursor for infinite queries. The result will also be used to determine the value of `hasPreviousPage`. |
| <a id="options-initialdata"></a> `initialData?` | \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| () => \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined` | `undefined` | If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet). If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initial data. Initial data is considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the cache. |
| <a id="options-initialdataupdatedat"></a> `initialDataUpdatedAt?` | `number` \| () => `number` \| `undefined` | `undefined` | If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated. |
| <a id="options-initialpageparam"></a> `initialPageParam` | `TPageParam` | `undefined` | The page param to start from when an infinite query has no pages yet. It is passed to `queryFn` as `pageParam` for the first page; every page after that gets the value returned by `getNextPageParam` or `getPreviousPageParam`. It only applies while the query has no pages: once a first page exists, refetching starts from that page's own param instead. |
| <a id="options-maxpages"></a> `maxPages?` | `number` | `undefined` | Maximum number of pages to store in the data of an infinite query. |
| <a id="options-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on each query. Use this property to pass information that can be used in other places. |
| <a id="options-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a query is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="options-notifyonchangeprops"></a> `notifyOnChangeProps?` | \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `"all"` \| () => \| `"all"` \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `undefined` | `undefined` | If set, the component will only re-render if any of the listed properties change. When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change. When set to `'all'`, the component will re-render whenever a query is updated. When set to a function, the function will be executed to compute the list of properties. Defaults to `undefined`, in which case property access is tracked automatically, and the component only re-renders when one of the tracked properties changes. |
| <a id="options-persister"></a> `persister?` | (`queryFn`: (`context`: [`QueryFunctionContext`](../type-aliases/QueryFunctionContext.md)\<`NoInfer`\<`TQueryKey`\>, `TPageParam`\>) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>, `context`: `object`, `query`: [`Query`](../classes/Query.md)) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\> | `undefined` | This option can be used to persist the result of a query to an external storage, bypassing the need to actually call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries. |
| <a id="options-placeholderdata"></a> `placeholderData?` | \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| (`previousData`: \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`, `previousQuery`: \| [`Query`](../classes/Query.md)\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> \| `undefined`) => \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined` | `undefined` | If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided. |
| <a id="options-queryfn"></a> `queryFn?` | \| *typeof* [`skipToken`](../variables/skipToken.md) \| (`context`: [`QueryFunctionContext`](../type-aliases/QueryFunctionContext.md)\<`TQueryKey`, `TPageParam`\>) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\> | `undefined` | The function that the query will use to request data. Required, unless a default query function has been set via `queryClient.setQueryDefaults` or `queryClient.setDefaultOptions`. Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md). Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`. |
| <a id="options-queryhash"></a> `queryHash?` | `string` | `undefined` | The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used as the actual cache key internally. |
| <a id="options-querykey"></a> `queryKey` | `TQueryKey` & `object` | `undefined` | The query key to use for this query. The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) for more information. The query will automatically update when this key changes (as long as `enabled` is not set to `false`). |
| <a id="options-querykeyhashfn"></a> `queryKeyHashFn?` | (`queryKey`: `TQueryKey`) => `string` | `undefined` | If specified, this function is used to hash the `queryKey` to a string. |
| <a id="options-refetchinterval"></a> `refetchInterval?` | \| `number` \| `false` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `false` \| `undefined` | `false` | If set to a number, the query will continuously refetch at this frequency in milliseconds. If set to a function, the function will be executed with the latest data and query to compute a frequency |
| <a id="options-refetchintervalinbackground"></a> `refetchIntervalInBackground?` | `boolean` | `false` | If set to `true`, the query will continue to refetch while their tab/window is in the background. |
| <a id="options-refetchonmount"></a> `refetchOnMount?` | \| `boolean` \| `"always"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"` | `true` | If set to `true`, the query will refetch on mount if the data is stale. If set to `false`, will disable additional instances of a query to trigger background refetch. If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value |
| <a id="options-refetchonreconnect"></a> `refetchOnReconnect?` | \| `boolean` \| `"always"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"` | `undefined` | If set to `true`, the query will refetch on reconnect if the data is stale. If set to `false`, the query will not refetch on reconnect. If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true` unless `networkMode` is `'always'`. |
| <a id="options-refetchonwindowfocus"></a> `refetchOnWindowFocus?` | \| `boolean` \| `"always"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"` | `true` | If set to `true`, the query will refetch on window focus if the data is stale. If set to `false`, the query will not refetch on window focus. If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. |
| <a id="options-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| (`failureCount`: `number`, `error`: `TError`) => `boolean` | `undefined` | If `false`, failed queries will not retry by default. If `true`, failed queries will retry infinitely. If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number. If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false. Defaults to `3` on the client and `0` on the server. |
| <a id="options-retrydelay"></a> `retryDelay?` | `number` \| (`failureCount`: `number`, `error`: `TError`) => `number` | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff. A function like `attempt => attempt * 1000` applies linear backoff. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="options-retryonmount"></a> `retryOnMount?` | \| `false` \| `true` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` | `true` | If set to `false`, the query will not be retried on mount if it contains an error. If set to a function, the function will be executed with the query to compute the value. |
| <a id="options-select"></a> `select?` | (`data`: [`InfiniteData`](../interfaces/InfiniteData.md)) => `TData` | `undefined` | This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache. The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, memoize the function so its reference stays stable across calls. |
| <a id="options-staletime"></a> `staleTime?` | \| `number` \| `"static"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `"static"` | `0` | The time in milliseconds after data is considered stale. If set to `Infinity`, the data will never be considered stale. If set to `'static'`, the data will never be considered stale. If set to a function, the function will be executed with the query to compute a `staleTime`. |
| <a id="options-structuralsharing"></a> `structuralSharing?` | `boolean` \| (`oldData`: `unknown`, `newData`: `unknown`) => `unknown` | `true` | Set this to `false` to disable structural sharing between query results. Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic. |
| <a id="options-subscribed"></a> `subscribed?` | `boolean` | `true` | Set this to `false` to unsubscribe this observer from updates to the query cache. |
| <a id="options-throwonerror"></a> `throwOnError?` | \| `false` \| `true` \| (`error`: `TError`, `query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary. If set to `false` and `suspense` is `false`, errors are returned as state. If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`). |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

<a id="returns-summary"></a>

## Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
`hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
`data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
`InfiniteData<TQueryFnData>` shape.

<a id="result-properties"></a>

### Result properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="result-data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the query. |
| <a id="result-dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. |
| <a id="result-error"></a> `error` | `TError` \| `null` | The error object for the query, if an error was thrown. - Defaults to `null`. |
| <a id="result-errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. |
| <a id="result-errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. |
| <a id="result-failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. |
| <a id="result-failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. |
| <a id="result-fetchnextpage"></a> `fetchNextPage` | (`options?`: [`FetchNextPageOptions`](../interfaces/FetchNextPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the next "page" of results. |
| <a id="result-fetchpreviouspage"></a> `fetchPreviousPage` | (`options?`: [`FetchPreviousPageOptions`](../interfaces/FetchPreviousPageOptions.md)) => `Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\> | This function allows you to fetch the previous "page" of results. |
| <a id="result-fetchstatus"></a> `fetchStatus` | `"fetching"` \| `"paused"` \| `"idle"` | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="result-hasnextpage"></a> `hasNextPage` | `boolean` | Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option). |
| <a id="result-haspreviouspage"></a> `hasPreviousPage` | `boolean` | Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option). |
| <a id="result-isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. |
| <a id="result-iserror"></a> `isError` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query attempt resulted in an error. |
| <a id="result-isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. |
| <a id="result-isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. |
| <a id="result-isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. |
| <a id="result-isfetchingnextpage"></a> `isFetchingNextPage` | `boolean` | Will be `true` while fetching the next page with `fetchNextPage`. |
| <a id="result-isfetchingpreviouspage"></a> `isFetchingPreviousPage` | `boolean` | Will be `true` while fetching the previous page with `fetchPreviousPage`. |
| <a id="result-isfetchnextpageerror"></a> `isFetchNextPageError` | `boolean` | Will be `true` if the query failed while fetching the next page. |
| <a id="result-isfetchpreviouspageerror"></a> `isFetchPreviousPageError` | `boolean` | Will be `true` if the query failed while fetching the previous page. |
| <a id="result-isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. |
| <a id="result-isloading"></a> `isLoading` | `boolean` | Is `true` whenever the first fetch for a query is in-flight. - Is the same as `isFetching && isPending`. |
| <a id="result-isloadingerror"></a> `isLoadingError` | `boolean` | Will be `true` if the query failed while fetching for the first time. |
| <a id="result-ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. |
| <a id="result-ispending"></a> `isPending` | `boolean` | Will be `pending` if there's no cached data and no query attempt was finished yet. |
| <a id="result-isplaceholderdata"></a> `isPlaceholderData` | `boolean` | Will be `true` if the data shown is the placeholder data. |
| <a id="result-isrefetcherror"></a> `isRefetchError` | `boolean` | Will be `true` if the query failed while refetching. |
| <a id="result-isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. |
| <a id="result-isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. |
| <a id="result-issuccess"></a> `isSuccess` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query has received a response with no errors and is ready to display its data. |
| <a id="result-refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](../interfaces/RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. |
| <a id="result-status"></a> `status` | `"error"` \| `"pending"` \| `"success"` | The status of the query. - Will be: - `pending` if there's no cached data and no query attempt was finished yet. - `error` if the query attempt resulted in an error. - `success` if the query has received a response with no errors and is ready to display its data. |
