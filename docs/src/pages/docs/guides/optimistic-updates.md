---
id: optimistic-updates
title: Optimistic Updates
---

When you optimistically update your state before performing a mutation, there is a non-zero chance that the mutation will fail. In most cases, you can just trigger a refetch for your optimistic queries to revert them to their true server state. In some circumstances though, refetching may not work correctly and the mutation error could represent some type of server issue that won't make it possible to refetch. In this event, you can instead choose to rollback your update.

To do this, `useMutation`'s `onMutate` handler option allows you to return a value that will later be passed to both `onError` and `onSettled` handlers as the last argument. In most cases, it is most useful to pass a rollback function.

## Updating a list of todos when adding a new todo

```js
useMutation(updateTodo, {
  // When mutate is called:
  onMutate: newTodo => {
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    queryCache.cancelQueries('todos')

    // Snapshot the previous value
    const previousTodos = queryCache.getQueryData('todos')

    // Optimistically update to the new value
    queryCache.setQueryData('todos', old => [...old, newTodo])

    // Return the snapshotted value
    return () => queryCache.setQueryData('todos', previousTodos)
  },
  // If the mutation fails, use the value returned from onMutate to roll back
  onError: (err, newTodo, rollback) => rollback(),
  // Always refetch after error or success:
  onSettled: () => {
    queryCache.invalidateQueries('todos')
  },
})
```

## Updating a single todo

```js
useMutation(updateTodo, {
  // When mutate is called:
  onMutate: newTodo => {
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    queryCache.cancelQueries(['todos', newTodo.id])

    // Snapshot the previous value
    const previousTodo = queryCache.getQueryData(['todos', newTodo.id])

    // Optimistically update to the new value
    queryCache.setQueryData(['todos', newTodo.id], newTodo)

    // Return a rollback function
    return () => queryCache.setQueryData(['todos', newTodo.id], previousTodo)
  },
  // If the mutation fails, use the rollback function we returned above
  onError: (err, newTodo, rollback) => rollback(),
  // Always refetch after error or success:
  onSettled: newTodo => {
    queryCache.invalidateQueries(['todos', newTodo.id])
  },
})
```

You can also use the `onSettled` function in place of the separate `onError` and `onSuccess` handlers if you wish:

```js
useMutation(updateTodo, {
  // ...
  onSettled: (newTodo, error, variables, rollback) => {
    if (error) {
      rollback()
    }
  },
})
```
