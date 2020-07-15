---
id: updates-from-mutation-responses
title: Updates from Mutation Responses
---

When dealing with mutations that **update** objects on the server, it's common for the new object to be automatically returned in the response of the mutation. Instead of refetching any queries for that item and wasting a network call for data we already have, we can take advantage of the object returned by the mutation function and update the existing query with the new data immediately using the [Query Cache's `setQueryData`](#querycachesetquerydata) method:

```js
const [mutate] = useMutation(editTodo, {
  onSuccess: data => queryCache.setQueryData(['todo', { id: 5 }], data),
})

mutate({
  id: 5,
  name: 'Do the laundry',
})

// The query below will be updated with the response from the
// successful mutation
const { status, data, error } = useQuery(['todo', { id: 5 }], fetchTodoByID)
```

You might want to tie the `onSuccess` logic into a reusable mutation, for that you can
create a custom hook like this:

```js
const useMutateTodo = () => {
  return useMutate(editTodo, {
    // Notice the second argument is the variables object that the `mutate` function receives
    onSuccess: (data, variables) => {
      queryCache.setQueryData(['todo', { id: variables.id }], data)
    },
  })
}
```
