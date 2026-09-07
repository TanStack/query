---
id: CreateInfiniteQueryOptions
title: CreateInfiniteQueryOptions
---

Defined in: [packages/angular-query-experimental/src/types.ts:121](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L121)

The options accepted by `injectInfiniteQuery`. Same as [CreateBaseQueryOptions](CreateBaseQueryOptions.md), minus `suspense` —
which `angular-query-experimental` doesn't support, unlike `react-query` — extends
[InfiniteQueryObserverOptions](InfiniteQueryObserverOptions.md) from `@tanstack/query-core` for the infinite-query-specific options
(`getNextPageParam`, `initialPageParam`, etc.).

## Extends

- [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`InfiniteQueryObserverOptions`](InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"suspense"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` here, though
`injectInfiniteQuery` itself defaults it to `InfiniteData<TQueryFnData>` — the shape `data` actually has
when no `select` is used.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.

## Properties

### enabled?

```ts
optional enabled: QueryBooleanOption<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:398](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L398)

Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys.
To refetch the query, use the `refetch` method returned from the `useQuery` instance.
Accepts a boolean or function that returns a boolean.

Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.enabled
```

***

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:277](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L277)

The time in milliseconds that unused/inactive cache data remains in memory.
When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
When different garbage collection times are specified, the longest one will be used.
Setting it to `Infinity` will disable garbage collection.

Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR.

Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see
`timeoutManager.setTimeoutProvider` for a workaround.

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`gcTime`](QueryOptions.md#gctime)

***

### getNextPageParam

```ts
getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:365](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L365)

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

#### Inherited from

```ts
OmitKeyof.getNextPageParam
```

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:360](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L360)

This function can be set to automatically get the previous cursor for infinite queries.
The result will also be used to determine the value of `hasPreviousPage`.

#### Inherited from

```ts
OmitKeyof.getPreviousPageParam
```

***

### initialData?

```ts
optional initialData: 
  | InfiniteData<TQueryFnData, TPageParam>
| InitialDataFunction<InfiniteData<TQueryFnData, TPageParam>>;
```

Defined in: [packages/query-core/src/types.ts:317](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L317)

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet).
If set to a function, the function will be called **once** during the shared/root query initialization, and be
expected to synchronously return the initial data.
Initial data is considered stale by default unless a `staleTime` has been set.
`initialData` **is persisted** to the cache.

#### Inherited from

```ts
OmitKeyof.initialData
```

***

### initialDataUpdatedAt?

```ts
optional initialDataUpdatedAt: number | () => number | undefined;
```

Defined in: [packages/query-core/src/types.ts:321](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L321)

If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated.

#### Inherited from

```ts
OmitKeyof.initialDataUpdatedAt
```

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: [packages/query-core/src/types.ts:349](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L349)

#### Inherited from

```ts
OmitKeyof.initialPageParam
```

***

### maxPages?

```ts
optional maxPages: number;
```

Defined in: [packages/query-core/src/types.ts:345](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L345)

