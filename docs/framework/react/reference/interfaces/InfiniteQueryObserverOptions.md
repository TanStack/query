---
id: InfiniteQueryObserverOptions
title: InfiniteQueryObserverOptions
---

Defined in: [packages/query-core/src/types.ts:520](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L520)

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

### enabled?

```ts
optional enabled: QueryBooleanOption<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:390](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L390)

Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys.
To refetch the query, use the `refetch` method returned from the `useQuery` instance.
Accepts a boolean or function that returns a boolean.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`enabled`](QueryObserverOptions.md#enabled)

***

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:271](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L271)

The time in milliseconds that unused/inactive cache data remains in memory.
When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
When different garbage collection times are specified, the longest one will be used.
Setting it to `Infinity` will disable garbage collection.
Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR.

Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see
`timeoutManager.setTimeoutProvider` for a workaround.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`gcTime`](QueryObserverOptions.md#gctime)

***

### getNextPageParam

```ts
getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:358](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L358)

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

#### Inherited from

[`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md).[`getNextPageParam`](InfiniteQueryPageParamsOptions.md#getnextpageparam)

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:353](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L353)

This function can be set to automatically get the previous cursor for infinite queries.
The result will also be used to determine the value of `hasPreviousPage`.

#### Inherited from

[`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md).[`getPreviousPageParam`](InfiniteQueryPageParamsOptions.md#getpreviouspageparam)

***

### initialData?

```ts
optional initialData: 
  | InfiniteData<TQueryFnData, TPageParam>
| InitialDataFunction<InfiniteData<TQueryFnData, TPageParam>>;
```

Defined in: [packages/query-core/src/types.ts:311](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L311)

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet).
If set to a function, the function will be called **once** during the shared/root query initialization, and be
expected to synchronously return the initial data.
Initial data is considered stale by default unless a `staleTime` has been set.
`initialData` **is persisted** to the cache.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`initialData`](QueryObserverOptions.md#initialdata)

***

### initialDataUpdatedAt?

```ts
optional initialDataUpdatedAt: number | () => number | undefined;
```

Defined in: [packages/query-core/src/types.ts:315](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L315)

If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`initialDataUpdatedAt`](QueryObserverOptions.md#initialdataupdatedat)

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: [packages/query-core/src/types.ts:342](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L342)

#### Inherited from

[`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md).[`initialPageParam`](InfiniteQueryPageParamsOptions.md#initialpageparam)

***

### maxPages?

```ts
optional maxPages: number;
```

Defined in: [packages/query-core/src/types.ts:338](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L338)

Maximum number of pages to store in the data of an infinite query.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`maxPages`](QueryObserverOptions.md#maxpages)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:334](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L334)

Additional payload to be stored on each query.
Use this property to pass information that can be used in other places.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`meta`](QueryObserverOptions.md#meta)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:260](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L260)

Defaults to `'online'`.

#### See

[Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`networkMode`](QueryObserverOptions.md#networkmode)

***

### notifyOnChangeProps?

```ts
optional notifyOnChangeProps: NotifyOnChangeProps;
```

Defined in: [packages/query-core/src/types.ts:467](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L467)

If set, the component will only re-render if any of the listed properties change.
When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change.
When set to `'all'`, the component will re-render whenever a query is updated.
When set to a function, the function will be executed to compute the list of properties.
By default, access to properties will be tracked, and the component will only re-render when one of the tracked properties change.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`notifyOnChangeProps`](QueryObserverOptions.md#notifyonchangeprops)

***

### persister?

```ts
optional persister: QueryPersister<TQueryFnData, NoInfer<TQueryKey>, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:284](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L284)

This option can be used to persist the result of a query to an external storage, bypassing the need to actually
call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`persister`](QueryObserverOptions.md#persister)

***

### placeholderData?

```ts
optional placeholderData: 
  | InfiniteData<TQueryFnData, TPageParam>
| PlaceholderDataFunction<InfiniteData<TQueryFnData, TPageParam>, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:492](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L492)

If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`placeholderData`](QueryObserverOptions.md#placeholderdata)

***

### queryFn?

```ts
optional queryFn: 
  | typeof skipToken
| QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:279](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L279)

The function that the query will use to request data.
Required, unless a default query function has been set via `queryClient.setQueryDefaults` or
`queryClient.setDefaultOptions`.
Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md).
Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryFn`](QueryObserverOptions.md#queryfn)

***

### queryHash?

```ts
optional queryHash: string;
```

Defined in: [packages/query-core/src/types.ts:289](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L289)

The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used
as the actual cache key internally.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryHash`](QueryObserverOptions.md#queryhash)

***

### queryKey

```ts
queryKey: TQueryKey & object;
```

Defined in: [packages/query-core/src/types.ts:298](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L298)

The query key to use for this query.

The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
for more information.

The query will automatically update when this key changes (as long as `enabled` is not set to `false`).

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryKey`](QueryObserverOptions.md#querykey)

***

### queryKeyHashFn?

```ts
optional queryKeyHashFn: QueryKeyHashFunction<TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:302](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L302)

