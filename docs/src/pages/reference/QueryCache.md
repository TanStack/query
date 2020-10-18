---
id: QueryCache
title: QueryCache
---

The `QueryCache` is the storage mechanism for React Query. It stores all of the data, meta information and state of queries it contains.

**Normally, you will not interact with the QueryCache directly and instead use the `Environment`.**

```js
import { QueryCache } from 'react-query'

const queryCache = new QueryCache()
```

Its available methods are:

- [`getAll`](#querycachegetall)
- [`subscribe`](#querycachesubscribe)
- [`clear`](#querycacheclear)

## `queryCache.getAll`

Returns all queries in the cache.

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
  - This function will be called with the query cache any time it is updated via its tracked update mechanisms (eg, `query.setState`, `environment.removeQueries`, etc). Out of scope mutations to the cache are not encouraged and will not fire subscription callbacks
  - Additionally, for updates to the cache triggered by a specific query, the `query` will be passed as first argument to the callback

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the query cache.

## `queryCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```js
queryCache.clear()
```
