---
id: Query
title: Query
---

Defined in: [packages/query-core/src/query.ts:224](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L224)

Represents a single cached query. A `Query` holds the query's key, options,
state (data/error/status), and the observers currently subscribed to it.

Instances are created and managed internally by `QueryCache`; application
code typically interacts with queries indirectly through `QueryClient` or
a framework hook like `useQuery`. Direct access to a `Query` instance is
possible via `queryCache.find()`/`findAll()` for inspecting cache state.

## Example

```ts
const queryCache = queryClient.getQueryCache()
const query = queryCache.find({ queryKey: ['posts'] })

if (query) {
  console.log(query.state.dataUpdatedAt)
}
```

## Extends

- `Removable`

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Constructors

### Constructor

```ts
new Query<TQueryFnData, TError, TData, TQueryKey>(config: QueryConfig<TQueryFnData, TError, TData, TQueryKey>): Query<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/query.ts:245](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L245)

#### Parameters

##### config

`QueryConfig`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Returns

`Query`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Overrides

```ts
Removable.constructor
```

## Properties

### gcTime

```ts
gcTime: number;
```

Defined in: [packages/query-core/src/removable.ts:11](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L11)

#### Inherited from

```ts
Removable.gcTime
```

***

### observers

```ts
observers: QueryObserver<any, any, any, any, any>[];
```

Defined in: [packages/query-core/src/query.ts:241](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L241)

***

### options

```ts
options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/query.ts:232](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L232)

***

### queryHash

```ts
queryHash: string;
```

Defined in: [packages/query-core/src/query.ts:231](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L231)

***

### queryKey

```ts
queryKey: TQueryKey;
```

Defined in: [packages/query-core/src/query.ts:230](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L230)

***

### state

```ts
state: QueryState<TData, TError>;
```

Defined in: [packages/query-core/src/query.ts:233](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L233)

## Accessors

### meta

#### Get Signature

```ts
get meta(): Record<string, unknown> | undefined;
```

Defined in: [packages/query-core/src/query.ts:264](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L264)

The `meta` object passed in the query's options, if any.

##### Returns

`Record`\<`string`, `unknown`\> \| `undefined`

The query's `meta`, or `undefined` if none was set.

***

### promise

#### Get Signature

```ts
get promise(): Promise<TData> | undefined;
```

Defined in: [packages/query-core/src/query.ts:281](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L281)

The promise for the currently in-flight fetch, if the query is fetching.
`undefined` when the query is not fetching.

##### Returns

`Promise`\<`TData`\> \| `undefined`

The promise of the in-flight fetch, or `undefined`.

## Methods

### cancel()

```ts
cancel(options?: CancelOptions): Promise<void>;
```

Defined in: [packages/query-core/src/query.ts:364](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L364)

Cancels the query's currently in-flight fetch, if any.
- Returns a promise that resolves once the cancellation has settled.
- If no fetch is in progress, resolves immediately.

#### Parameters

##### options?

[`CancelOptions`](../interfaces/CancelOptions.md)

Set `revert` to restore the state from before the fetch started, and `silent`
to suppress the cancellation error when a new fetch replaces the cancelled one.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the cancellation has settled.

#### Example

```ts
await query.cancel()
```

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/query.ts:376](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L376)

Clears the query's garbage collection timeout and silently cancels any
in-flight fetch. Called by `QueryCache` when the query is removed from
the cache.

#### Returns

`void`

#### See

