---
id: InfiniteQueryObserverOptions
title: InfiniteQueryObserverOptions
---

# Interface: InfiniteQueryObserverOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: [packages/query-core/src/types.ts:458](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L458)

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

### \_defaulted?

```ts
optional _defaulted: boolean;
```

Defined in: [packages/query-core/src/types.ts:268](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L268)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`_defaulted`](QueryObserverOptions.md#_defaulted)

***

### \_optimisticResults?

```ts
optional _optimisticResults: "optimistic" | "isRestoring";
```

Defined in: [packages/query-core/src/types.ts:435](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L435)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`_optimisticResults`](QueryObserverOptions.md#_optimisticresults)

***

### behavior?

```ts
optional behavior: QueryBehavior<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:259](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L259)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`behavior`](QueryObserverOptions.md#behavior)

***

### enabled?

```ts
optional enabled: Enabled<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:329](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L329)

Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys.
To refetch the query, use the `refetch` method returned from the `useQuery` instance.
Accepts a boolean or function that returns a boolean.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`enabled`](QueryObserverOptions.md#enabled)

***

### experimental\_prefetchInRender?

```ts
optional experimental_prefetchInRender: boolean;
```

Defined in: [packages/query-core/src/types.ts:440](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L440)

Enable prefetching during rendering

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`experimental_prefetchInRender`](QueryObserverOptions.md#experimental_prefetchinrender)

***

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:247](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L247)

The time in milliseconds that unused/inactive cache data remains in memory.
When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
When different garbage collection times are specified, the longest one will be used.
Setting it to `Infinity` will disable garbage collection.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`gcTime`](QueryObserverOptions.md#gctime)

***

### getNextPageParam

```ts
getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:297](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L297)

This function can be set to automatically get the next cursor for infinite queries.
The result will also be used to determine the value of `hasNextPage`.

#### Inherited from

[`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md).[`getNextPageParam`](InfiniteQueryPageParamsOptions.md#getnextpageparam)

***

### getPreviousPageParam?

```ts
optional getPreviousPageParam: GetPreviousPageParamFunction<TPageParam, TQueryFnData>;
```

Defined in: [packages/query-core/src/types.ts:292](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L292)

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

Defined in: [packages/query-core/src/types.ts:257](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L257)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`initialData`](QueryObserverOptions.md#initialdata)

***

### initialDataUpdatedAt?

```ts
optional initialDataUpdatedAt: number | () => number | undefined;
```

Defined in: [packages/query-core/src/types.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L258)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`initialDataUpdatedAt`](QueryObserverOptions.md#initialdataupdatedat)

***

### initialPageParam

```ts
initialPageParam: TPageParam;
```

Defined in: [packages/query-core/src/types.ts:281](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L281)

#### Inherited from

[`InfiniteQueryPageParamsOptions`](InfiniteQueryPageParamsOptions.md).[`initialPageParam`](InfiniteQueryPageParamsOptions.md#initialpageparam)

***

### maxPages?

```ts
optional maxPages: number;
```

Defined in: [packages/query-core/src/types.ts:277](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L277)

Maximum number of pages to store in the data of an infinite query.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`maxPages`](QueryObserverOptions.md#maxpages)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:273](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L273)

Additional payload to be stored on each query.
Use this property to pass information that can be used in other places.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`meta`](QueryObserverOptions.md#meta)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:240](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L240)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`networkMode`](QueryObserverOptions.md#networkmode)

***

### notifyOnChangeProps?

```ts
optional notifyOnChangeProps: NotifyOnChangeProps;
```

Defined in: [packages/query-core/src/types.ts:404](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L404)

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
optional persister: QueryPersister<NoInfer<TQueryFnData>, NoInfer<TQueryKey>, NoInfer<TPageParam>>;
```

Defined in: [packages/query-core/src/types.ts:249](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L249)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`persister`](QueryObserverOptions.md#persister)

***

### placeholderData?

```ts
optional placeholderData: 
  | InfiniteData<TQueryFnData, TPageParam>
| PlaceholderDataFunction<InfiniteData<TQueryFnData, TPageParam>, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:426](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L426)

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

Defined in: [packages/query-core/src/types.ts:248](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L248)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryFn`](QueryObserverOptions.md#queryfn)

***

### queryHash?

```ts
optional queryHash: string;
```

Defined in: [packages/query-core/src/types.ts:254](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L254)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryHash`](QueryObserverOptions.md#queryhash)

***

### queryKey

```ts
queryKey: TQueryKey & object;
```

Defined in: [packages/query-core/src/types.ts:255](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L255)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryKey`](QueryObserverOptions.md#querykey)

***

### queryKeyHashFn?

```ts
optional queryKeyHashFn: QueryKeyHashFunction<TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:256](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L256)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`queryKeyHashFn`](QueryObserverOptions.md#querykeyhashfn)

***

### refetchInterval?

```ts
optional refetchInterval: number | false | (query) => number | false | undefined;
```

Defined in: [packages/query-core/src/types.ts:342](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L342)

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

Defined in: [packages/query-core/src/types.ts:352](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L352)

If set to `true`, the query will continue to refetch while their tab/window is in the background.
Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchIntervalInBackground`](QueryObserverOptions.md#refetchintervalinbackground)

***

### refetchOnMount?

```ts
optional refetchOnMount: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:386](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L386)

