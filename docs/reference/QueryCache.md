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

const query = queryCache.find({ queryKey: ['posts'] })
```

Its available methods are:

- [`queryCache.find`](#querycache-find)
- [`queryCache.findAll`](#querycache-findall)
- [`queryCache.subscribe`](#querycache-subscribe)
- [`queryCache.clear`](#querycache-clear)
- [Further reading](#further-reading)

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
const query = queryCache.find({ queryKey })
```

**Options**

- `filters: QueryFilters`: [Query Filters](../framework/react/guides/filters#query-filters)
  - `queryKey: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)

**Returns**

- `Query`
  - The query instance from the cache

## `queryCache.findAll`

`findAll` is even more advanced synchronous method that can be used to get existing query instances from the cache that partially match query key. If queries do not exist, empty array will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios

```tsx
const queries = queryCache.findAll({ queryKey })
```

**Options**

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

The callback receives a discriminated union. Check `event.type` to narrow the event and access its additional properties:

| `event.type`             | When it is emitted                   | Properties                                |
| ------------------------ | ------------------------------------ | ----------------------------------------- |
| `added`                  | A query is added to the cache        | `query: Query`                            |
| `removed`                | A query is removed from the cache    | `query: Query`                            |
| `updated`                | A query's state changes              | `query: Query`, `action`                  |
| `observerAdded`          | An observer starts observing a query | `query: Query`, `observer: QueryObserver` |
| `observerRemoved`        | An observer stops observing a query  | `query: Query`, `observer: QueryObserver` |
| `observerResultsUpdated` | An observer's current result changes | `query: Query`                            |
| `observerOptionsUpdated` | An observer's options change         | `query: Query`, `observer: QueryObserver` |

When `event.type` is `updated`, `event.action.type` describes the state change:

| `event.action.type` | State change                                   | Additional properties                                                    |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `fetch`             | A fetch starts                                 | `meta?: FetchMeta`                                                       |
| `success`           | Data is written after a fetch or manual update | `data: TData \| undefined`, `dataUpdatedAt?: number`, `manual?: boolean` |
| `error`             | A fetch finishes with an error                 | `error: TError`                                                          |
| `failed`            | A fetch attempt fails and may be retried       | `failureCount: number`, `error: TError`                                  |
| `pause`             | A fetch is paused                              |                                                                          |
| `continue`          | A paused fetch resumes                         |                                                                          |
| `invalidate`        | The query is invalidated                       |                                                                          |
| `setState`          | The query state is updated directly            | `state: Partial<QueryState<TData, TError>>`                              |

For example, you can detect when a paused query resumes:

```tsx
const unsubscribe = queryCache.subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'continue') {
    console.log('Query resumed', event.query.queryKey)
  }
})
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

To get a better understanding how the QueryCache works internally, have a look at [the Inside React Query article by TkDodo](https://tkdodo.eu/blog/inside-react-query).

[//]: # 'Materials'
