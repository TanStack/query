---
id: useQuery
title: useQuery
---

## Overview

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError>;
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<TData, TError>;
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<TData, TError>;
```

- [`DefinedInitialDataOptions` → `DefinedUseQueryResult`](#call-signature-1): This overload is selected when `initialData` is set, so the resulting `data` is never `undefined` (unless a `select` changes `TData` to include `undefined`).
- [`UndefinedInitialDataOptions` → `UseQueryResult`](#call-signature-2): This overload is selected when `initialData` is omitted or may be `undefined`, so the resulting `data` can be `undefined`.
- [`UseQueryOptions` → `UseQueryResult`](#call-signature-3): Fallback overload for options whose `initialData` presence isn't statically known — for example, an object typed as [UseQueryOptions](../interfaces/UseQueryOptions.md) rather than an object literal. Prefer one of the other overloads when possible, since they infer whether `data` can be `undefined` from `initialData` directly.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/useQuery.ts:49](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L49)

This overload is selected when `initialData` is set, so the resulting `data` is never `undefined` (unless
a `select` changes `TData` to include `undefined`).

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [DefinedInitialDataOptions](../type-aliases/DefinedInitialDataOptions.md) to use — everything you can pass to `useQuery`, with `initialData` set.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`DefinedUseQueryResult`](../type-aliases/DefinedUseQueryResult.md)\<`TData`, `TError`\>

The current query result, typed so that `status` is `success` — or `error` if a fetch attempt
fails while keeping the existing data (`status` never resolves to `pending` in this overload's type,
since `initialData` guarantees data upfront). `isSuccess`/`isError` are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Example

```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
  // so the list stays visible alongside the error.
  const { data, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    initialData: [],
  })

  return (
    <div>
      {isError ? <span>Error: {error.message}</span> : null}
      <ul>
        {data.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  )
}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/useQuery.ts:116](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L116)

This overload is selected when `initialData` is omitted or may be `undefined`, so the resulting `data`
can be `undefined`.

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UndefinedInitialDataOptions](../type-aliases/UndefinedInitialDataOptions.md) to use — everything you can pass to `useQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  const { status, data, error, isFetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (status === 'pending') return 'Loading...'
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
    </div>
  )
}
```

The same query, checking `isPending`/`isError` instead of `status` — pick whichever reads better to you:
```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((post) => <li key={post.id}>{post.title}</li>)}
    </ul>
  )
}
```

<a id="call-signature-3"></a>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/useQuery.ts:281](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQuery.ts#L281)

Fallback overload for options whose `initialData` presence isn't statically known — for example, an
object typed as [UseQueryOptions](../interfaces/UseQueryOptions.md) rather than an object literal. Prefer one of the other overloads
when possible, since they infer whether `data` can be `undefined` from `initialData` directly.

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UseQueryOptions](../interfaces/UseQueryOptions.md) to use — everything you can pass to `useQuery`.

#### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

### See

[queryOptions](queryOptions.md) to share these options between `useQuery` and imperative APIs like `queryClient.query`.

### Examples

```tsx
import { useQuery } from '@tanstack/preact-query'

function Posts() {
  const { status, data, error, isFetching } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (status === 'pending') return 'Loading...'
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <div>{isFetching ? 'Background Updating...' : ' '}</div>
    </div>
  )
}
```

`select` derives whatever `data` a component needs from the cached value, without changing what's
actually stored in the cache — the cache still holds the full `Post[]`, but `data` here is a `number`:
```tsx
import { useQuery } from '@tanstack/preact-query'

function PostCount() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    select: (posts) => posts.length,
  })

  if (isPending) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <span>{data} posts</span>
}
```

A dependent query, only enabled once `postId` is set — use `isLoading`, not `isPending`, so the
loading state doesn't show while the query is disabled:
```tsx
import { useQuery } from '@tanstack/preact-query'

function Post({ postId }: { postId: number | undefined }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId!),
    enabled: postId != null,
  })

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```