Maximum number of pages to store in the data of an infinite query.

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`maxPages`](QueryOptions.md#maxpages)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:341](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L341)

Additional payload to be stored on each query.
Use this property to pass information that can be used in other places.

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`meta`](QueryOptions.md#meta)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:265](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L265)

Controls whether a query is allowed to run based on the current network connectivity.

Defaults to `'online'`.

#### See

[Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`networkMode`](QueryOptions.md#networkmode)

***

### notifyOnChangeProps?

```ts
optional notifyOnChangeProps: NotifyOnChangeProps;
```

Defined in: [packages/query-core/src/types.ts:484](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L484)

If set, the component will only re-render if any of the listed properties change.
When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change.
When set to `'all'`, the component will re-render whenever a query is updated.
When set to a function, the function will be executed to compute the list of properties.

Defaults to `undefined`, in which case property access is tracked automatically, and the
component only re-renders when one of the tracked properties changes.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`notifyOnChangeProps`](QueryObserverOptions.md#notifyonchangeprops)

***

### persister?

```ts
optional persister: QueryPersister<TQueryFnData, NoInfer<TQueryKey>, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:290](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L290)

This option can be used to persist the result of a query to an external storage, bypassing the need to actually
call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries.

#### Inherited from

```ts
OmitKeyof.persister
```

***

### placeholderData?

```ts
optional placeholderData: 
  | InfiniteData<TQueryFnData, TPageParam>
| PlaceholderDataFunction<InfiniteData<TQueryFnData, TPageParam>, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:511](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L511)

If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided.

#### Inherited from

```ts
OmitKeyof.placeholderData
```

***

### queryFn?

```ts
optional queryFn: 
  | typeof skipToken
| QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:285](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L285)

The function that the query will use to request data.
Required, unless a default query function has been set via `queryClient.setQueryDefaults` or
`queryClient.setDefaultOptions`.
Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md).
Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`.

#### Inherited from

```ts
OmitKeyof.queryFn
```

***

### queryHash?

```ts
optional queryHash: string;
```

Defined in: [packages/query-core/src/types.ts:295](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L295)

The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used
as the actual cache key internally.

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`queryHash`](QueryOptions.md#queryhash)

***

### queryKey

```ts
queryKey: TQueryKey & object;
```

Defined in: [packages/query-core/src/types.ts:304](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L304)

The query key to use for this query.

The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
for more information.

The query will automatically update when this key changes (as long as `enabled` is not set to `false`).

#### Inherited from

```ts
OmitKeyof.queryKey
```

***

### queryKeyHashFn?

```ts
optional queryKeyHashFn: QueryKeyHashFunction<TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:308](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L308)

If specified, this function is used to hash the `queryKey` to a string.

#### Inherited from

```ts
OmitKeyof.queryKeyHashFn
```

***

### refetchInterval?

```ts
optional refetchInterval: number | false | (query) => number | false | undefined;
```

Defined in: [packages/query-core/src/types.ts:414](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L414)

If set to a number, the query will continuously refetch at this frequency in milliseconds.
If set to a function, the function will be executed with the latest data and query to compute a frequency

Defaults to `false`.

#### Inherited from

```ts
OmitKeyof.refetchInterval
```

***

### refetchIntervalInBackground?

```ts
optional refetchIntervalInBackground: boolean;
```

Defined in: [packages/query-core/src/types.ts:425](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L425)

If set to `true`, the query will continue to refetch while their tab/window is in the background.

Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchIntervalInBackground`](QueryObserverOptions.md#refetchintervalinbackground)

***

### refetchOnMount?

```ts
optional refetchOnMount: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:462](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L462)

If set to `true`, the query will refetch on mount if the data is stale.
If set to `false`, will disable additional instances of a query to trigger background refetch.
If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used).
If set to a function, the function will be executed with the latest data and query to compute the value

Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.refetchOnMount
```

***

### refetchOnReconnect?

```ts
optional refetchOnReconnect: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:448](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L448)

If set to `true`, the query will refetch on reconnect if the data is stale.
If set to `false`, the query will not refetch on reconnect.
If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used).
If set to a function, the function will be executed with the latest data and query to compute the value.

Defaults to `true` unless `networkMode` is `'always'`.

#### Inherited from

```ts
OmitKeyof.refetchOnReconnect
```

***

### refetchOnWindowFocus?

```ts
optional refetchOnWindowFocus: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:434](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L434)

If set to `true`, the query will refetch on window focus if the data is stale.
If set to `false`, the query will not refetch on window focus.
If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used).
If set to a function, the function will be executed with the latest data and query to compute the value.

Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.refetchOnWindowFocus
```

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:246](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L246)

If `false`, failed queries will not retry by default.
If `true`, failed queries will retry infinitely.
If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.

Defaults to `3` on the client and `0` on the server.

#### Inherited from

```ts
OmitKeyof.retry
```

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L258)

This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the
next attempt in milliseconds.

A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential
backoff.

A function like `attempt => attempt * 1000` applies linear backoff.

Defaults to a function that applies exponential backoff, capped at 30 seconds.

#### Inherited from

```ts
OmitKeyof.retryDelay
```

***

### retryOnMount?

```ts
optional retryOnMount: QueryBooleanOption<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:474](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L474)

If set to `false`, the query will not be retried on mount if it contains an error.
If set to a function, the function will be executed with the query to compute the value.

Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.retryOnMount
```

***

### select()?

```ts
optional select: (data) => TData;
```

Defined in: [packages/query-core/src/types.ts:500](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L500)

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

```ts
OmitKeyof.select
```

***

### staleTime?

```ts
optional staleTime: StaleTimeFunction<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:407](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L407)

The time in milliseconds after data is considered stale.
If set to `Infinity`, the data will never be considered stale.
If set to `'static'`, the data will never be considered stale.
If set to a function, the function will be executed with the query to compute a `staleTime`.

Defaults to `0`.

#### Inherited from

```ts
OmitKeyof.staleTime
```

***

### structuralSharing?

```ts
optional structuralSharing: boolean | (oldData, newData) => unknown;
```

Defined in: [packages/query-core/src/types.ts:330](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L330)

Set this to `false` to disable structural sharing between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.

Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.structuralSharing
```

***

### throwOnError?

```ts
optional throwOnError: ThrowOnError<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:493](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L493)

Whether errors should be thrown instead of setting the `error` property.
If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
If set to `false` and `suspense` is `false`, errors are returned as state.
If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).

Defaults to `false`.

#### Inherited from

```ts
OmitKeyof.throwOnError
```
