---
id: InfiniteQueryObserver
title: InfiniteQueryObserver
---

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:26

An `InfiniteQueryObserver` extends `QueryObserver` to observe and switch
between infinite queries. It augments the base `QueryObserverResult` with
infinite-query-specific fields and methods, such as `hasNextPage` and
`fetchNextPage`, and is the primitive that framework adapters (e.g.
`useInfiniteQuery`) build their hooks on top of.

## Example

```ts
const observer = new InfiniteQueryObserver(queryClient, {
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

const unsubscribe = observer.subscribe((result) => console.log(result))
```

## Extends

- [`QueryObserver`](QueryObserver.md)\<`TQueryFnData`, `TError`, `TData`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

### TPageParam

`TPageParam` = `unknown`

## Constructors

### Constructor

```ts
new InfiniteQueryObserver<TQueryFnData, TError, TData, TQueryKey, TPageParam>(client, options): InfiniteQueryObserver<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:30

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`InfiniteQueryObserver`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Overrides

[`QueryObserver`](QueryObserver.md).[`constructor`](QueryObserver.md#constructor)

## Properties

### fetch

```ts
protected fetch: ReplaceReturnType<(fetchOptions) => Promise<QueryObserverResult<TData, TError>>, Promise<InfiniteQueryObserverResult<TData, TError>>>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:29

#### Overrides

```ts
QueryObserver.fetch
```

***

### getCurrentResult

