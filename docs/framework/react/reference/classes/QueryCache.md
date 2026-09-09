---
id: QueryCache
title: QueryCache
redirect_from:
  - reference/QueryCache
  - framework/react/reference/QueryCache
---

Defined in: [packages/query-core/src/queryCache.ts:123](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L123)

The `QueryCache` is the storage mechanism for TanStack Query. It stores all the data, meta
information, and state of the queries it contains.

Normally, you will not interact with the `QueryCache` directly and instead use a `QueryClient`
for a specific cache. You can subscribe to it (inherited from `Subscribable`) to be informed of
safe/known updates to the cache, such as queries being added, removed, or updated — updates made
outside of the cache's own tracked mechanisms (e.g. mutating a query's state object directly) do
not notify subscribers.

## Example

```ts
const unsubscribe = queryCache.subscribe((event) => {
  console.log(event.type, event.query)
})
```

## Extends

- `Subscribable`\<`QueryCacheListener`\>

## Constructors

### Constructor

```ts
new QueryCache(config): QueryCache;
```

Defined in: [packages/query-core/src/queryCache.ts:126](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L126)

#### Parameters

##### config

[`QueryCacheConfig`](../interfaces/QueryCacheConfig.md) = `{}`

#### Returns

`QueryCache`

#### Overrides

```ts
Subscribable<QueryCacheListener>.constructor
```

## Properties

### config

```ts
config: QueryCacheConfig = {};
```

Defined in: [packages/query-core/src/queryCache.ts:126](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L126)

***

### listeners

```ts
protected listeners: Set<QueryCacheListener>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### build()

```ts
build<TQueryFnData, TError, TData, TQueryKey>(
   client, 
   options, 
state?): Query<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryCache.ts:147](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L147)

Returns the existing `Query` instance for the given options' `queryKey`/`queryHash`, or
builds and adds a new one to the cache if none exists yet. Used by framework adapters and
plugins (e.g. broadcast/persistence) that need to get-or-create a `Query` directly, bypassing
the reactive `QueryObserver` machinery.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`WithRequired`](../type-aliases/WithRequired.md)\<[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>, `"queryKey"`\>

##### state?

[`QueryState`](../interfaces/QueryState.md)\<`TData`, `TError`\>

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Example

```ts
const queryCache = queryClient.getQueryCache()

const query = queryCache.build(queryClient, {
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

***

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/queryCache.ts:232](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L232)

Removes all queries from the cache.

#### Returns

`void`

#### Example

```ts
const queryCache = queryClient.getQueryCache()

queryCache.clear()
```

***

### find()

```ts
find<TQueryFnData, TError, TData>(filters): 
  | Query<TQueryFnData, TError, TData, readonly unknown[]>
  | undefined;
```

Defined in: [packages/query-core/src/queryCache.ts:299](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L299)

A slightly more advanced method that can be used to get an existing query instance from the
cache. This instance not only contains all the state for the query, but all of the instances,
and underlying guts of the query as well. If the query does not exist, `undefined` is
returned.

This is not typically needed for most applications, but can come in handy when needing more
information about a query in rare scenarios (e.g. looking at `query.state.dataUpdatedAt` to
decide whether a query is fresh enough to be used as an initial value).

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### filters

[`WithRequired`](../type-aliases/WithRequired.md)\<[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>, `"queryKey"`\>

#### Returns

  \| [`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, readonly `unknown`[]\>
  \| `undefined`

#### See

[QueryCache#findAll](#findall)

#### Example

```ts
const queryCache = queryClient.getQueryCache()

const query = queryCache.find({ queryKey: ['posts'] })
```

***

### findAll()

```ts
findAll(filters): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queryCache.ts:324](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L324)

An even more advanced method that can be used to get existing query instances from the cache
that partially match a query key. If no queries match, an empty array is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about queries in rare scenarios.

#### Parameters

##### filters

[`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = `{}`

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

#### See

[QueryCache#find](#find)

#### Example

```ts
const queryCache = queryClient.getQueryCache()

const queries = queryCache.findAll({ queryKey: ['posts'] })
```

***

### get()

```ts
get<TQueryFnData, TError, TData, TQueryKey>(queryHash): 
  | Query<TQueryFnData, TError, TData, TQueryKey>
  | undefined;
```

Defined in: [packages/query-core/src/queryCache.ts:254](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L254)

Returns the `Query` instance stored under the given `queryHash`, or `undefined` if none
exists. Unlike [QueryCache#find](#find), this looks up by the already-computed hash rather
than by `QueryFilters`. Used by plugins (e.g. broadcast/hydration) that already have a hash
to look up directly.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### queryHash

`string`

#### Returns

  \| [`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>
  \| `undefined`

#### Example

```ts
const queryCache = queryClient.getQueryCache()
const queryHash = hashKey(['posts'])

const query = queryCache.get(queryHash)
```

***

### getAll()

```ts
getAll(): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queryCache.ts:277](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L277)

Returns all queries within the cache.

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

#### Example

```ts
const queryCache = queryClient.getQueryCache()

const queries = queryCache.getAll()
```

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

Defined in: [packages/query-core/src/subscribable.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L23)

#### Returns

`void`

#### Inherited from

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/subscribable.ts:27](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L27)

#### Returns

`void`

#### Inherited from

```ts
Subscribable.onUnsubscribe
```

***

### remove()

```ts
remove(query): void;
```

Defined in: [packages/query-core/src/queryCache.ts:208](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L208)

Destroys the given `Query` and removes it from the cache, notifying subscribers with a
`'removed'` event. A no-op if the query is no longer the one currently stored under its hash
(e.g. it was already replaced). Used by plugins (e.g. the broadcast client) that mirror
removals across `QueryCache` instances.

#### Parameters

##### query

[`Query`](Query.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

#### Example

```ts
const queryCache = queryClient.getQueryCache()
const query = queryCache.find({ queryKey: ['posts'] })

if (query) {
  queryCache.remove(query)
}
```

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`QueryCacheListener`

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
