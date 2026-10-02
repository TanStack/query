---
id: useMutationState
title: useMutationState
---

```ts
function useMutationState<TResult, TMutation>(options: MutationStateOptions<TResult, TMutation>, queryClient?: QueryClient): TResult[];
```

Defined in: [packages/svelte-query/src/useMutationState.svelte.ts:100](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useMutationState.svelte.ts#L100)

`useMutationState` is a function that gives you access to all mutations in the `MutationCache`. You can pass
`filters` ([MutationFilters](../interfaces/MutationFilters.md)) to narrow down your mutations, and `select` to transform the mutation
state.

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = [`MutationTypeFromResult`](../type-aliases/MutationTypeFromResult.md)\<`TResult`\>

## Parameters

### options

[`MutationStateOptions`](../type-aliases/MutationStateOptions.md)\<`TResult`, `TMutation`\> = `{}`

The `filters` to narrow down matched mutations, and an optional `select` to transform the
mutation state.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`TResult`[]

An Array of whatever `select` returns for each matching mutation.

## Examples

Get all variables of all running mutations:
```svelte
<script lang="ts">
  import { useMutationState } from '@tanstack/svelte-query'

  const pendingVariables = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.variables,
  })
</script>

{pendingVariables.length} posts saving...
```

Get all data for specific mutations via the `mutationKey`:
```svelte
<script lang="ts">
  import { createMutation, useMutationState } from '@tanstack/svelte-query'

  const mutationKey = ['posts']

  // Some mutation that we want to get the state for
  const mutation = createMutation(() => ({
    mutationKey,
    mutationFn: createPosts,
  }))

  const savedPosts = useMutationState({
    // this mutation key needs to match the mutation key of the given mutation (see above)
    filters: { mutationKey, status: 'success' },
    select: (mutation) => mutation.state.data,
  })
</script>

<button onclick={() => mutation.mutate(['New Post'])}>
  Create post ({savedPosts.length} saved so far)
</button>
```

Access the latest mutation data via the `mutationKey`. Each invocation of `mutate` adds a new entry to the
mutation cache for `gcTime` milliseconds — check the last item that `useMutationState` returns to get the
latest successful mutation (the `status: 'success'` filter above excludes pending/errored ones):
```svelte
<script lang="ts">
  import { useMutationState } from '@tanstack/svelte-query'

  const savedPosts = useMutationState({
    filters: { mutationKey: ['posts'], status: 'success' },
    select: (mutation) => mutation.state.data,
  })

  const latestSavedPost = $derived(savedPosts[savedPosts.length - 1])
</script>

{latestSavedPost ? 'Saved' : 'Nothing saved yet'}
```
