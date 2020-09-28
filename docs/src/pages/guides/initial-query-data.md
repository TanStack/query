---
id: initial-query-data
title: Initial Query Data
---

## Initial Data

There may be times when you already have the initial data for a query synchronously available in your app. If and when this is the case, you can use the `config.initialData` option to set the initial data for a query and skip the initial loading state!

```js
function Todos() {
  const result = useQuery('todos', () => fetch('/todos'), {
    initialData: initialTodos,
  })
}
```

## Using Initial Data with `staleTime`

`initialData` is treated exactly the same as normal data, which means that is follows the same rules and expectations of `staleTime`.

- If you configure your query observer with a `staleTime` of `10000`, for example, the `initialData` you provide will be considered fresh for that same amount of time, just like your normal data.

```js
function Todos() {
  const result = useQuery('todos', () => fetch('/todos'), {
    initialData: initialTodos,
    staleTime: 10000,
  })
}
```

> If you would rather treat your data as **prefetched data**, we recommend that you use the `prefetchQuery` or `fetchQuery` APIs to populate the cache beforehand, thus letting you configure your `staleTime` independently from your initialData

## Initial Data Function

If the process for accessing a query's initial data is intensive or just not something you want to perform on every render, you can pass a function as the `initialData` value. This function will be executed only once when the query is initialized, saving you precious memory and CPU:

```js
function Todos() {
  const result = useQuery('todos', () => fetch('/todos'), {
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
  const result = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Use a todo from the 'todos' query as the initial data for this todo query
      return client.getQueryData('todos')?.find(d => d.id === todoId)
    },
  })
}
```

Most of the time, this pattern works well, but if the source query you're using to look up the initial data from is old, you may not want to use the data at all and just fetch from the server. To make this decision easier, you can use the `client.getQueryState` method instead to get more information about the source query, including a `state.updatedAt` timestamp you can use to decide if the query is "fresh" enough for your needs:

```js
function Todo({ todoId }) {
  const result = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Get the query state
      const state = client.getQueryState('todos')

      // If the query exists and has data that is no older than 10 seconds...
      if (state && Date.now() - state.updatedAt <= 10 * 1000) {
        // return the individual todo
        return state.data.find(d => d.id === todoId)
      }

      // Otherwise, return undefined and let it fetch!
    },
  })
}
```