The same dependent query, type safe: `skipToken` disables the query without needing the
non-null assertion above, since `queryFn` is only ever called when `postId` is defined.
`refetch` doesn't work while `queryFn` is `skipToken` — use `enabled: false` instead if you
need to trigger the query manually:
```tsx
import { skipToken, useQuery } from '@tanstack/preact-query'

function Post({ postId }: { postId: number | undefined }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: postId != null ? () => fetchPost(postId) : skipToken,
  })

  if (postId == null) return 'Select a post'
  if (isLoading) return 'Loading...'
  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```

Seeding a detail query from an already-cached list, to skip the loading state. `initialDataUpdatedAt` carries
over the list's own fetch time, so that if you set a `staleTime`, it's measured from when the list was
fetched rather than from now:
```tsx
import { useQuery, useQueryClient } from '@tanstack/preact-query'

function Post({ postId }: { postId: number }) {
  const queryClient = useQueryClient()

  const { data, isError, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    initialData: () =>
      queryClient
        .getQueryData<Array<Post>>(['posts'])
        ?.find((post) => post.id === postId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['posts'])?.dataUpdatedAt,
  })

  if (isError) return <span>Error: {error.message}</span>

  return <h1>{data?.title}</h1>
}
```

Paginated data, keeping the previous page's data visible while the next page loads:
```tsx
import { keepPreviousData, useQuery } from '@tanstack/preact-query'
import { useState } from 'preact/hooks'

function Posts() {
  const [page, setPage] = useState(0)

  const { data, isPlaceholderData, isError, error } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    placeholderData: keepPreviousData,
  })

  if (isError) return <span>Error: {error.message}</span>

  return (
    <div>
      <ul>
        {data?.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
      <button
        disabled={isPlaceholderData}
        onClick={() => setPage((old) => old + 1)}
      >
        Next Page
      </button>
    </div>
  )
}
```

<a id="parameters-summary"></a>

## Parameters

### options

