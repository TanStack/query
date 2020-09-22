---
id: invalidation-from-mutations
title: Invalidation from Mutations
---

Invalidating queries is only half the battle. Knowing **when** to invalidate them is the other half. Usually when a mutation in your app succeeds, it's VERY likely that there are related queries in your application that need to be invalidated and possibly refetched to account for the new changes from your mutation.

For example, assume we have a mutation to post a new todo:

```js
const [mutate] = useMutation(postTodo)
```

When a successful `postTodo` mutation happens, we likely want all `todos` queries to get invalidated and possibly refetched to show the new todo item. To do this, you can use `useMutation`'s `onSuccess` options and the `queryCache`'s `invalidateQueries` function:

```js
import { useMutation, useQueryCache } from 'react-query'

const queryCache = useQueryCache()

// When this mutation succeeds, invalidate any queries with the `todos` or `reminders` query key
const [mutate] = useMutation(addTodo, {
  onSuccess: () => {
    queryCache.invalidateQueries('todos')
    queryCache.invalidateQueries('reminders')
  },
})
```

You can wire up your invalidations to happen using any of the following side-effect callbacks:

```js
const [mutate] = useMutation(addTodo, {
  onError: () => {
    // An error happened!
  },
  onSuccess: () => {
    // Boom baby!
  },
  onSettled: () => {
    // Error or success... doesn't matter!
  },
})
```

The promise returned by `mutate()` can be helpful as well for performing more granular control flow in your app, and if you prefer that that promise only resolves **after** the `onSuccess` or `onSettled` callbacks, you can return a promise in either!:

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: async () => {
    console.log("I'm first!")
  },
  onSettled: async () => {
    console.log("I'm second!")
  }
})

const run = async () => {
  try {
    await mutate(todo)
    console.log("I'm third!")
  } catch {}
}
```

You might find that you want to **add additional side-effects** to some of the `useMutation` lifecycle at the time of calling `mutate`. To do that, you can provide any of the same callback options to the `mutate` function after your mutation variable. Supported option overrides include:

- `onSuccess` - Will be fired after the `useMutation`-level `onSuccess` handler
- `onError` - Will be fired after the `useMutation`-level `onError` handler
- `onSettled` - Will be fired after the `useMutation`-level `onSettled` handler
- `throwOnError`

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: (data, mutationVariables) => {
    // I will fire first
  },
  onSettled: (data, error, mutationVariables) => {
    // I will fire first
  },
  onError: (error, mutationVariables) => {
    // I will fire first
  },
})

mutate(todo, {
  onSuccess: (data, mutationVariables) => {
    // I will fire second!
  },
  onSettled: (data, error, mutationVariables) => {
    // I will fire second!
  },
  onError: (error, mutationVariables) => {
    // I will fire second!
  },
  throwOnError: true,
})
```
