---
id: MutationCache
title: MutationCache
---

The `MutationCache` is the storage for mutations.

**Normally, you will not interact with the MutationCache directly and instead use the `QueryClient`.**

```tsx
import { MutationCache } from '@tanstack/react-query'

const mutationCache = new MutationCache({
  onError: (error) => {
    console.log(error)
  },
  onSuccess: (data) => {
    console.log(data)
  },
})
```

Its available methods are:

- [`getAll`](#mutationcachegetall)
- [`subscribe`](#mutationcachesubscribe)
- [`clear`](#mutationcacheclear)

**Options**

- `onError?: (error: unknown, variables: unknown, context: unknown, mutation: Mutation) => Promise<void> | void`
  - Optional
  - This function will be called if some mutation encounters an error.
  - If you return a Promise from it, it will be awaited
- `onSuccess?: (data: unknown, variables: unknown, context: unknown, mutation: Mutation) => Promise<void> | void`
  - Optional
  - This function will be called if some mutation is successful.
  - If you return a Promise from it, it will be awaited
- `onSettled?: (data: unknown | undefined, error: unknown | null, variables: unknown, context: unknown, mutation: Mutation) => Promise<void> | void`
  - Optional
  - This function will be called if some mutation is settled (either successful or errored).
  - If you return a Promise from it, it will be awaited
- `onMutate?: (variables: unknown, mutation: Mutation) => Promise<void> | void`
  - Optional
  - This function will be called before some mutation executes.
  - If you return a Promise from it, it will be awaited

## Global callbacks

The `onError`, `onSuccess`, `onSettled` and `onMutate` callbacks on the MutationCache can be used to handle these events on a global level. They are different to `defaultOptions` provided to the QueryClient because:

- `defaultOptions` can be overridden by each Mutation - the global callbacks will **always** be called.
- `onMutate` does not allow returning a context value.

## `mutationCache.getAll`

`getAll` returns all mutations within the cache.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a mutation in rare scenarios

```tsx
const mutations = mutationCache.getAll()
```

**Returns**

- `Mutation[]`
  - Mutation instances from the cache

## `mutationCache.subscribe`

The `subscribe` method can be used to subscribe to the mutation cache as a whole and be informed of safe/known updates to the cache like mutation states changing or mutations being updated, added or removed.

```tsx
const callback = (event) => {
  console.log(event.type, event.mutation)
}

const unsubscribe = mutationCache.subscribe(callback)
```

**Options**

- `callback: (mutation?: MutationCacheNotifyEvent) => void`
  - This function will be called with the mutation cache any time it is updated.

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the mutation cache.

## `mutationCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```tsx
mutationCache.clear()
```