[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The [UseQueryOptions](../interfaces/UseQueryOptions.md) to use — everything you can pass to `useQuery`.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="options-property-enabled"></a> `enabled?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean`) | `true` | Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys. To refetch the query, use the `refetch` method returned from the `useQuery` instance. Accepts a boolean or function that returns a boolean. |
| <a id="options-property-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used. Setting it to `Infinity` will disable garbage collection. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see `timeoutManager.setTimeoutProvider` for a workaround. |
| <a id="options-property-initialdata"></a> `initialData?` | `TQueryFnData` \| (() => `TQueryFnData` \| `undefined`) | `undefined` | If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet). If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initial data. Initial data is considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the cache. |
| <a id="options-property-initialdataupdatedat"></a> `initialDataUpdatedAt?` | `number` \| (() => `number` \| `undefined`) | `undefined` | If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated. |
| <a id="options-property-maxpages"></a> `maxPages?` | `number` | `undefined` | Maximum number of pages to store in the data of an infinite query. |
| <a id="options-property-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on each query. Use this property to pass information that can be used in other places. |
| <a id="options-property-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a query is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="options-property-notifyonchangeprops"></a> `notifyOnChangeProps?` | \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `"all"` \| (() => \| `"all"` \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `undefined`) | `undefined` | If set, the component will only re-render if any of the listed properties change. When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change. When set to `'all'`, the component will re-render whenever a query is updated. When set to a function, the function will be executed to compute the list of properties. Defaults to `undefined`, in which case property access is tracked automatically, and the component only re-renders when one of the tracked properties changes. |
| <a id="options-property-persister"></a> `persister?` | (`queryFn`: (`context`: `object`) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>, `context`: `object`, `query`: [`Query`](../classes/Query.md)) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\> | `undefined` | This option can be used to persist the result of a query to an external storage, bypassing the need to actually call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries. |
| <a id="options-property-placeholderdata"></a> `placeholderData?` | \| `NonFunctionGuard`\<`TQueryFnData`\> \| ((`previousData`: `NonFunctionGuard`\<`TQueryFnData`\> \| `undefined`, `previousQuery`: \| [`Query`](../classes/Query.md)\<`NonFunctionGuard`\<`TQueryFnData`\>, `TError`, `NonFunctionGuard`\<`TQueryFnData`\>, `TQueryKey`\> \| `undefined`) => `NonFunctionGuard`\<`TQueryFnData`\> \| `undefined`) | `undefined` | If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided. |
| <a id="options-property-queryfn"></a> `queryFn?` | \| *typeof* [`skipToken`](../variables/skipToken.md) \| ((`context`: `object`) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>) | `undefined` | The function that the query will use to request data. Required, unless a default query function has been set via `queryClient.setQueryDefaults` or `queryClient.setDefaultOptions`. Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md). Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`. |
| <a id="options-property-queryhash"></a> `queryHash?` | `string` | `undefined` | The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used as the actual cache key internally. |
| <a id="options-property-querykey"></a> `queryKey` | `TQueryKey` & `object` | `undefined` | The query key to use for this query. The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) for more information. The query will automatically update when this key changes (as long as `enabled` is not set to `false`). |
| <a id="options-property-querykeyhashfn"></a> `queryKeyHashFn?` | (`queryKey`: `TQueryKey`) => `string` | `undefined` | If specified, this function is used to hash the `queryKey` to a string. |
| <a id="options-property-refetchinterval"></a> `refetchInterval?` | \| `number` \| `false` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `number` \| `false` \| `undefined`) | `false` | If set to a number, the query will continuously refetch at this frequency in milliseconds. If set to a function, the function will be executed with the latest data and query to compute a frequency |
| <a id="options-property-refetchintervalinbackground"></a> `refetchIntervalInBackground?` | `boolean` | `false` | If set to `true`, the query will continue to refetch while their tab/window is in the background. |
| <a id="options-property-refetchonmount"></a> `refetchOnMount?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on mount if the data is stale. If set to `false`, will disable additional instances of a query to trigger background refetch. If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value |
| <a id="options-property-refetchonreconnect"></a> `refetchOnReconnect?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean` \| `"always"`) | `undefined` | If set to `true`, the query will refetch on reconnect if the data is stale. If set to `false`, the query will not refetch on reconnect. If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true` unless `networkMode` is `'always'`. |
| <a id="options-property-refetchonwindowfocus"></a> `refetchOnWindowFocus?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on window focus if the data is stale. If set to `false`, the query will not refetch on window focus. If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. |
| <a id="options-property-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| ((`failureCount`: `number`, `error`: `TError`) => `boolean`) | `undefined` | If `false`, failed queries will not retry by default. If `true`, failed queries will retry infinitely. If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number. If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false. Defaults to `3` on the client and `0` on the server. |
| <a id="options-property-retrydelay"></a> `retryDelay?` | `number` \| ((`failureCount`: `number`, `error`: `TError`) => `number`) | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff. A function like `attempt => attempt * 1000` applies linear backoff. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="options-property-retryonmount"></a> `retryOnMount?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean`) | `true` | If set to `false`, the query will not be retried on mount if it contains an error. If set to a function, the function will be executed with the query to compute the value. |
| <a id="options-property-select"></a> `select?` | (`data`: `TQueryFnData`) => `TData` | `undefined` | This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache. The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, memoize the function so its reference stays stable across calls. |
| <a id="options-property-staletime"></a> `staleTime?` | \| `number` \| `"static"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `number` \| `"static"`) | `0` | The time in milliseconds after data is considered stale. If set to `Infinity`, the data will never be considered stale. If set to `'static'`, the data will never be considered stale. If set to a function, the function will be executed with the query to compute a `staleTime`. |
| <a id="options-property-structuralsharing"></a> `structuralSharing?` | `boolean` \| ((`oldData`: `unknown`, `newData`: `unknown`) => `unknown`) | `true` | Set this to `false` to disable structural sharing between query results. Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic. |
| <a id="options-property-subscribed"></a> `subscribed?` | `boolean` | `true` | Set this to `false` to unsubscribe this observer from updates to the query cache. |
| <a id="options-property-throwonerror"></a> `throwOnError?` | \| `false` \| `true` \| ((`error`: `TError`, `query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryFnData`, `TQueryKey`\>) => `boolean`) | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary. If set to `false` and `suspense` is `false`, errors are returned as state. If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`). |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

