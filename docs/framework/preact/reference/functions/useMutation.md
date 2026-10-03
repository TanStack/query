---
id: useMutation
title: useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, queryClient?: QueryClient): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/preact-query/src/useMutation.ts:192](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutation.ts#L192)

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
`useMutation` is the hook for that.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### options

[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The [UseMutationOptions](../interfaces/UseMutationOptions.md) to use — everything you can pass to `useMutation`.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="options-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that an unused/inactive mutation remains in memory before it is garbage collected. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. |
| <a id="options-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on the mutation cache entry. Use it to pass information that can be read wherever the `mutation` is available, such as the `onError` and `onSuccess` callbacks of the `MutationCache`. |
| <a id="options-mutationfn"></a> `mutationFn?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `Promise`\<`TData`\> | `undefined` | The function that performs the asynchronous task this mutation runs. Required, unless a default mutation function has been set for the matching `mutationKey` via `queryClient.setMutationDefaults`. Receives the `variables` passed to `mutate`, and a [MutationFunctionContext](../type-aliases/MutationFunctionContext.md) holding the `QueryClient`, the `mutationKey` and `meta`. Must return a promise that resolves the mutation's data. |
| <a id="options-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | `undefined` | The key to use for this mutation. Optional, but required to inherit defaults registered with `queryClient.setMutationDefaults`, and to match this mutation with `useMutationState` or `queryClient.isMutating`. |
| <a id="options-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a mutation is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="options-onerror"></a> `onError?` | (`error`: `TError`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation encounters an error, and is passed the error. If a promise is returned, it is awaited before `onSettled` runs. |
| <a id="options-onmutate"></a> `onMutate?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `TOnMutateResult` \| `Promise`\<`TOnMutateResult`\> | `undefined` | This function fires before the mutation function runs, and receives the same variables. Useful for optimistic updates applied in the hope that the mutation succeeds. The value it returns is passed to `onSuccess`, `onError` and `onSettled` as `onMutateResult`, which is where an optimistic update is usually rolled back. If a promise is returned, it is awaited before the mutation function runs. |
| <a id="options-onsettled"></a> `onSettled?` | (`data`: `TData` \| `undefined`, `error`: `TError` \| `null`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation either succeeds or errors, and is passed either the data or the error. If a promise is returned, it is awaited before the mutation settles. |
| <a id="options-onsuccess"></a> `onSuccess?` | (`data`: `TData`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation succeeds, and is passed the mutation's result. If a promise is returned, it is awaited before `onSettled` runs. |
| <a id="options-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| (`failureCount`: `number`, `error`: `TError`) => `boolean` | `0` | If `false`, failed mutations will not retry by default. If `true`, failed mutations will retry infinitely. If set to an integer number, e.g. 3, failed mutations will retry until the failed mutation count meets that number. If set to a function `(failureCount, error) => boolean` failed mutations will retry until the function returns false. |
| <a id="options-retrydelay"></a> `retryDelay?` | `number` \| (`failureCount`: `number`, `error`: `TError`) => `number` | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="options-scope"></a> `scope?` | [`MutationScope`](../type-aliases/MutationScope.md) | `undefined` | Controls whether this mutation runs alongside others or waits its turn. Mutations sharing the same `scope.id` run serially, in the order they were started. Without a scope, a mutation runs as soon as it is triggered. |
| <a id="options-throwonerror"></a> `throwOnError?` | `boolean` \| (`error`: `TError`) => `boolean` | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true`, all errors will be thrown to the nearest error boundary. If set to a function, it will be passed the error and should return a boolean indicating whether to throw the error (`true`) or return it as state (`false`). |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`UseMutationResult`](../type-aliases/UseMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

`mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
mutation definition. Hook-level callbacks (passed to `options`) fire for every mutation; per-call callbacks
fire only for the latest call you've made, and only while the component is still mounted — unmounting before
the mutation settles removes the subscription and prevents them from firing.

<a id="result-properties"></a>

### Result properties

Built from [`MutationObserverBaseResult`](../interfaces/MutationObserverBaseResult.md#properties). See the type above for what it changes.

## See

[mutationOptions](mutationOptions.md) to share these options across multiple `useMutation` call sites, or to look
the mutation up elsewhere via its `mutationKey` (e.g. with `useMutationState`).

## Examples

```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  return (
    <button
      onClick={() =>
        addMutation.mutate('Item', {
          onError: (error) => console.error('Failed to add item:', error),
        })
      }
    >
      Add
    </button>
  )
}
```

Rendering the mutation's own state, rather than just firing it off:
```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  return (
    <div>
      {addMutation.isPending ? (
        'Adding todo...'
      ) : (
        <>
          {addMutation.isError ? (
            <div>An error occurred: {addMutation.error.message}</div>
          ) : null}
          <button onClick={() => addMutation.mutate('Item')}>Add</button>
        </>
      )}
    </div>
  )
}
```

Optimistic update via `onMutate`, rolling back on `onError`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData<Array<string>>(['todos'])

      queryClient.setQueryData<Array<string>>(['todos'], (old) => [
        ...(old ?? []),
        newTodo,
      ])

      // Passed to `onError` as `onMutateResult` if the mutation fails.
      return { previousTodos }
    },
    onError: (_err, _newTodo, onMutateResult) => {
      queryClient.setQueryData(['todos'], onMutateResult?.previousTodos)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button onClick={() => addMutation.mutate('Item')}>Add</button>
  )
}
```

Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
promise per call instead, so you can wait for all of them when they succeed:
```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodos() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  async function handleAddAll(todos: Array<string>) {
    try {
      await Promise.all(todos.map((todo) => addMutation.mutateAsync(todo)))
    } catch (error) {
      console.error('Failed to add todos:', error)
    }
  }

  return (
    <button onClick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
      Add all
    </button>
  )
}
```

If some of the mutations above can fail independently of the others, and you want to know which ones
did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
`Promise.allSettled`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodos() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  async function handleAddAll(todos: Array<string>) {
    const addResults = await Promise.allSettled(
      todos.map((todo) => addMutation.mutateAsync(todo)),
    )

    addResults.forEach((addResult, index) => {
      if (addResult.status === 'rejected') {
        console.error(`Failed to add "${todos[index]}":`, addResult.reason)
      }
    })
  }

  return (
    <button onClick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
      Add all
    </button>
  )
}
```
