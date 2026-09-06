---
id: useMutation
title: useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options, queryClient?): UseMutationReturnType<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [vue-query/src/useMutation.ts:231](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L231)

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
`useMutation` is the composable for that.

`options` may be a plain object, a `ref`, or a reactive getter (`() => ({ ... })`) — pass a getter
if the options themselves depend on other reactive state.

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

[`UseMutationOptions`](../type-aliases/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The [UseMutationOptions](../type-aliases/UseMutationOptions.md) to use — everything you can pass to `useMutation`.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

## Returns

[`UseMutationReturnType`](../type-aliases/UseMutationReturnType.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

`mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
mutation definition. Hook-level callbacks (passed to `options`) fire for every mutation; per-call
callbacks fire only for the latest call you've made.

## See

[mutationOptions](mutationOptions.md) to share these options across multiple `useMutation` call sites, or to look
the mutation up elsewhere via its `mutationKey` (e.g. with `useMutationState`).

## Examples

```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const addMutation = useMutation({
  mutationFn: addTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

function onAdd() {
  addMutation.mutate('Item', {
    onError: (error) => console.error('Failed to add item:', error),
  })
}
</script>

<template>
  <button @click="onAdd">Add</button>
</template>
```

Rendering the mutation's own state, rather than just firing it off:
```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const addMutation = useMutation({
  mutationFn: addTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
</script>

<template>
  <div v-if="addMutation.isPending.value">Adding todo...</div>
  <div v-else>
    <div v-if="addMutation.isError.value">An error occurred: {{ addMutation.error.value.message }}</div>
    <button @click="addMutation.mutate('Item')">Add</button>
  </div>
</template>
```

Optimistic update via `onMutate`, rolling back on `onError`:
```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const addMutation = useMutation({
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
})
</script>

<template>
  <button @click="addMutation.mutate('Item')">Add</button>
</template>
```

Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
promise per call instead, so you can wait for all of them when they succeed:
```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

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
</script>

<template>
  <button @click="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
</template>
```

If some of the mutations above can fail independently of the others, and you want to know which ones
did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
`Promise.allSettled`:
```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

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
</script>

<template>
  <button @click="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
</template>
```
