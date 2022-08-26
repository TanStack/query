---
id: disabling-queries
title: Disabling/Pausing Queries
---

If you ever want to disable a query from automatically running, you can use the `enabled = false` option.

When `enabled` is `false`:

- If the query has cached data
  - The query will be initialized in the `status === 'success'` or `isSuccess` state.
- If the query does not have cached data
  - The query will start in the `status === 'loading'` and `fetchStatus === 'idle'`
- The query will not automatically fetch on mount.
- The query will not automatically refetch in the background
- The query will ignore query client `invalidateQueries` and `refetchQueries` calls that would normally result in the query refetching.
- `refetch` returned from `useQuery` can be used to manually trigger the query to fetch.

```tsx
function Todos() {
  const {
    isLoading,
    isError,
    data,
    error,
    refetch,
    isFetching
  } = useQuery(['todos'], fetchTodoList, {
    enabled: false,
  })

  return (
    <div>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {data ? (
        <>
          <ul>
            {data.map(todo => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>
        </>
      ) : (
        isError ? (
          <span>Error: {error.message}</span>
        ) : (
          (isLoading && !isFetching) ? (
           <span>Not ready ...</span>
         ) : (
           <span>Loading...</span>
         )
        )
      )}

      <div>{isFetching ? 'Fetching...' : null}</div>
    </div>
  )
}
```

Permanently disabling a query opts out of many great features that react-query has to offer (like background refetches), and it's also not the idiomatic way. It takes you from the declarative approach (defining dependencies when your query should run) into an imperative mode (fetch whenever I click here). It is also not possible to pass parameters to `refetch`. Oftentimes, all you want is a lazy query that defers the initial fetch:

## Lazy Queries

The enabled option can not only be used to permanently disable a query, but also to enable / disable it at a later time. A good example would be a filter form where you only want to fire off the first request once the user has entered a filter value:

```tsx
function Todos() {
  const [filter, setFilter] = React.useState('')

  const { data } = useQuery(
    ['todos', filter],
    () => fetchTodos(filter),
    {
      // ⬇️ disabled as long as the filter is empty
      enabled: !!filter
    }
  )

  return (
      <div>
        // 🚀 applying the filter will enable and execute the query
        <FiltersForm onApply={setFilter} />
        {data && <TodosTable data={data}} />
      </div>
  )
}
```
