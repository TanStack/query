---
id: QueryState
title: QueryState
---

Defined in: [packages/query-core/src/query.ts:52](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L52)

The raw state stored on a `Query` instance. This is the underlying state
that observer results (e.g. `QueryObserverResult`) are derived from.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

### data

```ts
data: TData | undefined;
```

Defined in: [packages/query-core/src/query.ts:56](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L56)

The last successfully resolved data for the query.

***

### dataUpdateCount

```ts
dataUpdateCount: number;
```

Defined in: [packages/query-core/src/query.ts:60](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L60)

The number of times the query has successfully resolved.

***

### dataUpdatedAt

```ts
dataUpdatedAt: number;
```

Defined in: [packages/query-core/src/query.ts:64](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L64)

The timestamp for when the query most recently returned the `status` as `"success"`.

***

### error

```ts
error: TError | null;
```

Defined in: [packages/query-core/src/query.ts:69](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L69)

The error object for the query, if the last attempt resulted in an error.
- Defaults to `null`.

***

### errorUpdateCount

```ts
errorUpdateCount: number;
```

Defined in: [packages/query-core/src/query.ts:73](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L73)

The sum of all errors, incremented every time the query resolves with an error.

***

### errorUpdatedAt

```ts
errorUpdatedAt: number;
```

Defined in: [packages/query-core/src/query.ts:77](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L77)

The timestamp for when the query most recently returned the `status` as `"error"`.

***

### fetchFailureCount

```ts
fetchFailureCount: number;
```

Defined in: [packages/query-core/src/query.ts:83](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L83)

The failure count for the current fetch.
- Incremented every time the fetch fails.
- Reset to `0` when the fetch succeeds.

***

### fetchFailureReason

```ts
fetchFailureReason: TError | null;
```

Defined in: [packages/query-core/src/query.ts:88](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L88)

The reason the current fetch failed, as reported by the retryer.
- Reset to `null` when the fetch succeeds.

***

### fetchMeta

```ts
fetchMeta: FetchMeta | null;
```

Defined in: [packages/query-core/src/query.ts:93](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L93)

Metadata passed to the currently in-flight (or most recent) fetch, e.g. the
`fetchMore` direction for infinite queries.

***

### fetchStatus

```ts
fetchStatus: FetchStatus;
```

Defined in: [packages/query-core/src/query.ts:112](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L112)

The fetch status of the query.
- `fetching`: the `queryFn` is currently executing.
- `paused`: a fetch wanted to run but has been paused (see network mode).
- `idle`: the query is not fetching.

***

### isInvalidated

```ts
isInvalidated: boolean;
```

Defined in: [packages/query-core/src/query.ts:98](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L98)

Whether the query has been marked as invalidated via `invalidate()`.
- Reset to `false` whenever the query resolves successfully.

***

### status

```ts
status: QueryStatus;
```

Defined in: [packages/query-core/src/query.ts:105](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L105)

The status of the query.
- `pending` if there's no cached data and no attempt was finished yet.
- `error` if the last attempt resulted in an error.
- `success` if the query has data.
