---
id: initial-query-data
title: Initial Query Data
---

## Initial Data

There may be times when you already have the initial data for a query synchronously available in your app. If and when this is the case, you can use the `config.initialData` option to set the initial data for a query and skip the first round of fetching!

When providing an `initialData` value that is anything other than `undefined`:

- The query `status` will initialize in a `success` state instead of `loading`
- The query's `isStale` property will initialize as `false` instead of `true`. This can be overridden by setting the `initialStale` option to `true`
- The query will not automatically fetch until it is invalidated somehow (eg. window refocus, queryCache refetching, `initialStale` is set to `true`, etc)

```js
function Todos() {
  const queryInfo = useQuery('todos', () => fetch('/todos'), {
    initialData: initialTodos,
  })
}
```

## Initial Data Function

If the process for accessing a query's initial data is intensive or just not something you want to perform on every render, you can pass a function as the `initialData` value. This function will be executed only once when the query is initialized, saving you precious memory and CPU:

```js
function Todos() {
  const queryInfo = useQuery('todos', () => fetch('/todos'), {
    initialData: () => {
      return getExpensiveTodos()
    },
  })
}
```

## Initial Data from Cache

In some circumstances, you may be able to provide the initial data for a query from the cached result of another. A good example of this would be searching the cached data from a todos list query for an individual todo item, then using that as the initial data for your individual todo query:

```js
function Todo({ todoId }) {
  const queryInfo = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Use a todo from the 'todos' query as the initial data for this todo query
      return queryCache.getQueryData('todos')?.find(d => d.id === todoId)
    },
  })
}
```

Most of the time, this pattern works well, but if the source query you're using to look up the initial data from is old, you may not want to use the data at all and just fetch from the server. To make this decision easier, you can use the `queryCache.getQuery` method instead to get more information about the source query, including a `query.state.updatedAt` timestamp you can use to decide if the query is "fresh" enough for your needs:

```js
function Todo({ todoId }) {
  const queryInfo = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Get the query object
      const query = queryCache.getQuery('todos')

      // If the query exists and has data that is no older than 10 seconds...
      if (query && Date.now() - query.state.updatedAt <= 10 * 1000) {
        // return the individual todo
        return query.state.data.find(d => d.id === todoId)
      }

      // Otherwise, return undefined and let it fetch!
    },
  })
}
```

## Marking Initial Data as stale

By default `initialData` is not considered stale, but sometimes you may want it to be, for instance, if your initial data is only a partial subset of an object and you know you will need to refetch the full version immediately after mounting. For this, you can use the `initialStale: true` options.

By setting `initialStale` to `true`, the `initialData` will be considered `stale` and will cause a refetch when the query mounts for the first time.

```js
function Todos() {
  const queryInfo = useQuery('todos', () => fetch('/todos'), {
    initialData: todoListPreview,
    initialStale: true,
  })
}
```

> NOTE: Similar to `initialData`, `initialStale` can also be a function for costly calculations.  
> eg. `initialStale: () => isPreview(todoListPreview)`
