---
id: initial-query-data
title: Initial Query Data
---

There are many ways to supply initial data for a query to the cache before you need it:

- Declaratively:
  - Provide `initialData` to a query to prepopulate its cache if empty
- Imperatively:
  - [Prefetch the data using `queryClient.prefetchQuery`](./prefetching)
  - [Manually place the data into the cache using `queryClient.setQueryData`](./prefetching)

## Using `initialData` to prepopulate a query

There may be times when you already have the initial data for a query available in your app and can simply provide it directly to your query. If and when this is the case, you can use the `config.initialData` option to set the initial data for a query and skip the initial loading state!

> IMPORTANT: `initialData` is persisted to the cache, so it is not recommended to provide placeholder, partial or incomplete data to this option and instead use `placeholderData`

```js
function Todos() {
  const result = useQuery('todos', () => fetch('/todos'), {
    initialData: initialTodos,
  })
}
```

### `staleTime` and `initialDataUpdatedAt`

By default, `initialData` is treated as totally fresh, as if it were just fetched. This also means that it will affect how it is interpreted by the `staleTime` option.

- If you configure your query observer with `initialData`, and no `staleTime` (the default `staleTime: 0`), the query will immediately refetch when it mounts:

  ```js
  function Todos() {
    // Will show initialTodos immediately, but also immediately refetch todos after mount
    const result = useQuery('todos', () => fetch('/todos'), {
      initialData: initialTodos,
    })
  }
  ```

- If you configure your query observer with `initialData` and a `staleTime` of `1000` ms, the data will be considered fresh for that same amount of time, as if it was just fetched from your query function.

  ```js
  function Todos() {
    // Show initialTodos immediately, but won't refetch until another interaction event is encountered after 1000 ms
    const result = useQuery('todos', () => fetch('/todos'), {
      initialData: initialTodos,
      staleTime: 1000,
    })
  }
  ```

- So what if your `initialData` isn't totally fresh? That leaves us with the last configuration that is actually the most accurate and uses an option called `initialDataUpdatedAt`. This option allows you to pass a numeric JS timestamp in milliseconds of when the initialData itself was last updated, e.g. what `Date.now()` provides. Take note that if you have a unix timestamp, you'll need to convert it to a JS timestamp by multiplying it by `1000`.
  ```js
  function Todos() {
    // Show initialTodos immeidately, but won't refetch until another interaction event is encountered after 1000 ms
    const result = useQuery('todos', () => fetch('/todos'), {
      initialData: initialTodos,
      staleTime: 60 * 1000 // 1 minute
      // This could be 10 seconds ago or 10 minutes ago
      initialDataUpdatedAt: initialTodosUpdatedTimestamp // eg. 1608412420052
    })
  }
  ```
  This option allows the staleTime to be used for it's original purpose, determining how fresh the data needs to be, while also allowing the data to be refetched on mount if the `initialData` is older than the `staleTime`. In the example above, our data needs to be fresh within 1 minute, and we can hint to the query when the initialData was last updated so the query can decide for itself whether the data needs to be refetched again or not.

> If you would rather treat your data as **prefetched data**, we recommend that you use the `prefetchQuery` or `fetchQuery` APIs to populate the cache beforehand, thus letting you configure your `staleTime` independently from your initialData

### Initial Data Function

If the process for accessing a query's initial data is intensive or just not something you want to perform on every render, you can pass a function as the `initialData` value. This function will be executed only once when the query is initialized, saving you precious memory and/or CPU:

```js
function Todos() {
  const result = useQuery('todos', () => fetch('/todos'), {
    initialData: () => {
      return getExpensiveTodos()
    },
  })
}
```

### Initial Data from Cache

In some circumstances, you may be able to provide the initial data for a query from the cached result of another. A good example of this would be searching the cached data from a todos list query for an individual todo item, then using that as the initial data for your individual todo query:

```js
function Todo({ todoId }) {
  const result = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Use a todo from the 'todos' query as the initial data for this todo query
      return queryClient.getQueryData('todos')?.find(d => d.id === todoId)
    },
  })
}
```

### Initial Data from the cache with `initialDataUpdatedAt`

Getting initial data from the cache means the source query you're using to look up the initial data from is likely old, but `initialData`. Instead of using an artificial `staleTime` to keep your query from refetching immediately, it's suggested that you pass the source query's `dataUpdatedAt` to `initialDataUpdatedAt`. This provides the query instance with all the information it needs to determine if and when the query needs to be refetched, regardless of initial data being provided.

```js
function Todo({ todoId }) {
  const result = useQuery(['todo', todoId], () => fetch(`/todos/${todoId}`), {
    initialData: () =>
      queryClient.getQueryData('todos')?.find(d => d.id === todoId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState('todos')?.dataUpdatedAt,
  })
}
```

### Conditional Initial Data from Cache

If the source query you're using to look up the initial data from is old, you may not want to use the cached data at all and just fetch from the server. To make this decision easier, you can use the `queryClient.getQueryState` method instead to get more information about the source query, including a `state.dataUpdatedAt` timestamp you can use to decide if the query is "fresh" enough for your needs:

```js
function Todo({ todoId }) {
  const result = useQuery(['todo', todoId], () => fetch(`/todos/${todoId}`), {
    initialData: () => {
      // Get the query state
      const state = queryClient.getQueryState('todos')

      // If the query exists and has data that is no older than 10 seconds...
      if (state && Date.now() - state.dataUpdatedAt <= 10 * 1000) {
        // return the individual todo
        return state.data.find(d => d.id === todoId)
      }

      // Otherwise, return undefined and let it fetch from a hard loading state!
    },
  })
}
```
