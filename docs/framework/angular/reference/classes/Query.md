---
id: Query
title: Query
---

Defined in: packages/query-core/dist-ts/src/query.d.ts:154

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
new Query<TQueryFnData, TError, TData, TQueryKey>(config): Query<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:161

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

Defined in: packages/query-core/dist-ts/src/removable.d.ts:3

#### Inherited from

```ts
Removable.gcTime
```

***

### observers

```ts
observers: QueryObserver<any, any, any, any, any>[];
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:160

***

### options

```ts
options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:158

***

### queryHash

```ts
queryHash: string;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:157

***

### queryKey

```ts
queryKey: TQueryKey;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:156

***

### state

```ts
state: QueryState<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:159

## Accessors

### meta

#### Get Signature

```ts
get meta(): Record<string, unknown> | undefined;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:165

The `meta` object passed in the query's options, if any.

##### Returns

`Record`\<`string`, `unknown`\> \| `undefined`

***

### promise

#### Get Signature

```ts
get promise(): Promise<TData> | undefined;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:172

The promise for the currently in-flight fetch, if the query is fetching.
`undefined` when the query is not fetching.

##### Returns

`Promise`\<`TData`\> \| `undefined`

## Methods

### cancel()

```ts
cancel(options?): Promise<void>;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:196

Cancels the query's currently in-flight fetch, if any.
- Returns a promise that resolves once the cancellation has settled.
- If no fetch is in progress, resolves immediately.

#### Parameters

##### options?

[`CancelOptions`](../interfaces/CancelOptions.md)

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await query.cancel()
```

***

### clearGcTimeout()

```ts
protected clearGcTimeout(): void;
```

Defined in: packages/query-core/dist-ts/src/removable.d.ts:7

#### Returns

`void`

#### Inherited from

```ts
Removable.clearGcTimeout
```

***

### destroy()

```ts
destroy(): void;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:204

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
fetch(options?, fetchOptions?): Promise<TData>;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:309

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

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>

##### fetchOptions?

`FetchOptions`\<`TQueryFnData`\>

#### Returns

`Promise`\<`TData`\>

***

### getObserversCount()

```ts
getObserversCount(): number;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:287

Returns the number of observers currently subscribed to this query.

#### Returns

`number`

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

Defined in: packages/query-core/dist-ts/src/query.d.ts:298

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

Defined in: packages/query-core/dist-ts/src/query.d.ts:217

Returns `true` if the query has at least one observer for which `enabled`
does not resolve to `false`.

#### Returns

`boolean`

***

### isDisabled()

```ts
isDisabled(): boolean;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:226

Returns `true` if the query is disabled, meaning it will not fetch
automatically.
- If the query has observers, it is disabled when none of them are active
  (see `isActive`).
- If the query has no observers, it is disabled when its `queryFn` is
  `skipToken` or it has never been fetched.

#### Returns

`boolean`

***

### isFetched()

```ts
isFetched(): boolean;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:231

Returns `true` if the query has been fetched, i.e. it has resolved with
either data or an error at least once.

#### Returns

`boolean`

***

### isStale()

```ts
isStale(): boolean;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:253

Returns `true` if the query is stale.
- If the query has observers, defers to whether any observer's current
  result reports `isStale` (which accounts for each observer's own
  `staleTime` and `enabled` state).
- If the query has no observers, it is considered stale when it has no
  data or has been invalidated.

#### Returns

`boolean`

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
isStaleByTime(staleTime?): boolean;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:268

Returns `true` if the query's data is stale relative to the given
`staleTime` (defaults to `0`).
- A query with no data is always stale.
- `staleTime: 'static'` is never stale.
- An invalidated query is always stale.
- Otherwise, staleness is based on elapsed time since `dataUpdatedAt`.

#### Parameters

##### staleTime?

[`StaleTime`](../type-aliases/StaleTime.md)

#### Returns

`boolean`

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

Defined in: packages/query-core/dist-ts/src/query.d.ts:236

Returns `true` if the query has at least one observer configured with
`staleTime: 'static'`, meaning it is treated as never stale.

#### Returns

`boolean`

***

### optionalRemove()

```ts
protected optionalRemove(): void;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:175

#### Returns

`void`

#### Overrides

```ts
Removable.optionalRemove
```

***

### reset()

```ts
reset(): void;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:212

Resets the query back to its initial state (the state it had when it was
first created, e.g. any `initialData`), destroying it first to cancel any
in-flight fetch.

#### Returns

`void`

***

### scheduleGc()

```ts
protected scheduleGc(): void;
```

Defined in: packages/query-core/dist-ts/src/removable.d.ts:5

#### Returns

`void`

#### Inherited from

```ts
Removable.scheduleGc
```

***

### setState()

```ts
setState(state): void;
```

Defined in: packages/query-core/dist-ts/src/query.d.ts:185

Merges the given partial state directly into this query's state, notifying observers. Used
by persistence and broadcast plugins to restore a state snapshot, and by devtools to let a
user manually trigger a loading/error state or edit the cached data.

#### Parameters

##### state

`Partial`\<[`QueryState`](../interfaces/QueryState.md)\<`TData`, `TError`\>\>

#### Returns

`void`

***

### updateGcTime()

```ts
protected updateGcTime(newGcTime): void;
```

Defined in: packages/query-core/dist-ts/src/removable.d.ts:6

#### Parameters

##### newGcTime

`number` | `undefined`

#### Returns

`void`

#### Inherited from

```ts
Removable.updateGcTime
```
