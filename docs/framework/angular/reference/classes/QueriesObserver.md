---
id: QueriesObserver
title: QueriesObserver
---

Defined in: [packages/query-core/src/queriesObserver.ts:56](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L56)

A `QueriesObserver` watches an array of queries at once, exposing them as
a single array of `QueryObserverResult`s (or, when a `combine` option is
given, as a combined value derived from that array). It manages one
internal `QueryObserver` per query, and is the primitive that framework
adapters (e.g. `useQueries`) build their hooks on top of.

## Example

```ts
const observer = new QueriesObserver(queryClient, [
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])

const unsubscribe = observer.subscribe((result) => {
  console.log(result)
})
```

## Extends

- `Subscribable`\<`QueriesObserverListener`\>

## Type Parameters

### TCombinedResult

`TCombinedResult` = [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]

## Constructors

### Constructor

```ts
new QueriesObserver<TCombinedResult>(
   client: QueryClient, 
   queries: QueryObserverOptions<any, any, any, any, any, never>[], 
options?: QueriesObserverOptions<TCombinedResult>): QueriesObserver<TCombinedResult>;
```

Defined in: [packages/query-core/src/queriesObserver.ts:70](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L70)

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### queries

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`any`, `any`, `any`, `any`, `any`, `never`\>[]

##### options?

[`QueriesObserverOptions`](../interfaces/QueriesObserverOptions.md)\<`TCombinedResult`\>

#### Returns

`QueriesObserver`\<`TCombinedResult`\>

#### Overrides

```ts
Subscribable<QueriesObserverListener>.constructor
```

## Properties

### listeners

```ts
protected listeners: Set<QueriesObserverListener>;
```

Defined in: [packages/query-core/src/subscribable.ts:7](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L7)

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:106](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L106)

Stops observing all queries: clears all listeners and destroys every
underlying `QueryObserver` this observer manages.

#### Returns

`void`

***

### getCurrentResult()

```ts
getCurrentResult(): QueryObserverResult[];
```

Defined in: [packages/query-core/src/queriesObserver.ts:210](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L210)

Returns the most recently computed array of `QueryObserverResult`s, one
per observed query, in the same order as the queries passed to the
constructor or `setQueries`.

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]

#### Example

```ts
const results = observer.getCurrentResult()
const data = results.map((result) => result.data)
```

***

### getObservers()

```ts
getObservers(): QueryObserver<unknown, Error, unknown, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queriesObserver.ts:227](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L227)

Returns the underlying `QueryObserver` instances this observer manages,
in the same order as the queries passed to the constructor or
`setQueries`.

#### Returns

[`QueryObserver`](QueryObserver.md)\<`unknown`, `Error`, `unknown`, `unknown`, readonly `unknown`[]\>[]

***

### getOptimisticResult()

```ts
getOptimisticResult(queries: QueryObserverOptions<unknown, Error, unknown, unknown, readonly unknown[], never>[], combine: CombineFn<TCombinedResult> | undefined): [QueryObserverResult[], (r?: QueryObserverResult[]) => TCombinedResult, () => QueryObserverResult[]];
```

Defined in: [packages/query-core/src/queriesObserver.ts:238](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L238)

The `QueriesObserver` counterpart of [QueryObserver#getOptimisticResult](QueryObserver.md#getoptimisticresult) — computes
the result for the given (already-defaulted) queries right now, synchronously. Called by
framework adapters (e.g. `useQueries`) ahead of subscribing, returning a tuple of the raw
per-query results, a function to compute the combined result from them, and a function to
wrap the results for property-access tracking.

#### Parameters

##### queries

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`unknown`, `Error`, `unknown`, `unknown`, readonly `unknown`[], `never`\>[]

##### combine

`CombineFn`\<`TCombinedResult`\> | `undefined`

#### Returns

\[[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[], (`r?`: [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]) => `TCombinedResult`, () => [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]\]

***

### getQueries()

```ts
getQueries(): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queriesObserver.ts:218](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L218)

Returns the underlying `Query` instances currently being observed, in
the same order as the queries passed to the constructor or `setQueries`.

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:42](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L42)

Whether anything is currently subscribed.

#### Returns

`boolean`

`true` while at least one listener is registered, `false` once they have all unsubscribed.

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:86](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L86)

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

Defined in: [packages/query-core/src/queriesObserver.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L96)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### setQueries()

```ts
setQueries(queries: QueryObserverOptions<unknown, Error, unknown, unknown, readonly unknown[], never>[], options?: QueriesObserverOptions<TCombinedResult>): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:127](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L127)

Replaces the set of queries being observed. Existing `QueryObserver`s
are reused for queries that match an already-observed query hash;
observers for queries that are no longer present are destroyed, and new
observers are created and subscribed to for newly added queries.

#### Parameters

##### queries

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`unknown`, `Error`, `unknown`, `unknown`, readonly `unknown`[], `never`\>[]

##### options?

[`QueriesObserverOptions`](../interfaces/QueriesObserverOptions.md)\<`TCombinedResult`\>

#### Returns

`void`

#### Example

```ts
observer.setQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 3], queryFn: fetchPost },
])
```

***

### subscribe()

```ts
subscribe(listener: QueriesObserverListener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:27](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L27)

Registers a listener to be called on every update this object notifies about.

#### Parameters

##### listener

`QueriesObserverListener`

Called on each update, with whatever the subclass passes to its subscribers.

#### Returns

A function that removes the listener again. Call it to stop listening; the base class never
drops a listener on its own, though some subclasses clear all of theirs in `destroy()`.

```ts
(): void;
```

##### Returns

`void`

#### Example

```ts
const unsubscribe = subscribable.subscribe(() => {
  // react to the update
})

unsubscribe()
```

#### Inherited from

```ts
Subscribable.subscribe
```
