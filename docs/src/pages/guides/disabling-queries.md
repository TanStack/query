---
id: disabling-queries
title: Disabling/Pausing Queries
---

If you ever want to disable a query from automatically running, you can use the `enabled = false` option.

When `enabled` is `false`:

- If the query has cached data
  - The query will be initialized in the `status === 'success'` or `isSuccess` state.
- If the query does not have cached data
  - The query will start in the `status === 'idle'` or `isIdle` state.
- The query will not automatically fetch on mount.
- The query will not automatically refetch in the background when new instances mount or new instances appearing
- The query will ignore query client `invalidateQueries` and `refetchQueries` calls that would normally result in the query refetching.
- `refetch` can be used to manually trigger the query to fetch.

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
  
  let todos;
  
  if (isIdle) {
    todos = 'Not ready...'
  } else if (isLoading) {
    todos = 'Loading...'
  } else if (isError) {
    todos = <span>Error: {error.message}</span>
  } else {
    todos = (
      <>
        <ul>
          {data.map(todo => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
        <div>{isFetching ? 'Fetching...' : null}</div>
      </>
    )
  }

  return (
    <>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {todos}
    </>
  )
}
```
