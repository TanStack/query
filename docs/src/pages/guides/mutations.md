---
id: mutations
title: Mutations
---

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects. For this purpose, React Query exports a `useMutation` hook.

Here's an example of a mutation that adds a new todo the server:

```js
function App() {
  const mutation = useMutation(newTodo => axios.post('/todods', newTodo))

  return (
    <div>
      {mutation.isLoading ? (
        'Adding todo...'
      ) : (
        <>
          {mutation.isError ? (
            <div>An error occurred: {mutation.error.message}</div>
          ) : null}

          {mutation.isError ? <div>Todo added!</div> : null}

          <button
            onClick={() => {
              mutation.mutate({ id: new Date(), title: 'Do Laundry' })
            }}
          >
            Create Todo
          </button>
        </>
      )}
    </div>
  )
}
```

A mutation can only be in one of the following states at any given moment:

- `isIdle` or `status === 'idle' - The mutation is currently idle or in a fresh/reset state
- `isLoading` or `status === 'loading' - The mutation is currently running
- `isError` or `status === 'error'` - The mutation encountered an error
- `isSuccess` or `status === 'success' - The mutation was successful and mutation data is available

Beyond those primary state, more information is available depending on the state the mutation:

- `error` - If the mutation is in an `isError` state, the error is available via the `error` property.
- `data` - If the mutation is in a `success` state, the data is available via the `data` property.

In the example above, you also saw that you can pass variables to your mutations function by calling the `mutate` function with a **single variable or object**.

Even with just variables, mutations aren't all that special, but when used with the `onSuccess` option, the [Query Client's `invalidateQueries` method](../reference/QueryClient#clientinvalidatequeries) and the [Query Client's `setQueryData` method](../reference/QueryClient#clientsetquerydata), mutations become a very powerful tool.

> IMPORTANT: The `mutate` function is an asynchronous function, which means you cannot use it directly in an event callback. If you need to access the event in `onSubmit` you need to wrap `mutate` in another function. This is due to [React event pooling](https://reactjs.org/docs/events.html#event-pooling).

```js
// This will not work
const CreateTodo = () => {
  const mutation = useMutation(event => {
    event.preventDefault()
    return fetch('/api', new FormData(event.target))
  })

  return <form onSubmit={mutation.mutate}>...</form>
}

// This will work
const CreateTodo = () => {
  const mutation = useMutation(formData => {
    return fetch('/api', formData)
  })
  const onSubmit = event => {
    event.preventDefault()
    mutation.mutate(new FormData(event.target))
  }

  return <form onSubmit={onSubmit}>...</form>
}
```

## Resetting Mutation State

It's sometimes the case that you need to clear the `error` or `data` of a mutation request. To do this, you can use the `reset` function to handle this:

```js
const CreateTodo = () => {
  const [title, setTitle] = useState('')
  const mutation = useMutation(createTodo)

  const onCreateTodo = e => {
    e.preventDefault()
    mutation.mutate({ title })
  }

  return (
    <form onSubmit={onCreateTodo}>
      {mutation.error && (
        <h5 onClick={() => mutation.reset()}>{mutation.error}</h5>
      )}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <br />
      <button type="submit">Create Todo</button>
    </form>
  )
}
```

## Mutation Side Effects

`useMutation` comes with some helper options that allow quick and easy side-effects at any stage during the mutation lifecycle. These come in handy for both [invalidating and refetching queries after mutations](../invalidations-from-mutations) and even [optimistic updates](../optimistic-updates)

```js
useMutation(addTodo, {
  onMutate: variables => {
    // A mutation is about to happen!

    // Optionally return a context object with a rollback function
    return {
      rollback: () => {
        // do some rollback logic
      },
    }
  },
  onError: (error, variables, context) => {
    // An error happened!
    if (context.rollback) {
      context.rollback()
    }
  },
  onSuccess: (data, variables, context) => {
    // Boom baby!
  },
  onSettled: (data, error, variables, context) => {
    // Error or success... doesn't matter!
  },
})
```

When returning a promise in any of the callback functions it will first be awaited before the next callback is called:

```js
useMutation(addTodo, {
  onSuccess: async () => {
    console.log("I'm first!")
  },
  onSettled: async () => {
    console.log("I'm second!")
  },
})
```

You might find that you want to **add additional side-effects** to some of the `useMutation` lifecycle at the time of calling `mutate`. To do that, you can provide any of the same callback options to the `mutate` function after your mutation variable. Supported option overrides include:

- `onSuccess` - Will be fired after the `useMutation`-level `onSuccess` handler
- `onError` - Will be fired after the `useMutation`-level `onError` handler
- `onSettled` - Will be fired after the `useMutation`-level `onSettled` handler

```js
useMutation(addTodo, {
  onSuccess: (data, variables, context) => {
    // I will fire first
  },
  onError: (error, variables, context) => {
    // I will fire first
  },
  onSettled: (data, error, variables, context) => {
    // I will fire first
  },
})

mutate(todo, {
  onSuccess: (data, variables, context) => {
    // I will fire second!
  },
  onError: (error, variables, context) => {
    // I will fire second!
  },
  onSettled: (data, error, variables, context) => {
    // I will fire second!
  },
})
```

## Promises

Use `mutateAsync` instead of `mutate` to get a promise which will resolve on success or throw on an error:

```js
const mutation = useMutation(addTodo)

try {
  const todo = await mutation.mutateAsync(todo)
  console.log(todo)
} catch (error) {
  console.error(error)
}
```
