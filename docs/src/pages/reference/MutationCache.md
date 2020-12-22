---
id: MutationCache
title: MutationCache
---

The `MutationCache` is the storage for mutations.

**Normally, you will not interact with the MutationCache directly and instead use the `QueryClient`.**

```js
import { MutationCache } from 'react-query'

const mutationCache = new MutationCache({
  onError: error => {
    console.log(error)
  },
})
```

Its available methods are:

- [`getAll`](#mutationcachegetall)
- [`subscribe`](#mutationcachesubscribe)
- [`clear`](#mutationcacheclear)

**Options**

- `onError?: (error: unknown, variables: unknown, context: unknown, mutation: Mutation) => void`
  - Optional
  - This function will be called if some mutation encounters an error.

## `mutationCache.getAll`

`getAll` returns all mutations within the cache.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a mutation in rare scenarios

```js
const mutations = mutationCache.getAll()
```

**Returns**

- `Mutation[]`
  - Mutation instances from the cache

## `mutationCache.subscribe`

The `subscribe` method can be used to subscribe to the mutation cache as a whole and be informed of safe/known updates to the cache like mutation states changing or mutations being updated, added or removed.

```js
const callback = mutation => {
  console.log(mutation)
}

const unsubscribe = mutationCache.subscribe(callback)
```

**Options**

- `callback: (mutation?: Mutation) => void`
  - This function will be called with the mutation cache any time it is updated.

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the mutation cache.

## `mutationCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```js
mutationCache.clear()
```
