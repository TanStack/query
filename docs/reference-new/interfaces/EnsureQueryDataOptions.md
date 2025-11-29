---
id: EnsureQueryDataOptions
title: EnsureQueryDataOptions
---

# Interface: EnsureQueryDataOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: [packages/query-core/src/types.ts:509](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L509)

## Extends

- [`FetchQueryOptions`](FetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

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

`TPageParam` = `never`

## Properties

### \_defaulted?

```ts
optional _defaulted: boolean;
```

Defined in: [packages/query-core/src/types.ts:268](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L268)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`_defaulted`](FetchQueryOptions.md#_defaulted)

***

### behavior?

```ts
optional behavior: QueryBehavior<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:259](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L259)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`behavior`](FetchQueryOptions.md#behavior)

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

[`FetchQueryOptions`](FetchQueryOptions.md).[`gcTime`](FetchQueryOptions.md#gctime)

***

### initialData?

```ts
optional initialData: 
  | TData
| InitialDataFunction<TData>;
```

Defined in: [packages/query-core/src/types.ts:257](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L257)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`initialData`](FetchQueryOptions.md#initialdata)

***

### initialDataUpdatedAt?

```ts
optional initialDataUpdatedAt: number | () => number | undefined;
```

Defined in: [packages/query-core/src/types.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L258)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`initialDataUpdatedAt`](FetchQueryOptions.md#initialdataupdatedat)

***

### initialPageParam?

```ts
optional initialPageParam: undefined;
```

Defined in: [packages/query-core/src/types.ts:501](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L501)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`initialPageParam`](FetchQueryOptions.md#initialpageparam)

***

### maxPages?

```ts
optional maxPages: number;
```

Defined in: [packages/query-core/src/types.ts:277](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L277)

Maximum number of pages to store in the data of an infinite query.

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`maxPages`](FetchQueryOptions.md#maxpages)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:273](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L273)

Additional payload to be stored on each query.
Use this property to pass information that can be used in other places.

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`meta`](FetchQueryOptions.md#meta)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:240](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L240)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`networkMode`](FetchQueryOptions.md#networkmode)

***

### persister?

```ts
optional persister: QueryPersister<NoInfer<TQueryFnData>, NoInfer<TQueryKey>, NoInfer<TPageParam>>;
```

Defined in: [packages/query-core/src/types.ts:249](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L249)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`persister`](FetchQueryOptions.md#persister)

***

### queryFn?

```ts
optional queryFn: 
  | typeof skipToken
| QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:248](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L248)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`queryFn`](FetchQueryOptions.md#queryfn)

***

### queryHash?

```ts
optional queryHash: string;
```

Defined in: [packages/query-core/src/types.ts:254](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L254)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`queryHash`](FetchQueryOptions.md#queryhash)

***

### queryKey

```ts
queryKey: TQueryKey & object;
```

Defined in: [packages/query-core/src/types.ts:255](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L255)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`queryKey`](FetchQueryOptions.md#querykey)

***

### queryKeyHashFn?

```ts
optional queryKeyHashFn: QueryKeyHashFunction<TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:256](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L256)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`queryKeyHashFn`](FetchQueryOptions.md#querykeyhashfn)

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

[`FetchQueryOptions`](FetchQueryOptions.md).[`retry`](FetchQueryOptions.md#retry)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:239](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L239)

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`retryDelay`](FetchQueryOptions.md#retrydelay)

***

### revalidateIfStale?

```ts
optional revalidateIfStale: boolean;
```

Defined in: [packages/query-core/src/types.ts:522](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L522)

***

### staleTime?

```ts
optional staleTime: StaleTimeFunction<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:506](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L506)

The time in milliseconds after data is considered stale.
If the data is fresh it will be returned from the cache.

#### Inherited from

[`FetchQueryOptions`](FetchQueryOptions.md).[`staleTime`](FetchQueryOptions.md#staletime)

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

[`FetchQueryOptions`](FetchQueryOptions.md).[`structuralSharing`](FetchQueryOptions.md#structuralsharing)
