---
id: useMutationState
title: useMutationState
---

```ts
function useMutationState<TResult, TMutation>(options, queryClient?): Readonly<Ref<TResult[]>>;
```

Defined in: [packages/vue-query/src/useMutationState.ts:192](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L192)

`useMutationState` is a composable that gives you access to all mutations in the `MutationCache`. You can
pass `filters` ([MutationFilters](../type-aliases/MutationFilters.md)) to narrow down your mutations, and `select` to transform the
mutation state.

`options` may be a plain object or a reactive getter (`() => ({ ... })`) — pass a getter if the filters
themselves depend on other reactive state.

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Parameters

### options

The `filters` to narrow down matched mutations, and an optional `select` to transform the
mutation state.

[`MutationStateOptions`](../type-aliases/MutationStateOptions.md)\<`TResult`, `TMutation`\> | () => [`MutationStateOptions`](../type-aliases/MutationStateOptions.md)\<`TResult`, `TMutation`\>

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

## Returns

`Readonly`\<`Ref`\<`TResult`[]\>\>

A `ref` to an Array of whatever `select` returns for each matching mutation.

## Examples

Get all variables of all running mutations:
```vue
<script setup lang="ts">
import { useMutationState } from '@tanstack/vue-query'

const pendingVariables = useMutationState({
  filters: { status: 'pending' },
  select: (mutation) => mutation.state.variables,
})
</script>

<template>{{ pendingVariables.length }} posts saving...</template>
```

Get all data for specific mutations via the `mutationKey`:
```vue
<script setup lang="ts">
import { useMutation, useMutationState } from '@tanstack/vue-query'

const mutationKey = ['posts']

// Some mutation that we want to get the state for
const mutation = useMutation({
  mutationKey,
  mutationFn: createPosts,
})

const savedPosts = useMutationState({
  // this mutation key needs to match the mutation key of the given mutation (see above)
  filters: { mutationKey, status: 'success' },
  select: (mutation) => mutation.state.data,
})
</script>

<template>
  <button @click="mutation.mutate(['New Post'])">
    Create post ({{ savedPosts.length }} saved so far)
  </button>
</template>
```

Access the latest successful mutation data via the `mutationKey`. Each invocation of `mutate` adds a new
entry to the mutation cache for `gcTime` milliseconds — with the `status: 'success'` filter below, check the
last item that `useMutationState` returns to get the latest successful invocation:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useMutationState } from '@tanstack/vue-query'

const savedPosts = useMutationState({
  filters: { mutationKey: ['posts'], status: 'success' },
  select: (mutation) => mutation.state.data,
})

const latestSavedPost = computed(() => savedPosts.value[savedPosts.value.length - 1])
</script>

<template>{{ latestSavedPost ? 'Saved' : 'Nothing saved yet' }}</template>
```
