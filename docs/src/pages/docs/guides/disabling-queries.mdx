---
id: disabling-queries
title: Disabling/Pausing Queries
---

If you ever want to disable a query from automatically running, you can use the `enabled = false` option.

When `enabled` is `false`:

- If the query has cached data
  - The query will be initialized in the `status === 'success'` or `isSuccess === true` state.
- If the query does not have cached data
  - The query will start in the `status === 'idle'` or `isIdle === true` state.
- The query will not automatically fetch on mount.
- The query will not automatically refetch in the background due to rerenders or new instances appearing.

```js
function Todos() {
  const {
    isIdle,
    isLoading,
    isError,
    data,
    error,
    refetch,
    isFetching,
  } = useQuery('todos', fetchTodoList, {
    enabled: false,
  })

  return (
    <>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {isIdle ? (
        'Not ready...'
      ) : isLoading ? (
        <span>Loading...</span>
      ) : isError ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <ul>
            {data.map(todo => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>
          <div>{isFetching ? 'Fetching...' : null}</div>
        </>
      )}
    </>
  )
}
```
