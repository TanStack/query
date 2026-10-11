---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options: InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [packages/lit-query/src/infiniteQueryOptions.ts:26](https://github.com/TanStack/query/blob/main/packages/lit-query/src/infiniteQueryOptions.ts#L26)

Brands infinite query options so the `queryKey` carries the infinite query
data and error types across TanStack Query APIs.

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

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

Infinite query options to preserve and brand.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="options-property-enabled"></a> `enabled?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean`) | `true` | Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys. To refetch the query, use the `refetch` method returned from the `useQuery` instance. Accepts a boolean or function that returns a boolean. |
| <a id="options-property-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used. Setting it to `Infinity` will disable garbage collection. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see `timeoutManager.setTimeoutProvider` for a workaround. |
| <a id="options-property-getnextpageparam"></a> `getNextPageParam` | (`lastPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `lastPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | `undefined` | This function can be set to automatically get the next cursor for infinite queries. The result will also be used to determine the value of `hasNextPage`. |
| <a id="options-property-getpreviouspageparam"></a> `getPreviousPageParam?` | (`firstPage`: `TQueryFnData`, `allPages`: `TQueryFnData`[], `firstPageParam`: `TPageParam`, `allPageParams`: `TPageParam`[]) => `TPageParam` \| `null` \| `undefined` | `undefined` | This function can be set to automatically get the previous cursor for infinite queries. The result will also be used to determine the value of `hasPreviousPage`. |
| <a id="options-property-initialdata"></a> `initialData?` | \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| (() => \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`) | `undefined` | If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet). If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initial data. Initial data is considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the cache. |
| <a id="options-property-initialdataupdatedat"></a> `initialDataUpdatedAt?` | `number` \| (() => `number` \| `undefined`) | `undefined` | If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated. |
| <a id="options-property-initialpageparam"></a> `initialPageParam` | `TPageParam` | `undefined` | The page param to start from when an infinite query has no pages yet. It is passed to `queryFn` as `pageParam` for the first page; every page after that gets the value returned by `getNextPageParam` or `getPreviousPageParam`. It only applies while the query has no pages: once a first page exists, refetching starts from that page's own param instead. |
| <a id="options-property-maxpages"></a> `maxPages?` | `number` | `undefined` | Maximum number of pages to store in the data of an infinite query. |
| <a id="options-property-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on each query. Use this property to pass information that can be used in other places. |
| <a id="options-property-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a query is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="options-property-notifyonchangeprops"></a> `notifyOnChangeProps?` | \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `"all"` \| (() => \| `"all"` \| ( \| `"error"` \| `"data"` \| `"isError"` \| `"isPending"` \| `"isLoading"` \| `"isLoadingError"` \| `"isRefetchError"` \| `"isSuccess"` \| `"isPlaceholderData"` \| `"status"` \| `"dataUpdatedAt"` \| `"errorUpdatedAt"` \| `"failureCount"` \| `"failureReason"` \| `"errorUpdateCount"` \| `"isFetched"` \| `"isFetchedAfterMount"` \| `"isFetching"` \| `"isInitialLoading"` \| `"isPaused"` \| `"isRefetching"` \| `"isStale"` \| `"isEnabled"` \| `"refetch"` \| `"fetchStatus"` \| `"fetchNextPage"` \| `"fetchPreviousPage"` \| `"hasNextPage"` \| `"hasPreviousPage"` \| `"isFetchNextPageError"` \| `"isFetchingNextPage"` \| `"isFetchPreviousPageError"` \| `"isFetchingPreviousPage"`)[] \| `undefined`) | `undefined` | If set, the component will only re-render if any of the listed properties change. When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change. When set to `'all'`, the component will re-render whenever a query is updated. When set to a function, the function will be executed to compute the list of properties. Defaults to `undefined`, in which case property access is tracked automatically, and the component only re-renders when one of the tracked properties changes. |
| <a id="options-property-persister"></a> `persister?` | (`queryFn`: (`context`: [`QueryFunctionContext`](../type-aliases/QueryFunctionContext.md)\<`NoInfer`\<`TQueryKey`\>, `TPageParam`\>) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>, `context`: `object`, `query`: [`Query`](../classes/Query.md)) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\> | `undefined` | This option can be used to persist the result of a query to an external storage, bypassing the need to actually call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries. |
| <a id="options-property-placeholderdata"></a> `placeholderData?` | \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| ((`previousData`: \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`, `previousQuery`: \| [`Query`](../classes/Query.md)\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> \| `undefined`) => \| [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| `undefined`) | `undefined` | If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided. |
| <a id="options-property-queryfn"></a> `queryFn?` | \| *typeof* [`skipToken`](../variables/skipToken.md) \| ((`context`: [`QueryFunctionContext`](../type-aliases/QueryFunctionContext.md)\<`TQueryKey`, `TPageParam`\>) => `TQueryFnData` \| `Promise`\<`TQueryFnData`\>) | `undefined` | The function that the query will use to request data. Required, unless a default query function has been set via `queryClient.setQueryDefaults` or `queryClient.setDefaultOptions`. Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md). Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`. |
| <a id="options-property-queryhash"></a> `queryHash?` | `string` | `undefined` | The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used as the actual cache key internally. |
| <a id="options-property-querykey"></a> `queryKey` | `TQueryKey` & `object` | `undefined` | The query key to use for this query. The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) for more information. The query will automatically update when this key changes (as long as `enabled` is not set to `false`). |
| <a id="options-property-querykeyhashfn"></a> `queryKeyHashFn?` | (`queryKey`: `TQueryKey`) => `string` | `undefined` | If specified, this function is used to hash the `queryKey` to a string. |
| <a id="options-property-refetchinterval"></a> `refetchInterval?` | \| `number` \| `false` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `false` \| `undefined`) | `false` | If set to a number, the query will continuously refetch at this frequency in milliseconds. If set to a function, the function will be executed with the latest data and query to compute a frequency |
| <a id="options-property-refetchintervalinbackground"></a> `refetchIntervalInBackground?` | `boolean` | `false` | If set to `true`, the query will continue to refetch while their tab/window is in the background. |
| <a id="options-property-refetchonmount"></a> `refetchOnMount?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on mount if the data is stale. If set to `false`, will disable additional instances of a query to trigger background refetch. If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value |
| <a id="options-property-refetchonreconnect"></a> `refetchOnReconnect?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"`) | `undefined` | If set to `true`, the query will refetch on reconnect if the data is stale. If set to `false`, the query will not refetch on reconnect. If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true` unless `networkMode` is `'always'`. |
| <a id="options-property-refetchonwindowfocus"></a> `refetchOnWindowFocus?` | \| `boolean` \| `"always"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"`) | `true` | If set to `true`, the query will refetch on window focus if the data is stale. If set to `false`, the query will not refetch on window focus. If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. |
| <a id="options-property-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| ((`failureCount`: `number`, `error`: `TError`) => `boolean`) | `undefined` | If `false`, failed queries will not retry by default. If `true`, failed queries will retry infinitely. If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number. If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false. Defaults to `3` on the client and `0` on the server. |
| <a id="options-property-retrydelay"></a> `retryDelay?` | `number` \| ((`failureCount`: `number`, `error`: `TError`) => `number`) | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff. A function like `attempt => attempt * 1000` applies linear backoff. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="options-property-retryonmount"></a> `retryOnMount?` | \| `false` \| `true` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean`) | `true` | If set to `false`, the query will not be retried on mount if it contains an error. If set to a function, the function will be executed with the query to compute the value. |
| <a id="options-property-select"></a> `select?` | (`data`: [`InfiniteData`](../interfaces/InfiniteData.md)) => `TData` | `undefined` | This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache. The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, memoize the function so its reference stays stable across calls. |
| <a id="options-property-staletime"></a> `staleTime?` | \| `number` \| `"static"` \| ((`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `"static"`) | `0` | The time in milliseconds after data is considered stale. If set to `Infinity`, the data will never be considered stale. If set to `'static'`, the data will never be considered stale. If set to a function, the function will be executed with the query to compute a `staleTime`. |
| <a id="options-property-structuralsharing"></a> `structuralSharing?` | `boolean` \| ((`oldData`: `unknown`, `newData`: `unknown`) => `unknown`) | `true` | Set this to `false` to disable structural sharing between query results. Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic. |
| <a id="options-property-suspense"></a> `suspense?` | `boolean` | `false` | If set to `true`, the query will suspend when `status === 'pending'` and throw errors when `status === 'error'`. |
| <a id="options-property-throwonerror"></a> `throwOnError?` | \| `false` \| `true` \| ((`error`: `TError`, `query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean`) | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary. If set to `false` and `suspense` is `false`, errors are returned as state. If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`). |

## Returns

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The same options object with a typed `queryKey`.

<a id="result-properties"></a>

### Result properties

Built from [`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md#properties). See the type above for what it changes.

## Example

```ts
import { infiniteQueryOptions } from '@tanstack/lit-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```
