---
id: caching
title: Caching
---

React Query caching is automatic out of the box. It uses a `stale-while-revalidate` in-memory caching strategy (popularized by [HTTP RFC 5861](https://tools.ietf.org/html/rfc5861)) and a very robust query deduping strategy to always ensure a query's data is always readily available, only cached when it's needed, even if that query is used multiple times across your application and updated in the background when possible.

At a glance:

- The cache is keyed on a deterministic hash of your query key.
- By default, query results become **stale** immediately after a successful fetch. This can be configured using the `staleTime` option at both the global and query-level.
- Stale queries are automatically refetched whenever their **query keys change (this includes variables used in query key tuples)**, when they are freshly mounted from not having any instances on the page, or when they are refetched via the query cache manually.
- Though a query result may be stale, query results are by default **always** _cached_ **when in use**.
- If and when a query is no longer being used, it becomes **inactive** and by default is cached in the background for **5 minutes**. This time can be configured using the `cacheTime` option at both the global and query-level.
- After a query is inactive for the `cacheTime` specified (defaults to 5 minutes), the query is deleted and garbage collected.

## A Detailed Caching Example

Let's assume we are using the default `cacheTime` of **5 minutes** and the default `staleTime` of `0`.

- A new instance of `useQuery('todos', fetchTodos)` mounts.
  - Since no other queries have been made with this query + variable combination, this query will show a hard loading state and make a network request to fetch the data.
  - It will then cache the data using `'todos'` and `fetchTodos` as the unique identifiers for that cache.
  - A stale state is scheduled using the `staleTime` option as a delay (defaults to `0`, or immediately).
- A second instance of `useQuery('todos', fetchTodos)` mounts elsewhere.
  - Because this exact data exist in the cache from the first instance of this query, that data is immediately returned from the cache.
- A background refetch is triggered for both queries (but only one request), since a new instance appeared on screen.
  - Both instances are updated with the new data if the fetch is successful
- Both instances of the `useQuery('todos', fetchTodos)` query are unmounted and no longer in use.
  - Since there are no more active instances to this query, a cache timeout is set using `cacheTime` to delete and garbage collect the query (defaults to **5 minutes**).
- Before the cache timeout has completed another instance of `useQuery('todos', fetchTodos)` mounts. The query immediately returns the available cached value while the `fetchTodos` function is being run in the background to populate the query with a fresh value.
- The final instance of `useQuery('todos', fetchTodos)` unmounts.
- No more instances of `useQuery('todos', fetchTodos)` appear within **5 minutes**.
  - This query and its data are deleted and garbage collected.