[Query#cancel](#cancel)

#### Overrides

```ts
Removable.destroy
```

***

### fetch()

```ts
fetch(options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey, never>, fetchOptions?: FetchOptions<TQueryFnData>): Promise<TData>;
```

Defined in: [packages/query-core/src/query.ts:629](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L629)

Fetches the query, i.e. runs its `queryFn` (through any configured
retryer/behavior) and updates the query's state with the result.
- If a fetch is already in flight, returns its promise instead of
  starting a new one, unless `fetchOptions.cancelRefetch` is set and the
  query already has data, in which case the current fetch is silently
  cancelled first.
- If `options` is passed, it replaces the query's current options
  before fetching.

#### Parameters

##### options?

`QueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>

Query options that replace the query's current options before fetching. They
are not applied when an in-flight fetch is reused.

##### fetchOptions?

`FetchOptions`\<`TQueryFnData`\>

Set `cancelRefetch` to cancel an in-flight fetch first (only if the query
already has data), and `meta` to pass extra information to the query's behavior.

#### Returns

`Promise`\<`TData`\>

A promise that resolves with the fetched data, or rejects with the fetch error. If the
fetch is cancelled with `revert` while the query has data, it resolves with the restored data
instead.

***

### getObserversCount()

```ts
getObserversCount(): number;
```

Defined in: [packages/query-core/src/query.ts:593](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L593)

Returns the number of observers currently subscribed to this query.

#### Returns

`number`

The number of observers.

#### Example

```ts
if (query.getObserversCount() === 0) {
  // no component is currently watching this query
}
```

***

### invalidate()

```ts
invalidate(): void;
```

Defined in: [packages/query-core/src/query.ts:606](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L606)

Marks the query as invalidated, unless it is already invalidated. This
updates `state.isInvalidated` and notifies observers, but does not by
itself trigger a refetch.

#### Returns

`void`

#### Example

```ts
query.invalidate()
```

***

### isActive()

```ts
isActive(): boolean;
```

Defined in: [packages/query-core/src/query.ts:405](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L405)

Returns `true` if the query has at least one observer for which `enabled`
does not resolve to `false`.

#### Returns

`boolean`

`true` if the query has an enabled observer.

***

### isDisabled()

```ts
isDisabled(): boolean;
```

Defined in: [packages/query-core/src/query.ts:420](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L420)

Returns `true` if the query is disabled, meaning it will not fetch
automatically.
- If the query has observers, it is disabled when none of them are active
  (see `isActive`).
- If the query has no observers, it is disabled when its `queryFn` is
  `skipToken` or it has never been fetched.

#### Returns

`boolean`

`true` if the query is disabled.

***

### isFetched()

```ts
isFetched(): boolean;
```

Defined in: [packages/query-core/src/query.ts:433](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L433)

Returns `true` if the query has been fetched, i.e. it has resolved with
either data or an error at least once.

#### Returns

`boolean`

`true` if the query has been fetched.

***

### isStale()

```ts
isStale(): boolean;
```

Defined in: [packages/query-core/src/query.ts:469](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L469)

Returns `true` if the query is stale.
- If the query has observers, defers to whether any observer's current
  result reports `isStale` (which accounts for each observer's own
  `staleTime` and `enabled` state).
- If the query has no observers, it is considered stale when it has no
  data or has been invalidated.

#### Returns

`boolean`

`true` if the query is stale.

#### See

[Query#isStaleByTime](#isstalebytime)

#### Example

```ts
if (query.isStale()) {
  // refetch or otherwise treat the cached data as outdated
}
```

***

### isStaleByTime()

```ts
isStaleByTime(staleTime?: number | "static"): boolean;
```

Defined in: [packages/query-core/src/query.ts:497](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L497)

Returns `true` if the query's data is stale relative to the given
`staleTime` (defaults to `0`).
- A query with no data is always stale.
- `staleTime: 'static'` is never stale.
- An invalidated query is always stale.
- Otherwise, staleness is based on elapsed time since `dataUpdatedAt`.

#### Parameters

##### staleTime?

`number` \| `"static"`

The time, in milliseconds, after which data is considered stale, or
`'static'` to never treat existing data as stale. A query without data is stale either way.

#### Returns

`boolean`

`true` if the query's data is stale.

#### See

[Query#isStale](#isstale)

#### Example

```ts
const isStale = query.isStaleByTime(1000 * 60)
```

***

### isStatic()

```ts
isStatic(): boolean;
```

Defined in: [packages/query-core/src/query.ts:442](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L442)

Returns `true` if the query has at least one observer configured with
`staleTime: 'static'`, meaning it is treated as never stale.

#### Returns

`boolean`

`true` if the query is static.

***

### reset()

```ts
reset(): void;
```

Defined in: [packages/query-core/src/query.ts:395](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L395)

Resets the query back to its initial state (the state it had when it was
first created, e.g. any `initialData`), destroying it first to cancel any
in-flight fetch.

#### Returns

`void`

***

### setState()

```ts
setState(state: Partial<QueryState<TData, TError>>): void;
```

Defined in: [packages/query-core/src/query.ts:348](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L348)

Merges the given partial state directly into this query's state, notifying observers. Used
by persistence and broadcast plugins to restore a state snapshot, and by devtools to let a
user manually trigger a loading/error state or edit the cached data.

#### Parameters

##### state

`Partial`\<[`QueryState`](../interfaces/QueryState.md)\<`TData`, `TError`\>\>

The partial state to merge into the query's state.

#### Returns

`void`
