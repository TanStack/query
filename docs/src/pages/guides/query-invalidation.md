---
id: query-invalidation
title: Query Invalidation
---

Waiting for queries to become stale before they are fetched again doesn't always work, especially when you know for a fact that a query's data is out of date because of something the user has done. For that purpose, the `QueryClient` has an `invalidateQueries` method that lets you intelligently mark queries as stale and potentially refetch them too!

```js
// Invalidate every query in the cache
queryClient.invalidateQueries()
// Invalidate every query with a key that starts with `todos`
queryClient.invalidateQueries('todos')
```

> Note: Where other libraries that use normalized caches would attempt to update local queries with the new data either imperatively or via schema inference, React Query gives you the tools to avoid the manual labor that comes with maintaining normalized caches and instead prescribes **targeted invalidation, background-refetching and ultimately atomic updates**.

When a query is invalidated with `invalidateQueries`, two things happen:

- It is marked as stale. This stale state overrides any `staleTime` configurations being used in `useQuery` or related hooks
- If the query is currently being rendered via `useQuery` or related hooks, it will also be refetched in the background

## Query Matching with `invalidateQueries`

When using APIs like `invalidateQueries` and `removeQueries` (and others that support partial query matching), you can match multiple queries by their prefix, or get really specific and match an exact query. For information on the types of filters you can use, please see [Query Filters](./filters#query-filters).

In this example, we can use the `todos` prefix to invalidate any queries that start with `todos` in their query key:

```js
import { useQuery, useQueryClient } from 'react-query'

// Get QueryClient from the context
const queryClient = useQueryClient()

queryClient.invalidateQueries('todos')

// Both queries below will be invalidated
const todoListQuery = useQuery('todos', fetchTodoList)
const todoListQuery = useQuery(['todos', { page: 1 }], fetchTodoList)
```

You can even invalidate queries with specific variables by passing a more specific query key to the `invalidateQueries` method:

```js
queryClient.invalidateQueries(['todos', { type: 'done' }])

// The query below will be invalidated
const todoListQuery = useQuery(['todos', { type: 'done' }], fetchTodoList)

// However, the following query below will NOT be invalidated
const todoListQuery = useQuery('todos', fetchTodoList)
```

The `invalidateQueries` API is very flexible, so even if you want to **only** invalidate `todos` queries that don't have any more variables or subkeys, you can pass an `exact: true` option to the `invalidateQueries` method:

```js
queryClient.invalidateQueries('todos', { exact: true })

// The query below will be invalidated
const todoListQuery = useQuery(['todos'], fetchTodoList)

// However, the following query below will NOT be invalidated
const todoListQuery = useQuery(['todos', { type: 'done' }], fetchTodoList)
```

If you find yourself wanting **even more** granularity, you can pass a predicate function to the `invalidateQueries` method. This function will receive each `Query` instance from the query cache and allow you to return `true` or `false` for whether you want to invalidate that query:

```js
queryClient.invalidateQueries({
  predicate: query =>
    query.queryKey[0] === 'todos' && query.queryKey[1]?.version >= 10,
})

// The query below will be invalidated
const todoListQuery = useQuery(['todos', { version: 20 }], fetchTodoList)

// The query below will be invalidated
const todoListQuery = useQuery(['todos', { version: 10 }], fetchTodoList)

// However, the following query below will NOT be invalidated
const todoListQuery = useQuery(['todos', { version: 5 }], fetchTodoList)
```