```ts
getCurrentResult: ReplaceReturnType<() => QueryObserverResult<TData, TError>, InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:28

Returns the most recently computed `QueryObserverResult` for the
observed query. This is a point-in-time read; to be notified of updates
as they happen, subscribe to the observer instead (its inherited
`subscribe` method).

#### Example

```ts
const result = observer.getCurrentResult()
console.log(result.status, result.data)
```

#### Overrides

```ts
QueryObserver.getCurrentResult
```

***

### listeners

```ts
protected listeners: Set<QueryObserverListener<TData, TError>>;
```

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:2

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`listeners`](QueryObserver.md#listeners)

***

### options

```ts
options: QueryObserverOptions<TQueryFnData, TError, TData, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:31

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`options`](QueryObserver.md#options)

***

### subscribe()

```ts
subscribe: (listener) => () => void;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:27

#### Parameters

##### listener

`InfiniteQueryObserverListener`

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Overrides

```ts
QueryObserver.subscribe
```

## Methods

### bindMethods()

```ts
protected bindMethods(): void;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:31

#### Returns

`void`

#### Overrides

[`QueryObserver`](QueryObserver.md).[`bindMethods`](QueryObserver.md#bindmethods)

***

### createResult()

```ts
protected createResult(query, options): InfiniteQueryObserverResult<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:84

#### Parameters

##### query

[`Query`](Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

##### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>

#### Overrides

[`QueryObserver`](QueryObserver.md).[`createResult`](QueryObserver.md#createresult)

***

### destroy()

```ts
destroy(): void;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:53

Stops observing the current query: clears all listeners, cancels the
stale and refetch-interval timers, and removes this observer from the
query it was observing.

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`destroy`](QueryObserver.md#destroy)

***

### fetchNextPage()

```ts
fetchNextPage(options?): Promise<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:64

Fetches the next page of the infinite query and returns a promise that
resolves with the resulting `InfiniteQueryObserverResult`. The page
param used for the fetch is determined by `getNextPageParam`, which
receives the current pages/page params and whose result also determines
`hasNextPage`.

#### Parameters

##### options?

[`FetchNextPageOptions`](../interfaces/FetchNextPageOptions.md)

#### Returns

`Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\>

#### Example

```ts
const { hasNextPage } = observer.getCurrentResult()

if (hasNextPage) {
  await observer.fetchNextPage()
}
```

#### See

[InfiniteQueryObserver#fetchPreviousPage](#fetchpreviouspage)

***

### fetchOptimistic()

```ts
fetchOptimistic(options): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:134

Fetches a query defined by the given options without affecting this
observer's own tracked query or result, and returns a promise that
resolves with the `QueryObserverResult` for that fetch. This is useful
for prefetching data that another observer (e.g. a query about to be
navigated to) will need, ahead of time.

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

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

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`fetchOptimistic`](QueryObserver.md#fetchoptimistic)

***

### fetchPreviousPage()

```ts
fetchPreviousPage(options?): Promise<InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:83

Fetches the previous page of the infinite query and returns a promise
that resolves with the resulting `InfiniteQueryObserverResult`. The page
param used for the fetch is determined by `getPreviousPageParam`, which
receives the current pages/page params and whose result also determines
`hasPreviousPage`.

#### Parameters

##### options?

[`FetchPreviousPageOptions`](../interfaces/FetchPreviousPageOptions.md)

#### Returns

`Promise`\<[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>\>

#### Example

```ts
const { hasPreviousPage } = observer.getCurrentResult()

if (hasPreviousPage) {
  await observer.fetchPreviousPage()
}
```

#### See

[InfiniteQueryObserver#fetchNextPage](#fetchnextpage)

***

### getCurrentQuery()

```ts
getCurrentQuery(): Query<TQueryFnData, TError, InfiniteData<TQueryFnData, TPageParam>, TQueryKey>;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:106

Returns the `Query` instance this observer is currently observing.

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `TPageParam`\>, `TQueryKey`\>

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`getCurrentQuery`](QueryObserver.md#getcurrentquery)

***

### getOptimisticResult()

```ts
getOptimisticResult(options): InfiniteQueryObserverResult<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:45

The infinite-query counterpart of [QueryObserver#getOptimisticResult](QueryObserver.md#getoptimisticresult), marking the
options as an infinite query before delegating to it. Called by framework adapters (e.g.
`useInfiniteQuery`) ahead of subscribing, to compute the current `InfiniteQueryObserverResult`
synchronously.

#### Parameters

##### options

[`DefaultedInfiniteQueryObserverOptions`](../type-aliases/DefaultedInfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

[`InfiniteQueryObserverResult`](../type-aliases/InfiniteQueryObserverResult.md)\<`TData`, `TError`\>

#### Overrides

[`QueryObserver`](QueryObserver.md).[`getOptimisticResult`](QueryObserver.md#getoptimisticresult)

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: packages/query-core/dist-ts/src/subscribable.d.ts:5

#### Returns

`boolean`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`hasListeners`](QueryObserver.md#haslisteners)

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:34

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`onSubscribe`](QueryObserver.md#onsubscribe)

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:35

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`onUnsubscribe`](QueryObserver.md#onunsubscribe)

***

### refetch()

```ts
refetch(__namedParameters?): Promise<QueryObserverResult<TData, TError>>;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:117

Refetches the observed query and returns a promise that resolves with
the resulting `QueryObserverResult`.

#### Parameters

##### \_\_namedParameters?

[`RefetchOptions`](../interfaces/RefetchOptions.md)

#### Returns

`Promise`\<[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>\>

#### Example

```ts
const result = await observer.refetch({ cancelRefetch: false })
console.log(result.data)
```

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`refetch`](QueryObserver.md#refetch)

***

### setOptions()

```ts
setOptions(options): void;
```

Defined in: packages/query-core/dist-ts/src/infiniteQueryObserver.d.ts:38

Updates the observer's options. Behaves the same as
`QueryObserver.setOptions`, additionally marking the options as
belonging to an infinite query before delegating to the base
implementation.

#### Parameters

##### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`void`

#### Overrides

[`QueryObserver`](QueryObserver.md).[`setOptions`](QueryObserver.md#setoptions)

***

### shouldFetchOnReconnect()

```ts
shouldFetchOnReconnect(): boolean;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:41

Returns whether the observed query is currently stale and configured
(via the `refetchOnReconnect` option) to refetch when the network
reconnects.

#### Returns

`boolean`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`shouldFetchOnReconnect`](QueryObserver.md#shouldfetchonreconnect)

***

### shouldFetchOnWindowFocus()

```ts
shouldFetchOnWindowFocus(): boolean;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:47

Returns whether the observed query is currently stale and configured
(via the `refetchOnWindowFocus` option) to refetch when the window
regains focus.

#### Returns

`boolean`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`shouldFetchOnWindowFocus`](QueryObserver.md#shouldfetchonwindowfocus)

***

### trackProp()

```ts
trackProp(key): void;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:102

Records that the given `QueryObserverResult` property was read, so a subsequent update only
notifies this observer if a tracked property actually changed. Normally called indirectly via
[QueryObserver#trackResult](QueryObserver.md#trackresult)'s proxy; exposed directly for adapters that track property
access themselves (e.g. through their own reactivity system) instead of via the proxy.

#### Parameters

##### key

`"status"` | `"error"` | `"isSuccess"` | `"isError"` | `"isPending"` | `"data"` | `"isLoading"` | `"isLoadingError"` | `"isRefetchError"` | `"isPlaceholderData"` | `"dataUpdatedAt"` | `"errorUpdatedAt"` | `"failureCount"` | `"failureReason"` | `"errorUpdateCount"` | `"isFetched"` | `"isFetchedAfterMount"` | `"isFetching"` | `"isInitialLoading"` | `"isPaused"` | `"isRefetching"` | `"isStale"` | `"isEnabled"` | `"refetch"` | `"fetchStatus"`

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`trackProp`](QueryObserver.md#trackprop)

***

### trackResult()

```ts
trackResult(result, onPropTracked?): QueryObserverResult<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:95

Wraps a `QueryObserverResult` in a `Proxy` that records which properties are read, via
[QueryObserver#trackProp](QueryObserver.md#trackprop) (and an optional `onPropTracked` callback). Used by framework
adapters when `notifyOnChangeProps` is not set, to implement its default "only re-render on
properties you actually read" behavior.

#### Parameters

##### result

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

##### onPropTracked?

(`key`) => `void`

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`TData`, `TError`\>

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`trackResult`](QueryObserver.md#trackresult)

***

### updateResult()

```ts
updateResult(): void;
```

Defined in: packages/query-core/dist-ts/src/queryObserver.d.ts:142

Recomputes and stores the current result from the current query/options, notifying listeners
if it changed. Framework adapters call this right after subscribing to make sure no query
update was missed in the gap between creating the observer and subscribing to it.

#### Returns

`void`

#### Inherited from

[`QueryObserver`](QueryObserver.md).[`updateResult`](QueryObserver.md#updateresult)
