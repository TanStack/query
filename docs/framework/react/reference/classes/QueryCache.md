---
id: QueryCache
title: QueryCache
redirect_from:
  - reference/QueryCache
  - framework/react/reference/QueryCache
---

Defined in: [packages/query-core/src/queryCache.ts:122](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L122)

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
new QueryCache(config?: QueryCacheConfig): QueryCache;
```

Defined in: [packages/query-core/src/queryCache.ts:125](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L125)

#### Parameters

##### config?

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

Defined in: [packages/query-core/src/queryCache.ts:125](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L125)

## Methods

### build()

```ts
build<TQueryFnData, TError, TData, TQueryKey>(
   client: QueryClient, 
   options: WithRequired<QueryOptions<TQueryFnData, TError, TData, TQueryKey, never>, "queryKey">, 
state?: QueryState<TData, TError>): Query<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryCache.ts:151](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L151)

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

The client the query belongs to, used to default its options.

##### options

[`WithRequired`](../type-aliases/WithRequired.md)\<[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>, `"queryKey"`\>

The query options, including the `queryKey`. A new query is created with the
options defaulted by [QueryClient#defaultQueryOptions](QueryClient.md#defaultqueryoptions).

##### state?

[`QueryState`](../interfaces/QueryState.md)\<`TData`, `TError`\>

The initial state of a newly created query, e.g. when hydrating. Ignored if the
query already exists.

#### Returns

[`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The existing or newly created query.

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

Defined in: [packages/query-core/src/queryCache.ts:235](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L235)

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
find<TQueryFnData, TError, TData>(filters: WithRequired<QueryFilters<readonly unknown[]>, "queryKey">): 
  | Query<TQueryFnData, TError, TData, readonly unknown[]>
  | undefined;
```

Defined in: [packages/query-core/src/queryCache.ts:304](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L304)

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

The filters to match, including the required `queryKey`. `exact` defaults to
`true`.

#### Returns

  \| [`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, readonly `unknown`[]\>
  \| `undefined`

The first matching query, or `undefined`.

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
findAll(filters?: QueryFilters<any>): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queryCache.ts:330](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L330)

An even more advanced method that can be used to get existing query instances from the cache
that partially match a query key. If no queries match, an empty array is returned.

This is not typically needed for most applications, but can come in handy when needing more
information about queries in rare scenarios.

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = `{}`

The filters to match. Without filters, every query is returned.

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

The matching queries.

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
get<TQueryFnData, TError, TData, TQueryKey>(queryHash: string): 
  | Query<TQueryFnData, TError, TData, TQueryKey>
  | undefined;
```

Defined in: [packages/query-core/src/queryCache.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L258)

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

The hash of the query to look up.

#### Returns

  \| [`Query`](Query.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>
  \| `undefined`

The query stored under the hash, or `undefined`.

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

Defined in: [packages/query-core/src/queryCache.ts:280](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L280)

Returns all queries within the cache.

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

Every query in the cache.

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

Defined in: [packages/query-core/src/subscribable.ts:43](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L43)

Returns `true` while at least one listener is registered, `false` once they have all unsubscribed.

#### Returns

`boolean`

`true` if at least one listener is registered.

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### remove()

```ts
remove(query: Query<any, any, any, any>): void;
```

Defined in: [packages/query-core/src/queryCache.ts:216](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L216)

Destroys the given `Query` and removes it from the cache, notifying subscribers with a
`'removed'` event. A no-op if the query is no longer the one currently stored under its hash
(e.g. it was already replaced). Used by plugins (e.g. the broadcast client) that mirror
removals across `QueryCache` instances.

#### Parameters

##### query

[`Query`](Query.md)\<`any`, `any`, `any`, `any`\>

The query to remove.

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
subscribe(listener: QueryCacheListener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L28)

Registers a listener to be called on every update this object notifies about. Returns a function
that removes the listener again — call it to stop listening. The base class never drops a listener
on its own, though some subclasses clear all of theirs in `destroy()`.

#### Parameters

##### listener

`QueryCacheListener`

Called on each update, with whatever the subclass passes to its subscribers.

#### Returns

A function that removes the listener.

() => `void`

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
