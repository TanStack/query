---
id: QueryObserver
title: QueryObserver
---

Defined in: [packages/query-core/src/queryObserver.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L57)

A `QueryObserver` watches a single query in the `QueryCache` and computes a
`QueryObserverResult` from its state, recomputing and notifying subscribers
whenever the underlying query (or the observer's options) changes. It is
the primitive that framework adapters (e.g. `useQuery`) build their hooks
on top of, but it can also be used directly to observe and switch between
queries outside of any framework.

## Example

```ts
const observer = new QueryObserver(queryClient, {
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

const unsubscribe = observer.subscribe((result) => {
  console.log(result.data)
})
```

## Extends

- `Subscribable`\<`QueryObserverListener`\<`TData`, `TError`\>\>

## Extended by

- [`InfiniteQueryObserver`](InfiniteQueryObserver.md)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Constructors

### Constructor

```ts
new QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>(client, options): QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:87](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L87)

#### Parameters

##### client

`QueryClient`

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`QueryObserver`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Overrides

```ts
Subscribable<QueryObserverListener<TData, TError>>.constructor
```

## Properties

### listeners

```ts
protected listeners: Set<QueryObserverListener<TData, TError>>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

***

### options

```ts
options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:89](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L89)

## Methods

### bindMethods()

```ts
protected bindMethods(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:106](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L106)

#### Returns

`void`

***

### createResult()

```ts
protected createResult(query, options): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:559](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L559)

#### Parameters

##### query

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TQueryData`, `TQueryKey`\>

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:161](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L161)

Stops observing the current query: clears all listeners, cancels the
stale and refetch-interval timers, and removes this observer from the
query it was observing.

#### Returns

`void`

***

### fetch()

```ts
protected fetch(fetchOptions): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:448](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L448)

#### Parameters

##### fetchOptions

`ObserverFetchOptions`

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

***

### fetchOptimistic()

```ts
fetchOptimistic(options): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:395](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L395)

Fetches a query defined by the given options without affecting this
observer's own tracked query or result, and returns a promise that
resolves with the `QueryObserverResult` for that fetch. This is useful
for prefetching data that another observer (e.g. a query about to be
navigated to) will need, ahead of time.

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

#### Example

```ts
const result = await observer.fetchOptimistic({
  queryKey: ['posts', 2],
  queryFn: () => fetchPost(2),
})
console.log(result.data)
```

***

### getCurrentQuery()

```ts
getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryObserver.ts:357](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L357)

Returns the `Query` instance this observer is currently observing.

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TQueryData`, `TQueryKey`\>

***

### getCurrentResult()

```ts
getCurrentResult(): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:321](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L321)

Returns the most recently computed `QueryObserverResult` for the
observed query. This is a point-in-time read; to be notified of updates
as they happen, subscribe to the observer instead (its inherited
`subscribe` method).

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

#### Example

```ts
const result = observer.getCurrentResult()
console.log(result.status, result.data)
```

***

### getOptimisticResult()

```ts
getOptimisticResult(options): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:272](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L272)

Computes the result the observer would produce for the given (already-defaulted) options
right now, building the underlying `Query` if it doesn't exist yet, without waiting for a
subscription callback. Called by framework adapters on every render (e.g. `useQuery`) so the
returned value is available synchronously, ahead of `setOptions` triggering an actual fetch.

#### Parameters

##### options

[`DefaultedQueryObserverOptions`](../type-aliases/DefaultedQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L19)

#### Returns

`boolean`

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:110](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L110)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:124](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L124)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### refetch()

```ts
refetch(__namedParameters): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: [packages/query-core/src/queryObserver.ts:371](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L371)

Refetches the observed query and returns a promise that resolves with
the resulting `QueryObserverResult`.

#### Parameters

##### \_\_namedParameters

[`RefetchOptions`](../interfaces/RefetchOptions.md) = `{}`

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

#### Example

```ts
const result = await observer.refetch({ cancelRefetch: false })
console.log(result.data)
```

***

### setOptions()

```ts
setOptions(options): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:182](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L182)

Updates the observer's options. This will re-resolve the query being
observed (switching to a different query if the `queryKey` changed),
trigger a fetch if the new options require one and the observer has
subscribers, recompute the current result, and reschedule the stale and
refetch-interval timers as needed.

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

`void`

#### Example

```ts
observer.setOptions({ queryKey: ['posts', 1], queryFn: () => fetchPost(1) })
// later: switch to a different query, reusing the same observer
observer.setOptions({ queryKey: ['posts', 2], queryFn: () => fetchPost(2) })
```

***

### shouldFetchOnReconnect()

```ts
shouldFetchOnReconnect(): boolean;
```

Defined in: [packages/query-core/src/queryObserver.ts:135](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L135)

Returns whether the observed query is currently stale and configured
(via the `refetchOnReconnect` option) to refetch when the network
reconnects.

#### Returns

`boolean`

***

### shouldFetchOnWindowFocus()

```ts
shouldFetchOnWindowFocus(): boolean;
```

Defined in: [packages/query-core/src/queryObserver.ts:148](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L148)

Returns whether the observed query is currently stale and configured
(via the `refetchOnWindowFocus` option) to refetch when the window
regains focus.

#### Returns

`boolean`

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`QueryObserverListener`

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Inherited from

```ts
Subscribable.subscribe
```

***

### trackProp()

```ts
trackProp(key): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:350](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L350)

Records that the given `QueryObserverResult` property was read, so a subsequent update only
notifies this observer if a tracked property actually changed. Normally called indirectly via
[QueryObserver#trackResult](#trackresult)'s proxy; exposed directly for adapters that track property
access themselves (e.g. through their own reactivity system) instead of via the proxy.

#### Parameters

##### key

`"error"` | `"data"` | `"isError"` | `"isPending"` | `"isLoading"` | `"isLoadingError"` | `"isRefetchError"` | `"isSuccess"` | `"isPlaceholderData"` | `"status"` | `"dataUpdatedAt"` | `"errorUpdatedAt"` | `"failureCount"` | `"failureReason"` | `"errorUpdateCount"` | `"isFetched"` | `"isFetchedAfterMount"` | `"isFetching"` | `"isInitialLoading"` | `"isPaused"` | `"isRefetching"` | `"isStale"` | `"isEnabled"` | `"refetch"` | `"fetchStatus"`

#### Returns

`void`

***

### trackResult()

```ts
trackResult(result, onPropTracked?): QueryObserverResult<TData, TError>;
```

Defined in: [packages/query-core/src/queryObserver.ts:331](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L331)

Wraps a `QueryObserverResult` in a `Proxy` that records which properties are read, via
[QueryObserver#trackProp](#trackprop) (and an optional `onPropTracked` callback). Used by framework
adapters when `notifyOnChangeProps` is not set, to implement its default "only re-render on
properties you actually read" behavior.

#### Parameters

##### result

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

##### onPropTracked?

(`key`) => `void`

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

***

### updateResult()

```ts
updateResult(): void;
```

Defined in: [packages/query-core/src/queryObserver.ts:735](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts#L735)

Recomputes and stores the current result from the current query/options, notifying listeners
if it changed. Framework adapters call this right after subscribing to make sure no query
update was missed in the gap between creating the observer and subscribing to it.

#### Returns

`void`
