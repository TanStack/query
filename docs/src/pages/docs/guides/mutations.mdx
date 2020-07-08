---
id: mutations
title: Mutations
---

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects. For this purpose, React Query exports a `useMutation` hook.

## Basic Mutations

Assuming the server implements a ping mutation, that returns "pong" string, here's an example of the most basic mutation:

```js
const PingPong = () => {
  const [mutate, { status, data, error }] = useMutation(pingMutation)

  const onPing = async () => {
    try {
      const data = await mutate()
      console.log(data)
      // { ping: 'pong' }
    } catch {
      // Uh oh, something went wrong
    }
  }
  return <button onClick={onPing}>Ping</button>
}
```

Just as with `useQuery` you can also use booleans if you'd like:

```js
const [
  mutate,
  { isIdle, isLoading, isError, isSuccess, data, error },
] = useMutation(pingMutation)
```

Mutations without variables are not that useful, so let's add some variables to closer match reality.

## Mutation Variables

To pass `variables` to your `mutate` function, call `mutate` with an object.

```js
// Notice how the fetcher function receives an object containing
// all possible variables
const createTodo = ({ title }) => {
  /* trigger an http request */
}

const CreateTodo = () => {
  const [title, setTitle] = useState('')
  const [mutate] = useMutation(createTodo)

  const onCreateTodo = async e => {
    // Prevent the form from refreshing the page
    e.preventDefault()

    try {
      await mutate({ title })
      // Todo was successfully created
    } catch (error) {
      // Uh oh, something went wrong
    }
  }

  return (
    <form onSubmit={onCreateTodo}>
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

Even with just variables, mutations aren't all that special, but when used with the `onSuccess` option, the [Query Cache's `invalidateQueries` method](#querycacheinvalidatequeries) and the [Query Cache's `setQueryData` method](#querycachesetquerydata), mutations become a very powerful tool.

Note that since version 1.1.0, the `mutate` function is no longer called synchronously so you cannot use it in an event callback. If you need to access the event in `onSubmit` you need to wrap `mutate` in another function. This is due to [React event pooling](https://reactjs.org/docs/events.html#event-pooling).

```js
// This will not work
const CreateTodo = () => {
  const [mutate] = useMutation(event => {
    event.preventDefault()
    fetch('/api', new FormData(event.target))
  })

  return <form onSubmit={mutate}>...</form>
}

// This will work
const CreateTodo = () => {
  const [mutate] = useMutation(formData => {
    fetch('/api', formData)
  })
  const onSubmit = event => {
    event.preventDefault()
    mutate(new FormData(event.target))
  }

  return <form onSubmit={onSubmit}>...</form>
}
```

## Resetting Mutation State

It's sometimes the case that you need to clear the `error` or `data` of a mutation request. To do this, you can use the `reset` function to handle this:

```js
const CreateTodo = () => {
  const [title, setTitle] = useState('')
  const [mutate, { error, reset }] = useMutation(createTodo)

  const onCreateTodo = async e => {
    e.preventDefault()
    await mutate({ title })
  }

  return (
    <form onSubmit={onCreateTodo}>
      {error && <h5 onClick={() => reset()}>{error}</h5>}
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
