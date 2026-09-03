---
id: useMutation
title: useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(mutationOptions, queryClient?): UseMutationReturnType<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [vue-query/src/useMutation.ts:134](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L134)

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
`useMutation` is the composable for that.

`mutationOptions` may be a plain object, a `ref`, or a reactive getter (`() => ({ ... })`) — pass a getter
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

### mutationOptions

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
mutation definition. Hook-level callbacks (passed to `mutationOptions`) fire for every mutation; per-call
callbacks fire only for the latest call you've made.

## See

[mutationOptions](#usemutation) to share these options across multiple `useMutation` call sites, or to look
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