<a id="returns-summary"></a>

## Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`TData`, `TError`\>

The current query result. `status` is `pending` if there is no cached data to display, `error` if
the last fetch attempt failed, or `success` if the query has data to display. `isPending`/`isSuccess`/`isError`
are derived booleans for convenience.

<a id="result-properties"></a>

### Result properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="result-property-data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the query. |
| <a id="result-property-dataupdatedat"></a> `dataUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"success"`. |
| <a id="result-property-error"></a> `error` | `TError` \| `null` | The error object for the query, if an error was thrown. - Defaults to `null`. |
| <a id="result-property-errorupdatecount"></a> `errorUpdateCount` | `number` | The sum of all errors. |
| <a id="result-property-errorupdatedat"></a> `errorUpdatedAt` | `number` | The timestamp for when the query most recently returned the `status` as `"error"`. |
| <a id="result-property-failurecount"></a> `failureCount` | `number` | The failure count for the query. - Incremented every time the query fails. - Reset to `0` when the query succeeds. |
| <a id="result-property-failurereason"></a> `failureReason` | `TError` \| `null` | The failure reason for the query retry. - Reset to `null` when the query succeeds. |
| <a id="result-property-fetchstatus"></a> `fetchStatus` | `"fetching"` \| `"paused"` \| `"idle"` | The fetch status of the query. - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch. - `paused`: The query wanted to fetch, but has been `paused`. - `idle`: The query is not fetching. - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="result-property-isenabled"></a> `isEnabled` | `boolean` | `true` if this observer is enabled, `false` otherwise. |
| <a id="result-property-iserror"></a> `isError` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query attempt resulted in an error. |
| <a id="result-property-isfetched"></a> `isFetched` | `boolean` | Will be `true` if the query has been fetched. |
| <a id="result-property-isfetchedaftermount"></a> `isFetchedAfterMount` | `boolean` | Will be `true` if the query has been fetched after the component mounted. - This property can be used to not show any previously cached data. |
| <a id="result-property-isfetching"></a> `isFetching` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch. |
| <a id="result-property-isinitialloading"></a> ~~`isInitialLoading`~~ | `boolean` | **Deprecated** `isInitialLoading` is being deprecated in favor of `isLoading` and will be removed in the next major version. |
| <a id="result-property-isloading"></a> `isLoading` | `boolean` | Is `true` whenever the first fetch for a query is in-flight. - Is the same as `isFetching && isPending`. |
| <a id="result-property-isloadingerror"></a> `isLoadingError` | `boolean` | Will be `true` if the query failed while fetching for the first time. |
| <a id="result-property-ispaused"></a> `isPaused` | `boolean` | A derived boolean from the `fetchStatus` variable, provided for convenience. - The query wanted to fetch, but has been `paused`. |
| <a id="result-property-ispending"></a> `isPending` | `boolean` | Will be `pending` if there's no cached data and no query attempt was finished yet. |
| <a id="result-property-isplaceholderdata"></a> `isPlaceholderData` | `boolean` | Will be `true` if the data shown is the placeholder data. |
| <a id="result-property-isrefetcherror"></a> `isRefetchError` | `boolean` | Will be `true` if the query failed while refetching. |
| <a id="result-property-isrefetching"></a> `isRefetching` | `boolean` | Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`. - Is the same as `isFetching && !isPending`. |
| <a id="result-property-isstale"></a> `isStale` | `boolean` | Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`. |
| <a id="result-property-issuccess"></a> `isSuccess` | `boolean` | A derived boolean from the `status` variable, provided for convenience. - `true` if the query has received a response with no errors and is ready to display its data. |
| <a id="result-property-refetch"></a> `refetch` | (`options?`: [`RefetchOptions`](../interfaces/RefetchOptions.md)) => `Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\> | A function to manually refetch the query. |
| <a id="result-property-status"></a> `status` | `"error"` \| `"pending"` \| `"success"` | The status of the query. - Will be: - `pending` if there's no cached data and no query attempt was finished yet. - `error` if the query attempt resulted in an error. - `success` if the query has received a response with no errors and is ready to display its data. |
