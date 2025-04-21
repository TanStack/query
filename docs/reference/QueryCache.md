---
id: QueryCache
title: QueryCache
---

The `QueryCache` is the storage mechanism for TanStack Query. It stores all the data, meta information and state of queries it contains.

**Normally, you will not interact with the QueryCache directly and instead use the `QueryClient` for a specific cache.**

```tsx
import { QueryCache } from '@tanstack/react-query'

const queryCache = new QueryCache({
  onError: (error) => {
    console.log(error)
  },
  onSuccess: (data) => {
    console.log(data)
  },
  onSettled: (data, error) => {
    console.log(data, error)
  },
})

const query = queryCache.find(['posts'])
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
- `onSuccess?: (data: unknown, query: Query) => void`
  - Optional
  - This function will be called if some query is successful.
- `onSettled?: (data: unknown | undefined, error: unknown | null, query: Query) => void`
  - Optional
  - This function will be called if some query is settled (either successful or errored).

## `queryCache.find`

`find` is a slightly more advanced synchronous method that can be used to get an existing query instance from the cache. This instance not only contains **all** the state for the query, but all of the instances, and underlying guts of the query as well. If the query does not exist, `undefined` will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios (eg. Looking at the query.state.dataUpdatedAt timestamp to decide whether a query is fresh enough to be used as an initial value)

```tsx
const query = queryCache.find(queryKey)
```

**Options**

- `filters?: QueryFilters`: [Query Filters](../../framework/react/guides/filters#query-filters)

**Returns**

- `Query`
  - The query instance from the cache

## `queryCache.findAll`

`findAll` is even more advanced synchronous method that can be used to get existing query instances from the cache that partially match query key. If queries do not exist, empty array will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios

```tsx
const queries = queryCache.findAll(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)
- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)

**Returns**

- `Query[]`
  - Query instances from the cache

## `queryCache.subscribe`

The `subscribe` method can be used to subscribe to the query cache as a whole and be informed of safe/known updates to the cache like query states changing or queries being updated, added or removed

```tsx
const callback = (event) => {
  console.log(event.type, event.query)
}

const unsubscribe = queryCache.subscribe(callback)
```

**Options**

- `callback: (event: QueryCacheNotifyEvent) => void`
  - This function will be called with the query cache any time it is updated via its tracked update mechanisms (eg, `query.setState`, `queryClient.removeQueries`, etc). Out of scope mutations to the cache are not encouraged and will not fire subscription callbacks

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the query cache.

## `queryCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```tsx
queryCache.clear()
```

[//]: # 'Materials'

## Further reading

To get a better understanding how the QueryCache works internally, have a look at [#18: Inside React Query
](../framework/react/community/tkdodos-blog.md#18-inside-react-query) from the Community Resources.

[//]: # 'Materials'
