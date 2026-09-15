---
id: useMutationState
title: useMutationState
redirect_from:
  - framework/react/reference/useMutationState
---

```ts
function useMutationState<TResult, TMutation>(options, queryClient?): TResult[];
```

Defined in: [packages/react-query/src/useMutationState.ts:157](https://github.com/TanStack/query/blob/main/packages/react-query/src/useMutationState.ts#L157)

`useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass
`filters` ([MutationFilters](../interfaces/MutationFilters.md)) to narrow down your mutations, and `select` to transform the mutation
state.

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Parameters

### options

`MutationStateOptions`\<`TResult`, `TMutation`\> = `{}`

The `filters` to narrow down matched mutations, and an optional `select` to transform the
mutation state.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`TResult`[]

Will be an Array of whatever `select` returns for each matching mutation.

## Examples

Get all variables of all running mutations:
```tsx
import { useMutationState } from '@tanstack/react-query'

function PendingPosts() {
  const pendingVariables = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.variables,
  })

  return <>{pendingVariables.length} posts saving...</>
}
```

Get all data for specific mutations via the `mutationKey`:
```tsx
import { useMutation, useMutationState } from '@tanstack/react-query'

const mutationKey = ['posts']

function Posts() {
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

  return (
    <button onClick={() => mutation.mutate(['New Post'])}>
      Create post ({savedPosts.length} saved so far)
    </button>
  )
}
```

Access the latest successful mutation data via the `mutationKey`. Each invocation of `mutate` adds a new
entry to the mutation cache for `gcTime` milliseconds — with the `status: 'success'` filter below, check the
last item that `useMutationState` returns to get the latest successful invocation:
```tsx
import { useMutationState } from '@tanstack/react-query'

function LatestPost() {
  const savedPosts = useMutationState({
    filters: { mutationKey: ['posts'], status: 'success' },
    select: (mutation) => mutation.state.data,
  })

  const latestSavedPost = savedPosts[savedPosts.length - 1]

  return <>{latestSavedPost ? 'Saved' : 'Nothing saved yet'}</>
}
```
