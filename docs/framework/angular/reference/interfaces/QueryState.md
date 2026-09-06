---
id: QueryState
title: QueryState
---

Defined in: packages/query-core/dist-ts/src/query.d.ts:17

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

Defined in: packages/query-core/dist-ts/src/query.d.ts:21

The last successfully resolved data for the query.

***

### dataUpdateCount

```ts
dataUpdateCount: number;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:25

The number of times the query has successfully resolved.

***

### dataUpdatedAt

```ts
dataUpdatedAt: number;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:29

The timestamp for when the query most recently returned the `status` as `"success"`.

***

### error

```ts
error: TError | null;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:34

The error object for the query, if the last attempt resulted in an error.
- Defaults to `null`.

***

### errorUpdateCount

```ts
errorUpdateCount: number;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:38

The sum of all errors, incremented every time the query resolves with an error.

***

### errorUpdatedAt

```ts
errorUpdatedAt: number;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:42

The timestamp for when the query most recently returned the `status` as `"error"`.

***

### fetchFailureCount

```ts
fetchFailureCount: number;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:48

The failure count for the current fetch.
- Incremented every time the fetch fails.
- Reset to `0` when the fetch succeeds.

***

### fetchFailureReason

```ts
fetchFailureReason: TError | null;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:53

The reason the current fetch failed, as reported by the retryer.
- Reset to `null` when the fetch succeeds.

***

### fetchMeta

```ts
fetchMeta: FetchMeta | null;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:58

Metadata passed to the currently in-flight (or most recent) fetch, e.g. the
`fetchMore` direction for infinite queries.

***

### fetchStatus

```ts
fetchStatus: FetchStatus;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:77

The fetch status of the query.
- `fetching`: the `queryFn` is currently executing.
- `paused`: a fetch wanted to run but has been paused (see network mode).
- `idle`: the query is not fetching.

***

### isInvalidated

```ts
isInvalidated: boolean;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:63

Whether the query has been marked as invalidated via `invalidate()`.
- Reset to `false` whenever the query resolves successfully.

***

### status

```ts
status: QueryStatus;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:70

The status of the query.
- `pending` if there's no cached data and no attempt was finished yet.
- `error` if the last attempt resulted in an error.
- `success` if the query has data.