If specified, this function is used to hash the `queryKey` to a string.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryKeyHashFn`](QueryObserverOptions.md#querykeyhashfn)

***

### refetchInterval?

```ts
optional refetchInterval: number | false | (query) => number | false | undefined;
```

Defined in: [packages/query-core/src/types.ts:404](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L404)

If set to a number, the query will continuously refetch at this frequency in milliseconds.
If set to a function, the function will be executed with the latest data and query to compute a frequency
Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchInterval`](QueryObserverOptions.md#refetchinterval)

***

### refetchIntervalInBackground?

```ts
optional refetchIntervalInBackground: boolean;
```

Defined in: [packages/query-core/src/types.ts:414](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L414)

If set to `true`, the query will continue to refetch while their tab/window is in the background.
Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchIntervalInBackground`](QueryObserverOptions.md#refetchintervalinbackground)

***

### refetchOnMount?

```ts
optional refetchOnMount: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:448](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L448)

If set to `true`, the query will refetch on mount if the data is stale.
If set to `false`, will disable additional instances of a query to trigger background refetch.
If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used).
If set to a function, the function will be executed with the latest data and query to compute the value
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchOnMount`](QueryObserverOptions.md#refetchonmount)

***

### refetchOnReconnect?

```ts
optional refetchOnReconnect: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:435](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L435)

If set to `true`, the query will refetch on reconnect if the data is stale.
If set to `false`, the query will not refetch on reconnect.
If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used).
If set to a function, the function will be executed with the latest data and query to compute the value.
Defaults to `true` unless `networkMode` is `'always'`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchOnReconnect`](QueryObserverOptions.md#refetchonreconnect)

***

### refetchOnWindowFocus?

```ts
optional refetchOnWindowFocus: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:422](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L422)

If set to `true`, the query will refetch on window focus if the data is stale.
If set to `false`, the query will not refetch on window focus.
If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used).
If set to a function, the function will be executed with the latest data and query to compute the value.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchOnWindowFocus`](QueryObserverOptions.md#refetchonwindowfocus)

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:245](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L245)

If `false`, failed queries will not retry by default.
If `true`, failed queries will retry infinitely.
If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.
Defaults to `3` on the client and `0` on the server.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`retry`](QueryObserverOptions.md#retry)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:255](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L255)

This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the
next attempt in milliseconds.

A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential
backoff.

A function like `attempt => attempt * 1000` applies linear backoff.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`retryDelay`](QueryObserverOptions.md#retrydelay)

***

### retryOnMount?

```ts
optional retryOnMount: QueryBooleanOption<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:459](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L459)

If set to `false`, the query will not be retried on mount if it contains an error.
If set to a function, the function will be executed with the query to compute the value.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`retryOnMount`](QueryObserverOptions.md#retryonmount)

***

### select()?

```ts
optional select: (data) => TData;
```

Defined in: [packages/query-core/src/types.ts:482](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L482)

This option can be used to transform or select a part of the data returned by the query function. It affects
the returned `data` value, but does not affect what gets stored in the query cache.
The `select` function will only run if `data` changed, or if the reference to the `select` function itself
changes. To optimize, memoize the function so its reference stays stable across calls.

#### Parameters

##### data

[`InfiniteData`](InfiniteData.md)

#### Returns

`TData`

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`select`](QueryObserverOptions.md#select)

***

### staleTime?

```ts
optional staleTime: StaleTimeFunction<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:398](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L398)

The time in milliseconds after data is considered stale.
If set to `Infinity`, the data will never be considered stale.
If set to `'static'`, the data will never be considered stale.
If set to a function, the function will be executed with the query to compute a `staleTime`.
Defaults to `0`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`staleTime`](QueryObserverOptions.md#staletime)

***

### structuralSharing?

```ts
optional structuralSharing: boolean | (oldData, newData) => unknown;
```

Defined in: [packages/query-core/src/types.ts:323](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L323)

Set this to `false` to disable structural sharing between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`structuralSharing`](QueryObserverOptions.md#structuralsharing)

***

### suspense?

```ts
optional suspense: boolean;
```

Defined in: [packages/query-core/src/types.ts:488](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L488)

If set to `true`, the query will suspend when `status === 'pending'`
and throw errors when `status === 'error'`.
Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`suspense`](QueryObserverOptions.md#suspense)

***

### throwOnError?

```ts
optional throwOnError: ThrowOnError<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:475](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L475)

Whether errors should be thrown instead of setting the `error` property.
If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
If set to `false` and `suspense` is `false`, errors are returned as state.
If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).
Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`throwOnError`](QueryObserverOptions.md#throwonerror)
