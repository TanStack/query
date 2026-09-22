---
id: InfiniteQueryObserverOptions
title: InfiniteQueryObserverOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:319

## Extends

- [`QueryObserverOptions`](QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`, `TPageParam`\>.[`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md)\<`TQueryFnData`, `TPageParam`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

### TPageParam

`TPageParam` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="enabled"></a> `enabled?` | [`QueryBooleanOption`](../type-aliases/QueryBooleanOption.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> | Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys. To refetch the query, use the `refetch` method returned from the `useQuery` instance. Accepts a boolean or function that returns a boolean. Defaults to `true`. |
| <a id="gctime"></a> `gcTime?` | `number` | The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used. Setting it to `Infinity` will disable garbage collection. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see `timeoutManager.setTimeoutProvider` for a workaround. |
| <a id="getnextpageparam"></a> `getNextPageParam` | [`GetNextPageParamFunction`](../type-aliases/GetNextPageParamFunction.md)\<`TPageParam`, `TQueryFnData`\> | This function can be set to automatically get the next cursor for infinite queries. The result will also be used to determine the value of `hasNextPage`. |
| <a id="getpreviouspageparam"></a> `getPreviousPageParam?` | [`GetPreviousPageParamFunction`](../type-aliases/GetPreviousPageParamFunction.md)\<`TPageParam`, `TQueryFnData`\> | This function can be set to automatically get the previous cursor for infinite queries. The result will also be used to determine the value of `hasPreviousPage`. |
| <a id="initialdata"></a> `initialData?` | \| [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| [`InitialDataFunction`](../type-aliases/InitialDataFunction.md)\<[`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>\> | If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet). If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initial data. Initial data is considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the cache. |
| <a id="initialdataupdatedat"></a> `initialDataUpdatedAt?` | `number` \| () => `number` \| `undefined` | If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated. |
| <a id="initialpageparam"></a> `initialPageParam` | `TPageParam` | - |
| <a id="maxpages"></a> `maxPages?` | `number` | Maximum number of pages to store in the data of an infinite query. |
| <a id="meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | Additional payload to be stored on each query. Use this property to pass information that can be used in other places. |
| <a id="networkmode"></a> `networkMode?` | [`NetworkMode`](../type-aliases/NetworkMode.md) | Controls whether a query is allowed to run based on the current network connectivity. Defaults to `'online'`. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="notifyonchangeprops"></a> `notifyOnChangeProps?` | [`NotifyOnChangeProps`](../type-aliases/NotifyOnChangeProps.md) | If set, the component will only re-render if any of the listed properties change. When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change. When set to `'all'`, the component will re-render whenever a query is updated. When set to a function, the function will be executed to compute the list of properties. Defaults to `undefined`, in which case property access is tracked automatically, and the component only re-renders when one of the tracked properties changes. |
| <a id="persister"></a> `persister?` | [`QueryPersister`](../type-aliases/QueryPersister.md)\<`TQueryFnData`, `NoInfer`\<`TQueryKey`\>, `TPageParam`\> | This option can be used to persist the result of a query to an external storage, bypassing the need to actually call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries. |
| <a id="placeholderdata"></a> `placeholderData?` | \| [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\> \| [`PlaceholderDataFunction`](../type-aliases/PlaceholderDataFunction.md)\<[`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> | If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided. |
| <a id="queryfn"></a> `queryFn?` | \| *typeof* [`skipToken`](../variables/skipToken.md) \| [`QueryFunction`](../type-aliases/QueryFunction.md)\<`TQueryFnData`, `TQueryKey`, `TPageParam`\> | The function that the query will use to request data. Required, unless a default query function has been set via `queryClient.setQueryDefaults` or `queryClient.setDefaultOptions`. Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md). Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`. |
| <a id="queryhash"></a> `queryHash?` | `string` | The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used as the actual cache key internally. |
| <a id="querykey"></a> `queryKey` | `TQueryKey` & `object` | The query key to use for this query. The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) for more information. The query will automatically update when this key changes (as long as `enabled` is not set to `false`). |
| <a id="querykeyhashfn"></a> `queryKeyHashFn?` | [`QueryKeyHashFunction`](../type-aliases/QueryKeyHashFunction.md)\<`TQueryKey`\> | If specified, this function is used to hash the `queryKey` to a string. |
| <a id="refetchinterval"></a> `refetchInterval?` | \| `number` \| `false` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `number` \| `false` \| `undefined` | If set to a number, the query will continuously refetch at this frequency in milliseconds. If set to a function, the function will be executed with the latest data and query to compute a frequency Defaults to `false`. |
| <a id="refetchintervalinbackground"></a> `refetchIntervalInBackground?` | `boolean` | If set to `true`, the query will continue to refetch while their tab/window is in the background. Defaults to `false`. |
| <a id="refetchonmount"></a> `refetchOnMount?` | \| `boolean` \| `"always"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"` | If set to `true`, the query will refetch on mount if the data is stale. If set to `false`, will disable additional instances of a query to trigger background refetch. If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value Defaults to `true`. |
| <a id="refetchonreconnect"></a> `refetchOnReconnect?` | \| `boolean` \| `"always"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"` | If set to `true`, the query will refetch on reconnect if the data is stale. If set to `false`, the query will not refetch on reconnect. If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true` unless `networkMode` is `'always'`. |
| <a id="refetchonwindowfocus"></a> `refetchOnWindowFocus?` | \| `boolean` \| `"always"` \| (`query`: [`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>) => `boolean` \| `"always"` | If set to `true`, the query will refetch on window focus if the data is stale. If set to `false`, the query will not refetch on window focus. If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used). If set to a function, the function will be executed with the latest data and query to compute the value. Defaults to `true`. |
| <a id="retry"></a> `retry?` | `RetryValue`\<`TError`\> | If `false`, failed queries will not retry by default. If `true`, failed queries will retry infinitely. If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number. If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false. Defaults to `3` on the client and `0` on the server. |
| <a id="retrydelay"></a> `retryDelay?` | `RetryDelayValue`\<`TError`\> | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff. A function like `attempt => attempt * 1000` applies linear backoff. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="retryonmount"></a> `retryOnMount?` | [`QueryBooleanOption`](../type-aliases/QueryBooleanOption.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> | If set to `false`, the query will not be retried on mount if it contains an error. If set to a function, the function will be executed with the query to compute the value. Defaults to `true`. |
| <a id="select"></a> `select?` | (`data`: [`InfiniteData`](InfiniteData.md)) => `TData` | This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache. The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, memoize the function so its reference stays stable across calls. |
| <a id="staletime"></a> `staleTime?` | [`StaleTimeFunction`](../type-aliases/StaleTimeFunction.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> | The time in milliseconds after data is considered stale. If set to `Infinity`, the data will never be considered stale. If set to `'static'`, the data will never be considered stale. If set to a function, the function will be executed with the query to compute a `staleTime`. Defaults to `0`. |
| <a id="structuralsharing"></a> `structuralSharing?` | `boolean` \| (`oldData`: `unknown`, `newData`: `unknown`) => `unknown` | Set this to `false` to disable structural sharing between query results. Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic. Defaults to `true`. |
| <a id="suspense"></a> `suspense?` | `boolean` | If set to `true`, the query will suspend when `status === 'pending'` and throw errors when `status === 'error'`. Defaults to `false`. |
| <a id="throwonerror"></a> `throwOnError?` | [`ThrowOnError`](../type-aliases/ThrowOnError.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\> | Whether errors should be thrown instead of setting the `error` property. If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary. If set to `false` and `suspense` is `false`, errors are returned as state. If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`). Defaults to `false`. |
