---
id: QueryOptions
title: QueryOptions
---

Defined in: [packages/query-core/src/types.ts:231](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L231)

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

***

### initialData?

```ts
optional initialData:
  | TData
| InitialDataFunction<TData>;
```

Defined in: [packages/query-core/src/types.ts:311](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L311)

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet).
If set to a function, the function will be called **once** during the shared/root query initialization, and be
expected to synchronously return the initial data.
Initial data is considered stale by default unless a `staleTime` has been set.
`initialData` **is persisted** to the cache.

***

### initialDataUpdatedAt?

```ts
optional initialDataUpdatedAt: number | () => number | undefined;
```

Defined in: [packages/query-core/src/types.ts:315](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L315)

If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated.

***

### maxPages?

```ts
optional maxPages: number;
```

Defined in: [packages/query-core/src/types.ts:338](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L338)

Maximum number of pages to store in the data of an infinite query.

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:334](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L334)

Additional payload to be stored on each query.
Use this property to pass information that can be used in other places.

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:260](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L260)

Defaults to `'online'`.

#### See

[Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

***

### persister?

```ts
optional persister: QueryPersister<TQueryFnData, NoInfer<TQueryKey>, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:284](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L284)

This option can be used to persist the result of a query to an external storage, bypassing the need to actually
call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries.

***

### queryFn?

```ts
optional queryFn:
  | QueryFunction<TQueryFnData, TQueryKey, TPageParam>
  | typeof skipToken;
```

Defined in: [packages/query-core/src/types.ts:279](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L279)

The function that the query will use to request data.
Required, unless a default query function has been set via `queryClient.setQueryDefaults` or
`queryClient.setDefaultOptions`.
Receives a [QueryFunctionContext](../type-aliases/QueryFunctionContext.md).
Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`.

***

### queryHash?

```ts
optional queryHash: string;
```

Defined in: [packages/query-core/src/types.ts:289](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L289)

The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used
as the actual cache key internally.

***

### queryKey?

```ts
optional queryKey: TQueryKey;
```

Defined in: [packages/query-core/src/types.ts:298](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L298)

The query key to use for this query.

The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
for more information.

The query will automatically update when this key changes (as long as `enabled` is not set to `false`).

***

### queryKeyHashFn?

```ts
optional queryKeyHashFn: QueryKeyHashFunction<TQueryKey>;
```

Defined in: [packages/query-core/src/types.ts:302](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L302)

If specified, this function is used to hash the `queryKey` to a string.

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

***

### structuralSharing?

```ts
optional structuralSharing: boolean | (oldData, newData) => unknown;
```

Defined in: [packages/query-core/src/types.ts:323](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L323)

Set this to `false` to disable structural sharing between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
Defaults to `true`.
