---
id: createMutation
title: createMutation
---

```ts
function createMutation<TData, TError, TVariables, TContext>(options, queryClient?): CreateMutationResult<TData, TError, TVariables, TContext>;
```

Defined in: [packages/svelte-query/src/createMutation.svelte.ts:171](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createMutation.svelte.ts#L171)

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
`createMutation` is the function for that.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TContext

`TContext` = `unknown`

## Parameters

### options

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TContext`\>\>

The [CreateMutationOptions](../type-aliases/CreateMutationOptions.md) to use, wrapped in an [Accessor](../type-aliases/Accessor.md) so options can be
reactive.

### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<`QueryClient`\>

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`\>

`mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
mutation definition. If you make multiple requests, `onSuccess` will fire only after the latest call you've
made.

## See

[mutationOptions](mutationOptions.md) to share these options across multiple `createMutation` call sites, or to look
the mutation up elsewhere via its `mutationKey` (e.g. with `useMutationState`).

## Examples

```svelte
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()

  const addMutation = createMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))
</script>

<button
  onclick={() =>
    addMutation.mutate('Item', {
      onError: (error) => console.error('Failed to add item:', error),
    })
  }
>
  Add
</button>
```

Rendering the mutation's own state, rather than just firing it off:
```svelte
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()

  const addMutation = createMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))
</script>

{#if addMutation.isPending}
  Adding todo...
{:else}
  {#if addMutation.isError}
    <div>An error occurred: {addMutation.error.message}</div>
  {/if}
  <button onclick={() => addMutation.mutate('Item')}>Add</button>
{/if}
```

Optimistic update via `onMutate`, rolling back on `onError`:
```svelte
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()

  const addMutation = createMutation(() => ({
    mutationFn: addTodo,
    onMutate: async (newTodo: string) => {
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
  }))
</script>

<button onclick={() => addMutation.mutate('Item')}>Add</button>
```

Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
promise per call instead, so you can wait for all of them when they succeed:
```svelte
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()

  const addMutation = createMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

  async function handleAddAll(todos: Array<string>) {
    try {
      await Promise.all(todos.map((todo) => addMutation.mutateAsync(todo)))
    } catch (error) {
      console.error('Failed to add todos:', error)
    }
  }
</script>

<button onclick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
  Add all
</button>
```

If some of the mutations above can fail independently of the others, and you want to know which ones
did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
`Promise.allSettled`:
```svelte
<script lang="ts">
  import { createMutation, useQueryClient } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()

  const addMutation = createMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

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
</script>

<button onclick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
  Add all
</button>
```
