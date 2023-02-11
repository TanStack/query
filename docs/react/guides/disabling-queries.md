---
id: disabling-queries
title: Disabling/Pausing Queries
---

If you ever want to disable a query from automatically running, you can use the `enabled = false` option.

When `enabled` is `false`:

- If the query has cached data, then the query will be initialized in the `status === 'success'` or `isSuccess` state.
- If the query does not have cached data, then the query will start in the `status === 'loading'` and `fetchStatus === 'idle'` state.
- The query will not automatically fetch on mount.
- The query will not automatically refetch in the background.
- The query will ignore query client `invalidateQueries` and `refetchQueries` calls that would normally result in the query refetching.
- `refetch` returned from `useQuery` can be used to manually trigger the query to fetch.

[//]: # 'Example'

```tsx
function Todos() {
  const { isInitialLoading, isError, data, error, refetch, isFetching } =
    useQuery({
      queryKey: ['todos'],
      queryFn: fetchTodoList,
      enabled: false,
    })

  return (
    <div>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {data ? (
        <>
          <ul>
            {data.map((todo) => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>
        </>
      ) : isError ? (
        <span>Error: {error.message}</span>
      ) : isInitialLoading ? (
        <span>Loading...</span>
      ) : (
        <span>Not ready ...</span>
      )}

      <div>{isFetching ? 'Fetching...' : null}</div>
    </div>
  )
}
```

[//]: # 'Example'

Permanently disabling a query opts out of many great features that TanStack Query has to offer (like background refetches), and it's also not the idiomatic way. It takes you from the declarative approach (defining dependencies when your query should run) into an imperative mode (fetch whenever I click here). It is also not possible to pass parameters to `refetch`. Oftentimes, all you want is a lazy query that defers the initial fetch:

## Lazy Queries

The enabled option can not only be used to permanently disable a query, but also to enable / disable it at a later time. A good example would be a filter form where you only want to fire off the first request once the user has entered a filter value:

[//]: # 'Example2'

```tsx
function Todos() {
  const [filter, setFilter] = React.useState('')

  const { data } = useQuery({
      queryKey: ['todos', filter],
      queryFn: () => fetchTodos(filter),
      // ⬇️ disabled as long as the filter is empty
      enabled: !!filter
  })

  return (
      <div>
        // 🚀 applying the filter will enable and execute the query
        <FiltersForm onApply={setFilter} />
        {data && <TodosTable data={data}} />
      </div>
  )
}
```

[//]: # 'Example2'

### isInitialLoading

Lazy queries will be in `status: 'loading'` right from the start because `loading` means that there is no data yet. This is technically true, however, since we are not currently fetching any data (as the query is not _enabled_), it also means you likely cannot use this flag to show a loading spinner.

If you are using disabled or lazy queries, you can use the `isInitialLoading` flag instead. It's a derived flag that is computed from:

`isLoading && isFetching`

so it will only be true if the query is currently fetching for the first time.