If set to `true`, the query will refetch on mount if the data is stale.
If set to `false`, will disable additional instances of a query to trigger background refetch.
If set to `'always'`, the query will always refetch on mount.
If set to a function, the function will be executed with the latest data and query to compute the value
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchOnMount`](QueryObserverOptions.md#refetchonmount)

***

### refetchOnReconnect?

```ts
optional refetchOnReconnect: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:373](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L373)

If set to `true`, the query will refetch on reconnect if the data is stale.
If set to `false`, the query will not refetch on reconnect.
If set to `'always'`, the query will always refetch on reconnect.
If set to a function, the function will be executed with the latest data and query to compute the value.
Defaults to the value of `networkOnline` (`true`)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchOnReconnect`](QueryObserverOptions.md#refetchonreconnect)

***

### refetchOnWindowFocus?

```ts
optional refetchOnWindowFocus: boolean | "always" | (query) => boolean | "always";
```

Defined in: [packages/query-core/src/types.ts:360](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L360)

If set to `true`, the query will refetch on window focus if the data is stale.
If set to `false`, the query will not refetch on window focus.
If set to `'always'`, the query will always refetch on window focus.
If set to a function, the function will be executed with the latest data and query to compute the value.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`refetchOnWindowFocus`](QueryObserverOptions.md#refetchonwindowfocus)

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:238](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L238)

If `false`, failed queries will not retry by default.
If `true`, failed queries will retry infinitely., failureCount: num
If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`retry`](QueryObserverOptions.md#retry)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:239](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L239)

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`retryDelay`](QueryObserverOptions.md#retrydelay)

***

### retryOnMount?

```ts
optional retryOnMount: boolean;
```

Defined in: [packages/query-core/src/types.ts:396](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L396)

If set to `false`, the query will not be retried on mount if it contains an error.
Defaults to `true`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`retryOnMount`](QueryObserverOptions.md#retryonmount)

***

### select()?

```ts
optional select: (data) => TData;
```

Defined in: [packages/query-core/src/types.ts:416](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L416)

This option can be used to transform or select a part of the data returned by the query function.

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

Defined in: [packages/query-core/src/types.ts:336](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L336)

The time in milliseconds after data is considered stale.
If set to `Infinity`, the data will never be considered stale.
If set to a function, the function will be executed with the query to compute a `staleTime`.
Defaults to `0`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`staleTime`](QueryObserverOptions.md#staletime)

***

### structuralSharing?

```ts
optional structuralSharing: boolean | (oldData, newData) => unknown;
```

Defined in: [packages/query-core/src/types.ts:265](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L265)

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

Defined in: [packages/query-core/src/types.ts:422](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L422)

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

Defined in: [packages/query-core/src/types.ts:412](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L412)

Whether errors should be thrown instead of setting the `error` property.
If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
If set to `false` and `suspense` is `false`, errors are returned as state.
If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).
Defaults to `false`.

#### Inherited from

[`QueryObserverOptions`](QueryObserverOptions.md).[`throwOnError`](QueryObserverOptions.md#throwonerror)
