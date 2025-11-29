---
id: QueryOptions
title: QueryOptions
---

# Interface: QueryOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: [packages/query-core/src/types.ts:225](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L225)

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

***

### behavior?

```ts
optional behavior: QueryBehavior<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:259](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L259)

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

***

### initialData?

```ts
optional initialData: 
  | TData
| InitialDataFunction<TData>;
```

Defined in: [packages/query-core/src/types.ts:257](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L257)

***

### initialDataUpdatedAt?

```ts
optional initialDataUpdatedAt: number | () => number | undefined;
```

Defined in: [packages/query-core/src/types.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L258)

***

### maxPages?

```ts
optional maxPages: number;
```

Defined in: [packages/query-core/src/types.ts:277](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L277)

Maximum number of pages to store in the data of an infinite query.

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:273](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L273)

Additional payload to be stored on each query.
Use this property to pass information that can be used in other places.

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:240](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L240)

***

### persister?

```ts
optional persister: QueryPersister<NoInfer<TQueryFnData>, NoInfer<TQueryKey>, NoInfer<TPageParam>>;
```

Defined in: [packages/query-core/src/types.ts:249](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L249)

***

### queryFn?

```ts
optional queryFn: 
  | QueryFunction<TQueryFnData, TQueryKey, TPageParam>
  | typeof skipToken;
```

Defined in: [packages/query-core/src/types.ts:248](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L248)

***

### queryHash?

```ts
optional queryHash: string;
```

Defined in: [packages/query-core/src/types.ts:254](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L254)

***

### queryKey?

```ts
optional queryKey: TQueryKey;
```

Defined in: [packages/query-core/src/types.ts:255](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L255)

***

### queryKeyHashFn?

```ts
optional queryKeyHashFn: QueryKeyHashFunction<TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:256](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L256)

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

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:239](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L239)

***

### structuralSharing?

```ts
optional structuralSharing: boolean | (oldData, newData) => unknown;
```

Defined in: [packages/query-core/src/types.ts:265](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L265)

Set this to `false` to disable structural sharing between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
Defaults to `true`.
