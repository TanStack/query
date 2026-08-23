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

- [`getAll`](#mutationcache-getall)
- [`subscribe`](#mutationcache-subscribe)
- [`clear`](#mutationcache-clear)

**Options**

- `onError?: (error: unknown, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called if some mutation encounters an error.
  - If you return a Promise from it, it will be awaited
- `onSuccess?: (data: unknown, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called if some mutation is successful.
  - If you return a Promise from it, it will be awaited
- `onSettled?: (data: unknown | undefined, error: unknown | null, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called if some mutation is settled (either successful or errored).
  - If you return a Promise from it, it will be awaited
- `onMutate?: (variables: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
  - Optional
  - This function will be called before some mutation executes.
  - If you return a Promise from it, it will be awaited

## Global callbacks

The `onError`, `onSuccess`, `onSettled` and `onMutate` callbacks on the MutationCache can be used to handle these events on a global level. They are different to `defaultOptions` provided to the QueryClient because:

- `defaultOptions` can be overridden by each Mutation - the global callbacks will **always** be called.
- `onMutate` does not allow returning a result.

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

The callback receives a discriminated union. Check `event.type` to narrow the event and access its additional properties:

| `event.type`             | When it is emitted                      | Properties                                          |
| ------------------------ | --------------------------------------- | --------------------------------------------------- |
| `added`                  | A mutation is added to the cache        | `mutation: Mutation`                                |
| `removed`                | A mutation is removed from the cache    | `mutation: Mutation`                                |
| `updated`                | A mutation's state changes              | `mutation: Mutation`, `action`                      |
| `observerAdded`          | An observer starts observing a mutation | `mutation: Mutation`, `observer: MutationObserver`  |
| `observerRemoved`        | An observer stops observing a mutation  | `mutation: Mutation`, `observer: MutationObserver`  |
| `observerOptionsUpdated` | An observer's options change            | `mutation?: Mutation`, `observer: MutationObserver` |

When `event.type` is `updated`, `event.action.type` describes the state change:

| `event.action.type` | State change                                     | Additional properties                                                      |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `pending`           | A mutation starts or its pending context changes | `isPaused: boolean`, `variables?: TVariables`, `context?: TOnMutateResult` |
| `success`           | A mutation succeeds                              | `data: TData`                                                              |
| `error`             | A mutation finishes with an error                | `error: TError`                                                            |
| `failed`            | A mutation attempt fails and may be retried      | `failureCount: number`, `error: TError \| null`                            |
| `pause`             | A mutation is paused                             |                                                                            |
| `continue`          | A paused mutation resumes                        |                                                                            |

For example, you can detect when a paused mutation resumes:

```tsx
const unsubscribe = mutationCache.subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'continue') {
    console.log('Mutation resumed', event.mutation.mutationId)
  }
})
```

**Options**

- `callback: (event: MutationCacheNotifyEvent) => void`
  - This function will be called with the mutation cache any time it is updated.

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the mutation cache.

## `mutationCache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```tsx
mutationCache.clear()
```
