---
id: QueryCache
title: QueryCache
---

The `QueryCache` is the storage mechanism for React Query. It stores all of the data, meta information and state of queries it contains.

**Normally, you will not interact with the QueryCache directly and instead use the `QueryClient` for a specific cache.**

```js
import { QueryCache } from 'react-query'

const queryCache = new QueryCache({
  onError: error => {
    console.log(error)
  },
})

const query = queryCache.find('posts')
```

Its available methods are:

- [`find`](#querycachefind)
- [`findAll`](#querycachefindall)
- [`subscribe`](#querycachesubscribe)
- [`clear`](#querycacheclear)

**Options**

- `onError?: (error: unknown, query: Query) => void`
  - Optional
  - This function will be called if some query encounters an error.

## `queryCache.find`

`find` is a slightly more advanced synchronous method that can be used to get an existing query instance from the cache. This instance not only contains **all** the state for the query, but all of the instances, and underlying guts of the query as well. If the query does not exist, `undefined` will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios (eg. Looking at the query.state.dataUpdatedAt timestamp to decide whether a query is fresh enough to be used as an initial value)

```js
const query = queryCache.find(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

- `Query`
  - The query instance from the cache

## `queryCache.findAll`

`findAll` is even more advanced synchronous method that can be used to get existing query instances from the cache that partially match query key. If queries do not exist, empty array will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios

```js
const queries = queryCache.findAll(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

- `Query[]`
  - Query instances from the cache

## `queryCache.subscribe`

The `subscribe` method can be used to subscribe to the query cache as a whole and be informed of safe/known updates to the cache like query states changing or queries being updated, added or removed

```js
const callback = query => {
  console.log(query)
}

const unsubscribe = queryCache.subscribe(callback)
```

**Options**

- `callback: (query?: Query) => void`
  - This function will be called with the query cache any time it is updated via its tracked update mechanisms (eg, `query.setState`, `queryClient.removeQueries`, etc). Out of scope mutations to the cache are not encouraged and will not fire subscription callbacks
  - Additionally, for updates to the cache triggered by a specific query, the `query` will be passed as first argument to the callback

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the query cache.

## `queryCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```js
queryCache.clear()
```
